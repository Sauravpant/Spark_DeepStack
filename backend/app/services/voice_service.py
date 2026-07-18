"""Vyapar Voice — STT, Gemini extraction, product matching, DB persistence."""

from __future__ import annotations

import logging
import os
import re
import shutil
import tempfile
import uuid
from datetime import date
from difflib import SequenceMatcher
from typing import Optional

import edge_tts
import numpy as np
from pydub import AudioSegment
from pydub.effects import normalize
from pydub.silence import detect_nonsilent
from pydantic import BaseModel
from fastapi import HTTPException, UploadFile, status
from google import genai
from google.genai import types
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.enums import PaymentType, TransactionType
from app.models.customer import Customer
from app.models.product import Product
from app.models.user import User
from app.schemas.transaction import TransactionCreateRequest, TransactionItemCreateRequest
from app.schemas.product import StockAdjustRequest
from app.schemas.voice import (
    VoiceAction,
    VoiceConfirmRequest,
    VoiceConfirmResponse,
    VoiceExtractRequest,
    VoiceExtractResponse,
    VoiceLineItem,
    VoiceProcessedItem,
    VoiceTransactionEntry,
    SingleTransactionConfirm,
)
from app.services import product_service, transaction_service, customer_service

logger = logging.getLogger(__name__)

GEMINI_MODEL = "gemini-3.5-flash"
TTS_VOICE = "ne-NP-SagarNeural"

# --- Audio preprocessing tuning ---
STT_TARGET_SAMPLE_RATE = 16000
STT_MIN_SILENCE_LEN_MS = 300
STT_SILENCE_THRESH_OFFSET_DB = 16  # relative to clip's own dBFS
STT_SILENCE_PADDING_MS = 150
STT_DENOISE_PROP_DECREASE = 0.75
STT_ENABLE_DENOISE = True  # flip off if latency matters more than accuracy

_stt_client = None
_ai_client = None


def _get_stt_client():
    global _stt_client
    if _stt_client is None and settings.ELEVEN_LABS_API_KEY:
        try:
            from elevenlabs.client import ElevenLabs

            _stt_client = ElevenLabs(api_key=settings.ELEVEN_LABS_API_KEY)
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"ElevenLabs not available: {exc}",
            )
    return _stt_client


def _get_ai_client():
    global _ai_client
    if _ai_client is None:
        if not settings.GEMINI_API_KEY:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="GEMINI_API_KEY is not configured",
            )
        os.environ.setdefault("GEMINI_API_KEY", settings.GEMINI_API_KEY)
        _ai_client = genai.Client()
    return _ai_client


def sanitize_extracted_response(
    *,
    items: list[VoiceLineItem],
    customer_name: Optional[str] = None,
    payment_type: Optional[str] = "cash",
    notes: Optional[str] = None,
    transactions: Optional[list[VoiceTransactionEntry]] = None,
    raw_transcript: Optional[str] = None,
) -> VoiceExtractResponse:
    """Strip any credit/customer inference from voice extraction results."""
    sanitized_transactions = []
    for tx in transactions or []:
        sanitized_transactions.append(
            VoiceTransactionEntry(
                action=tx.action,
                items=tx.items,
                customer_name=None,
                payment_type="cash",
                due_date=None,
                notes=None,
            )
        )

    return VoiceExtractResponse(
        items=items,
        customer_name=None,
        payment_type="cash",
        notes=None,
        transactions=sanitized_transactions or None,
        raw_transcript=raw_transcript,
    )


async def synthesize_speech(text: str) -> bytes:
    communicate = edge_tts.Communicate(
        text=text,
        voice=TTS_VOICE,
        rate="-2%",
        pitch="+5Hz",
    )
    audio_bytes = b""
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            audio_bytes += chunk["data"]
    return audio_bytes


def _denoise(audio: AudioSegment, sr: int) -> AudioSegment:
    """Light noise reduction for ambient shop-floor noise (chatter, fans, traffic)."""
    try:
        import noisereduce as nr
    except ImportError:
        logger.warning("noisereduce not installed, skipping denoise step")
        return audio

    samples = np.array(audio.get_array_of_samples()).astype(np.float32)
    reduced = nr.reduce_noise(
        y=samples,
        sr=sr,
        stationary=False,
        prop_decrease=STT_DENOISE_PROP_DECREASE,
    )
    reduced = np.clip(reduced, -32768, 32767).astype(np.int16)

    return AudioSegment(
        reduced.tobytes(),
        frame_rate=sr,
        sample_width=2,
        channels=1,
    )


