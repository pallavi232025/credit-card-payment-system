"""
Pydantic schemas for payment processing.
"""
from decimal import Decimal
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, field_validator


class PaymentRequest(BaseModel):
    """Request schema for payment processing."""
    card_id: int = Field(..., description="ID of the saved card to use")
    amount: Decimal = Field(..., gt=0, le=Decimal('999999.99'), description="Payment amount")
    currency: str = Field(default='INR', description="Payment currency")
    description: str = Field(default='', max_length=255, description="Payment description")
    idempotency_key: Optional[str] = Field(None, max_length=100, description="Idempotency key for duplicate prevention")

    @field_validator('currency')
    @classmethod
    def validate_currency(cls, v):
        allowed = ['INR', 'USD', 'EUR', 'GBP']
        if v not in allowed:
            raise ValueError(f"Currency must be one of: {', '.join(allowed)}")
        return v

    @field_validator('amount')
    @classmethod
    def validate_amount(cls, v):
        if v <= 0:
            raise ValueError("Amount must be positive")
        if v > Decimal('999999.99'):
            raise ValueError("Amount exceeds maximum limit")
        return v


class PaymentResponse(BaseModel):
    """Response schema for successful payment."""
    transaction_id: int
    transaction_reference: str
    status: str
    amount: str
    currency: str
    message: str
    description: str = ''
    failure_reason: str = ''
    created_at: Optional[datetime] = None


class APIResponse(BaseModel):
    """Standardized API response."""
    success: bool
    message: str
    data: Optional[dict] = None
    errors: list = []
