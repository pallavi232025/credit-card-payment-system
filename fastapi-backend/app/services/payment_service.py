"""
Payment service - orchestrates payment processing business logic.
"""
import logging
from decimal import Decimal
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.models import User
from app.repositories.payment_repository import PaymentRepository
from app.services.payment_processor import get_payment_processor

logger = logging.getLogger(__name__)


class PaymentService:
    """Business logic for payment processing."""

    def __init__(self, db: Session):
        self.db = db
        self.repository = PaymentRepository(db)

    def process_payment(
        self,
        user: User,
        card_id: int,
        amount: Decimal,
        currency: str,
        description: str = '',
        idempotency_key: Optional[str] = None,
    ) -> dict:
        """
        Process a payment through the simulated payment processor.

        Flow:
        1. Validate card ownership
        2. Check idempotency key for duplicates
        3. Create PENDING transaction
        4. Process payment via simulator
        5. Update transaction to SUCCESS or FAILED
        6. Return result
        """
        # Check idempotency key for duplicate prevention
        if idempotency_key:
            existing = self.repository.get_transaction_by_idempotency_key(idempotency_key)
            if existing:
                logger.info(f"Duplicate payment request with key: {idempotency_key}")
                return {
                    "transaction_id": existing.id,
                    "transaction_reference": existing.transaction_reference,
                    "status": existing.status,
                    "amount": str(existing.amount),
                    "currency": existing.currency,
                    "message": "Duplicate request - returning existing transaction",
                    "description": existing.description,
                    "failure_reason": existing.failure_reason or '',
                }

        # Validate card ownership
        card = self.repository.get_card_by_id(card_id)
        if not card:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Card not found",
            )
        if card.user_id != user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not own this card",
            )

        try:
            # Create PENDING transaction
            transaction = self.repository.create_transaction(
                user_id=user.id,
                card_id=card_id,
                amount=amount,
                currency=currency,
                description=description,
                status='PENDING',
                idempotency_key=idempotency_key,
            )
            self.db.commit()

            # Process payment
            processor = get_payment_processor()
            result = processor.process_payment(
                amount=amount,
                currency=currency,
                card_last_four=card.last_four_digits,
                card_brand=card.card_brand,
                description=description,
            )

            # Update transaction status
            new_status = 'SUCCESS' if result.success else 'FAILED'
            self.repository.update_transaction_status(
                transaction=transaction,
                status=new_status,
                failure_reason=result.failure_reason,
            )
            self.db.commit()

            # Refresh to get updated values
            self.db.refresh(transaction)

            return {
                "transaction_id": transaction.id,
                "transaction_reference": transaction.transaction_reference,
                "status": transaction.status,
                "amount": str(transaction.amount),
                "currency": transaction.currency,
                "message": result.message,
                "description": transaction.description,
                "failure_reason": result.failure_reason,
                "created_at": transaction.created_at.isoformat() if transaction.created_at else None,
            }

        except HTTPException:
            raise
        except Exception as e:
            self.db.rollback()
            logger.error(f"Payment processing error: {e}", exc_info=True)

            # If transaction was created, mark it as failed
            try:
                if transaction:
                    self.repository.update_transaction_status(
                        transaction=transaction,
                        status='FAILED',
                        failure_reason='Internal processing error',
                    )
                    self.db.commit()
            except Exception:
                self.db.rollback()

            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Payment processing failed. Please try again.",
            )