def preprocess_audio(input_path: str, target_sr: int = STT_TARGET_SAMPLE_RATE) -> str:
    """
    Clean up shop-floor audio before STT:
      - mono + resample to 16kHz (matches STT model training)
      - loudness normalization (mobile mic gain varies a lot)
      - trim leading/trailing silence with small padding
      - optional noise reduction

    Returns the path to a cleaned WAV file. Falls back to the original
    file if preprocessing fails for any reason, so a bad clip never
    blocks transcription entirely.
    """
    try:
        audio = AudioSegment.from_file(input_path)

        # 1. Mono + resample
        audio = audio.set_channels(1).set_frame_rate(target_sr)

        # 2. Normalize loudness
        audio = normalize(audio)

        # 3. Trim silence, keep a little padding so words aren't clipped
        nonsilent_ranges = detect_nonsilent(
            audio,
            min_silence_len=STT_MIN_SILENCE_LEN_MS,
            silence_thresh=audio.dBFS - STT_SILENCE_THRESH_OFFSET_DB,
        )
        if nonsilent_ranges:
            start = max(0, nonsilent_ranges[0][0] - STT_SILENCE_PADDING_MS)
            end = min(len(audio), nonsilent_ranges[-1][1] + STT_SILENCE_PADDING_MS)
            audio = audio[start:end]

        # 4. Optional denoise
        if STT_ENABLE_DENOISE:
            audio = _denoise(audio, target_sr)

        out_path = input_path.rsplit(".", 1)[0] + "_clean.wav"
        audio.export(out_path, format="wav")
        return out_path

    except Exception as exc:
        logger.warning("Audio preprocessing failed, using original file: %s", exc)
        return input_path


async def transcribe_audio(audio: UploadFile) -> str:
    client = _get_stt_client()
    if client is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="ELEVEN_LABS_API_KEY is not configured",
        )

    suffix = os.path.splitext(audio.filename or "audio.webm")[1] or ".webm"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        temp_path = tmp.name
        shutil.copyfileobj(audio.file, tmp)

    cleaned_path: Optional[str] = None
    try:
        cleaned_path = preprocess_audio(temp_path)
        with open(cleaned_path, "rb") as audio_file:
            transcription = client.speech_to_text.convert(
                file=audio_file,
                model_id="scribe_v2",
                language_code="ne",
                tag_audio_events=False,
                temperature=0.0,
                diarize=False,
            )
        return (transcription.text or "").strip()
    except Exception as exc:
        logger.error("Transcription failed: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Transcription failed: {exc}",
        ) from exc
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)
        if cleaned_path and cleaned_path != temp_path and os.path.exists(cleaned_path):
            os.remove(cleaned_path)


def _product_catalog_lines(products: list[Product]) -> str:
    if not products:
        return "(no products in shop yet)"
    lines = []
    for p in products[:80]:
        lines.append(f"- {p.product_name} (unit: {p.unit}, stock: {p.stock_quantity})")
    return "\n".join(lines)


def _similarity(a: str, b: str) -> float:
    return SequenceMatcher(None, a.lower().strip(), b.lower().strip()).ratio()


def match_product(products: list[Product], spoken: str) -> Optional[Product]:
    if not spoken or not products:
        return None
    spoken_norm = spoken.strip().lower()

    best: Optional[Product] = None
    best_score = 0.0

    for p in products:
        name = p.product_name.lower()
        if spoken_norm == name:
            return p
        if spoken_norm in name or name in spoken_norm:
            score = 0.95
        else:
            score = _similarity(spoken_norm, name)
        if score > best_score:
            best_score = score
            best = p

    return best if best_score >= 0.45 else None


def match_customer(customers: list[Customer], spoken: str) -> Optional[Customer]:
    if not spoken or not customers:
        return None
    spoken_norm = spoken.strip().lower()

    best: Optional[Customer] = None
    best_score = 0.0

    for c in customers:
        name = c.full_name.lower()
        if spoken_norm == name:
            return c
        if spoken_norm in name or name in spoken_norm:
            score = 0.95
        else:
            score = _similarity(spoken_norm, name)
        if score > best_score:
            best_score = score
            best = c

    return best if best_score >= 0.45 else None


