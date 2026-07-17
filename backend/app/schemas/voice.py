from enum import Enum
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class VoiceAction(str, Enum):
    sale = "sale"
    purchase = "purchase"


class VoiceLineItem(BaseModel):
    """One line extracted from spoken Nepali input."""

    action: VoiceAction
    product: str = Field(..., description="Product name in Nepali or English")
    quantity: float = Field(..., description="Must be a positive number")
    unit: Optional[str] = None
    unit_price: Optional[float] = None
    total_price: Optional[float] = None


class VoiceTransactionEntry(BaseModel):
    """One transaction entry representing a sale or purchase group."""

    action: VoiceAction
    items: list[VoiceLineItem]
    customer_name: Optional[str] = None
    payment_type: Optional[str] = "cash"
    due_date: Optional[str] = None
    notes: Optional[str] = None


class VoiceExtractRequest(BaseModel):
    text: str


class VoiceExtractResponse(BaseModel):
    items: list[VoiceLineItem]
    customer_name: Optional[str] = None
    payment_type: Optional[str] = "cash"
    notes: Optional[str] = None
    transactions: Optional[list[VoiceTransactionEntry]] = None
    raw_transcript: Optional[str] = None


class VoiceConfirmLineItem(BaseModel):
    action: VoiceAction
    product_id: UUID
    quantity: int = Field(..., gt=0)
    product_name: Optional[str] = None


class SingleTransactionConfirm(BaseModel):
    action: VoiceAction
    items: list[VoiceConfirmLineItem]
    payment_type: str = "cash"
    customer_id: Optional[UUID] = None
    due_date: Optional[str] = None  # YYYY-MM-DD for credit
    notes: Optional[str] = None


class VoiceConfirmRequest(BaseModel):
    items: Optional[list[VoiceConfirmLineItem]] = None
    payment_type: str = "cash"
    customer_id: Optional[UUID] = None
    due_date: Optional[str] = None  # YYYY-MM-DD for credit
    notes: Optional[str] = None
    transactions: Optional[list[SingleTransactionConfirm]] = None


class VoiceProcessedItem(BaseModel):
    action: str
    product_id: str
    product_name: str
    quantity: int
    transaction_id: Optional[str] = None
    new_stock: Optional[int] = None


class VoiceConfirmResponse(BaseModel):
    confirmation_text: str
    processed: list[VoiceProcessedItem]


class VoiceTTSRequest(BaseModel):
    text: str

