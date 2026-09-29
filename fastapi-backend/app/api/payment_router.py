"""
Payment API router.
"""
import logging

from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.models.models import User
from app.schemas.payment import PaymentRequest, APIResponse
from app.services.payment_service import PaymentService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/payments", tags=["Payments"])


@router.post("/", response_model=APIResponse, summary="Process a payment")
async def process_payment(
    payment: PaymentRequest,
    idempotency_key: Optional[str] = Header(None, alias="Idempotency-Key"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Process a payment using the specified card.

    - **card_id**: ID of the saved card to charge
    - **amount**: Payment amount (positive, max 999999.99)
    - **currency**: Payment currency (INR, USD, EUR, GBP)
    - **description**: Optional payment description
    - **Idempotency-Key** header: Optional key to prevent duplicate payments

    The payment goes through the following lifecycle:
    1. PENDING - Transaction created
    2. SUCCESS or FAILED - After payment processor simulation
    """
    # Use idempotency key from header or request body
    idem_key = idempotency_key or payment.idempotency_key

    service = PaymentService(db)
    result = service.process_payment(
        user=current_user,
        card_id=payment.card_id,
        amount=payment.amount,
        currency=payment.currency,
        description=payment.description,
        idempotency_key=idem_key,
    )

    is_success = result['status'] == 'SUCCESS'
    return APIResponse(
        success=is_success,
        message=result['message'],
        data=result,
        errors=[{"field": "payment", "message": result['failure_reason']}] if not is_success and result.get('failure_reason') else [],
    )


@router.get("/health", summary="Payment service health check")
async def health_check():
    """Health check endpoint for the payment service."""
    return {"status": "healthy", "service": "payment-processor"}