async def extract_transactions(
    db: Session,
    user: User,
    shop_id: uuid.UUID,
    payload: VoiceExtractRequest,
) -> VoiceExtractResponse:
    text = payload.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    products = product_service.get_products(db, user, shop_id)
    catalog = _product_catalog_lines(products)

    prompt = f"""You are a transaction extraction assistant for a Nepali kirana (grocery) shop.
Analyze the spoken Nepali input and extract transaction line items only.
A single sentence may contain multiple transaction entries (sales and/or purchases).

### Shop product catalog (prefer matching these names when possible):
{catalog}

### Rules:
- action "sale" = बेचियो, बिक्री, बेचे, sold, दिएँ, लग्यो, बिक्री भयो
- action "purchase" = किन्यो, किने, खरिद, stock in, थपियो, ल्याए
- quantity must be numeric (convert Nepali words: एक=1, दुई=2, तीन=3, चार=4, पाँच=5, छ=6, सात=7, आठ=8, नौ=9, दस=10, दश=10)
- product: use catalog name if match exists, else keep spoken Nepali/English name
- Do not infer credit status, due dates, or customer names from the speech. Ignore words like उधारो, बाँकी, and any person names.
- Always return payment_type as "cash" and customer_name as null.
- If the input contains multiple separate transactions, split them into separate transaction objects in the `transactions` array.
- For backward compatibility, also populate the root `items`, `customer_name`, `payment_type`, and `notes` with the combined list of items and default values.

Return JSON only.

Input: "{text}"
"""

    class ExtractResult(BaseModel):
        items: list[VoiceLineItem]
        customer_name: Optional[str] = None
        payment_type: Optional[str] = "cash"
        notes: Optional[str] = None
        transactions: Optional[list[VoiceTransactionEntry]] = None

    try:
        client = _get_ai_client()
        response = await client.aio.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.1,
                response_mime_type="application/json",
                response_schema=ExtractResult,
            ),
        )
        if not response.parsed:
            raise ValueError("Empty Gemini response")
        parsed: ExtractResult = response.parsed
        return sanitize_extracted_response(
            items=parsed.items,
            customer_name=parsed.customer_name,
            payment_type=parsed.payment_type,
            notes=parsed.notes,
            transactions=parsed.transactions,
            raw_transcript=text,
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Gemini extraction failed: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Could not extract transactions: {exc}",
        ) from exc


def confirm_voice_transactions(
    db: Session,
    user: User,
    shop_id: uuid.UUID,
    payload: VoiceConfirmRequest,
) -> VoiceConfirmResponse:
    # Build list of transactions to process
    tx_list: list[SingleTransactionConfirm] = []

    if payload.transactions:
        tx_list = payload.transactions
    elif payload.items:
        # Backward compatibility for flat list of items
        sale_items = [i for i in payload.items if i.action == VoiceAction.sale]
        purchase_items = [i for i in payload.items if i.action == VoiceAction.purchase]

        if sale_items:
            tx_list.append(
                SingleTransactionConfirm(
                    action=VoiceAction.sale,
                    items=sale_items,
                    payment_type=payload.payment_type,
                    customer_id=payload.customer_id,
                    due_date=payload.due_date,
                    notes=payload.notes,
                )
            )

        for p_item in purchase_items:
            tx_list.append(
                SingleTransactionConfirm(
                    action=VoiceAction.purchase,
                    items=[p_item],
                    notes=payload.notes,
                )
            )

    if not tx_list:
        raise HTTPException(status_code=400, detail="No items to confirm")

    products = product_service.get_products(db, user, shop_id)
    product_map = {p.id: p for p in products}
    processed: list[VoiceProcessedItem] = []

    for tx in tx_list:
        if tx.action == VoiceAction.sale:
            if not tx.items:
                continue
            try:
                pay_type = PaymentType(tx.payment_type)
            except ValueError:
                pay_type = PaymentType.CASH

            tx_items = []
            for line in tx.items:
                product = product_map.get(line.product_id)
                if not product:
                    raise HTTPException(404, detail=f"Product {line.product_id} not found")
                tx_items.append(
                    TransactionItemCreateRequest(
                        product_id=line.product_id,
                        quantity=line.quantity,
                    )
                )

            due = None
            if pay_type == PaymentType.CREDIT and tx.due_date:
                due = date.fromisoformat(tx.due_date)

            db_tx = transaction_service.create_transaction(
                db,
                user,
                shop_id,
                TransactionCreateRequest(
                    transaction_type=TransactionType(tx.action.value),
                    payment_type=pay_type,
                    customer_id=tx.customer_id,
                    due_date=due,
                    notes=tx.notes or "Vyapar Voice sale",
                    items=tx_items,
                ),
            )

            for line in tx.items:
                product = product_map.get(line.product_id)
                db.refresh(product) if product else None
                processed.append(
                    VoiceProcessedItem(
                        action="sale",
                        product_id=str(line.product_id),
                        product_name=product.product_name if product else line.product_name or "",
                        quantity=line.quantity,
                        transaction_id=str(db_tx.id),
                        new_stock=product.stock_quantity if product else None,
                    )
                )

        elif tx.action == VoiceAction.purchase:
            if not tx.items:
                continue

            tx_items = []
            for line in tx.items:
                product = product_map.get(line.product_id)
                if not product:
                    raise HTTPException(404, detail=f"Product {line.product_id} not found")
                tx_items.append(
                    TransactionItemCreateRequest(
                        product_id=line.product_id,
                        quantity=line.quantity,
                    )
                )

            db_tx = transaction_service.create_transaction(
                db,
                user,
                shop_id,
                TransactionCreateRequest(
                    transaction_type=TransactionType.PURCHASE,
                    payment_type=PaymentType.CASH,
                    notes=tx.notes or "Vyapar Voice purchase",
                    items=tx_items,
                ),
            )

            for line in tx.items:
                updated = product_map.get(line.product_id)
                db.refresh(updated) if updated else None
                processed.append(
                    VoiceProcessedItem(
                        action="purchase",
                        product_id=str(line.product_id),
                        product_name=updated.product_name if updated else line.product_name or "",
                        quantity=line.quantity,
                        transaction_id=str(db_tx.id),
                        new_stock=updated.stock_quantity if updated else None,
                    )
                )

    # Build Nepali confirmation
    parts = []
    for p in processed:
        if p.action == "sale":
            #from product name remove the units like 2L, 500ml, 1kg, etc. if present in brackets
            p.product_name = clean_product_name(p.product_name) 
            parts.append(
                f"{p.product_name} {p.quantity} बिक्री भयो। भण्डारमा {p.new_stock} बाँकी।"
            )
        else:
            parts.append(
                f"{p.product_name} {p.quantity} भण्डारमा थपियो। जम्मा {p.new_stock}।"
            )
    confirmation_text = " ".join(parts) if parts else "कारोबार सुरक्षित भयो।"

    return VoiceConfirmResponse(
        confirmation_text=confirmation_text,
        processed=processed,
    )


