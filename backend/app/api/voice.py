import uuid
import urllib.parse

from fastapi import APIRouter, Depends, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.database import get_db
from app.models.user import User
from app.schemas.response import ApiResponse
from app.schemas.voice import (
    VoiceConfirmRequest,
    VoiceConfirmResponse,
    VoiceExtractRequest,
    VoiceExtractResponse,
    VoiceTTSRequest,
)
from app.services import voice_service

router = APIRouter(prefix="/shops/{shop_id}/voice", tags=["Vyapar Voice"])


@router.post("/transcribe", response_model=ApiResponse[dict])
async def transcribe(
    shop_id: uuid.UUID,
    audio: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Speech-to-text via ElevenLabs (Nepali)."""
    text = await voice_service.transcribe_audio(audio)
    return ApiResponse(message="Transcription successful", data={"text": text})


@router.post("/extract-transactions", response_model=ApiResponse[dict])
async def extract_transactions(
    shop_id: uuid.UUID,
    payload: VoiceExtractRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Extract one or more sale/purchase lines from Nepali text via Gemini."""
    print("Extracting transactions for shop_id:", shop_id)
    extracted = await voice_service.extract_transactions(db, current_user, shop_id, payload)
    matched = voice_service.match_extracted_items(
        db, current_user, shop_id, extracted.items
    )
    matched_txs = voice_service.match_extracted_transactions(
        db, current_user, shop_id, extracted.transactions or []
    )
    return ApiResponse(
        message="Transactions extracted",
        data={
            "extracted": extracted.model_dump(),
            "matched_items": matched,
            "matched_transactions": matched_txs,
        },
    )


@router.post("/confirm", response_model=ApiResponse[VoiceConfirmResponse])
def confirm_transactions(
    shop_id: uuid.UUID,
    payload: VoiceConfirmRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Persist sales as transactions and purchases as stock-in."""
    result = voice_service.confirm_voice_transactions(
        db, current_user, shop_id, payload
    )
    return ApiResponse(message="Voice transactions confirmed", data=result)


@router.post("/confirm-with-audio")
async def confirm_with_audio(
    shop_id: uuid.UUID,
    payload: VoiceConfirmRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Confirm + return TTS audio with Nepali confirmation."""
    result = voice_service.confirm_voice_transactions(
        db, current_user, shop_id, payload
    )
    audio_bytes = await voice_service.synthesize_speech(result.confirmation_text)
    headers = {
        "X-Confirmation-Text": urllib.parse.quote(result.confirmation_text),
        "X-Processed-Count": str(len(result.processed)),
    }
    return StreamingResponse(iter([audio_bytes]), media_type="audio/mpeg", headers=headers)


@router.post("/tts")
async def text_to_speech(payload: VoiceTTSRequest):
    if not payload.text.strip():
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    audio_bytes = await voice_service.synthesize_speech(payload.text.strip())
    return StreamingResponse(iter([audio_bytes]), media_type="audio/mpeg")
