"""
Payment repository - database operations for payment processing.
"""
import uuid
from decimal import Decimal
from typing import Optional

from sqlalchemy.orm import Session

from app.models.models import Card, Transaction


class PaymentRepository:
    """Repository for payment-related database operations."""

    def __init__(self, db: Session):
        self.db = db

    def get_card_by_id(self, card_id: int) -> Optional[Card]:
        """Get a card by ID."""
        return self.db.query(Card).filter(Card.id == card_id).first()

    def get_transaction_by_idempotency_key(self, key: str) -> Optional[Transaction]:
        """Get a transaction by idempotency key."""
        return self.db.query(Transaction).filter(Transaction.idempotency_key == key).first()

    def create_transaction(
        self,
        user_id: int,
        card_id: int,
        amount: Decimal,
        currency: str,
        description: str,
        status: str = 'PENDING',
        idempotency_key: Optional[str] = None,
    ) -> Transaction:
        """Create a new transaction record."""
        reference = f"TXN-{uuid.uuid4().hex[:12].upper()}"

        transaction = Transaction(
            user_id=user_id,
            card_id=card_id,
            transaction_reference=reference,
            amount=amount,
            currency=currency,
            description=description,
            status=status,
            idempotency_key=idempotency_key,
        )
        self.db.add(transaction)
        self.db.flush()
        return transaction

    def update_transaction_status(
        self,
        transaction: Transaction,
        status: str,
        failure_reason: str = '',
    ) -> Transaction:
        """Update transaction status."""
        transaction.status = status
        transaction.failure_reason = failure_reason
        self.db.flush()
        return transaction