def match_extracted_items(
    db: Session,
    user: User,
    shop_id: uuid.UUID,
    items: list[VoiceLineItem],
) -> list[dict]:
    """Resolve spoken product names to catalog product IDs for the review UI."""
    products = product_service.get_products(db, user, shop_id)
    result = []
    for item in items:
        matched = match_product(products, item.product)
        result.append(
            {
                "action": item.action.value,
                "spoken_product": item.product,
                "quantity": int(item.quantity) if item.quantity == int(item.quantity) else item.quantity,
                "unit": item.unit,
                "product_id": str(matched.id) if matched else None,
                "product_name": matched.product_name if matched else item.product,
                "stock_quantity": matched.stock_quantity if matched else None,
                "match_confidence": "high" if matched else "none",
            }
        )
    return result


def match_extracted_transactions(
    db: Session,
    user: User,
    shop_id: uuid.UUID,
    transactions: list[VoiceTransactionEntry],
) -> list[dict]:
    """Resolve spoken product and customer names to database IDs for structured transactions."""
    products = product_service.get_products(db, user, shop_id)
    customers = customer_service.get_customers(db, user, shop_id)
    result = []
    for tx in transactions:
        matched_cust = None
        if tx.customer_name:
            matched_cust = match_customer(customers, tx.customer_name)

        matched_items = []
        for item in tx.items:
            matched_prod = match_product(products, item.product)
            matched_items.append(
                {
                    "spoken_product": item.product,
                    "quantity": int(item.quantity) if item.quantity == int(item.quantity) else item.quantity,
                    "unit": item.unit,
                    "product_id": str(matched_prod.id) if matched_prod else None,
                    "product_name": matched_prod.product_name if matched_prod else item.product,
                    "stock_quantity": matched_prod.stock_quantity if matched_prod else None,
                    "match_confidence": "high" if matched_prod else "none",
                }
            )

        result.append(
            {
                "action": tx.action.value,
                "customer_name": matched_cust.full_name if matched_cust else tx.customer_name,
                "customer_id": str(matched_cust.id) if matched_cust else None,
                "payment_type": tx.payment_type or "cash",
                "due_date": tx.due_date,
                "notes": tx.notes,
                "items": matched_items,
            }
        )
    return result



def clean_product_name(name: str) -> str:
    name = re.sub(
        r"\s*\(?\d+(?:\.\d+)?\s*(?:kg|g|gm|mg|ml|l|ltr|litre|liter|pcs?|pc)\)?\s*$",
        "",
        name,
        flags=re.IGNORECASE,
    )
    return name.strip()