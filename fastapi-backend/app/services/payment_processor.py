"""
Payment processor - simulated payment gateway.
Designed with an interface pattern for easy replacement with a real gateway.
"""
import logging
import random
from abc import ABC, abstractmethod
from dataclasses import dataclass
from decimal import Decimal
from typing import Optional

from app.core.config import settings

logger = logging.getLogger(__name__)


@dataclass
class PaymentResult:
    """Result from payment processor."""
    success: bool
    message: str
    failure_reason: str = ''
    processor_reference: str = ''


class PaymentProcessor(ABC):
    """Abstract payment processor interface."""

    @abstractmethod
    def process_payment(
        self,
        amount: Decimal,
        currency: str,
        card_last_four: str,
        card_brand: str,
        description: str = '',
    ) -> PaymentResult:
        """Process a payment and return the result."""
        pass


class SimulatedPaymentProcessor(PaymentProcessor):
    """
    Simulated payment processor for development and testing.
    Uses a configurable success rate.
    Supports forced outcomes for deterministic testing.
    """

    def __init__(self, success_rate: Optional[int] = None, force_result: Optional[str] = None):
        self.success_rate = success_rate if success_rate is not None else settings.PAYMENT_SUCCESS_RATE
        self.force_result = force_result  # 'SUCCESS' or 'FAILED' for testing

    def process_payment(
        self,
        amount: Decimal,
        currency: str,
        card_last_four: str,
        card_brand: str,
        description: str = '',
    ) -> PaymentResult:
        """
        Simulate payment processing.
        Returns SUCCESS or FAILED based on configured success rate.
        """
        logger.info(
            f"Processing payment: {amount} {currency} on {card_brand} ****{card_last_four}"
        )

        # Deterministic mode for testing
        if self.force_result == 'SUCCESS':
            is_success = True
        elif self.force_result == 'FAILED':
            is_success = False
        else:
            # Random simulation based on success rate
            is_success = random.randint(1, 100) <= self.success_rate

        if is_success:
            logger.info(f"Payment successful: {amount} {currency}")
            return PaymentResult(
                success=True,
                message="Payment processed successfully",
                processor_reference=f"SIM-{random.randint(100000, 999999)}",
            )
        else:
            failure_reasons = [
                "Insufficient funds",
                "Card declined by issuer",
                "Transaction limit exceeded",
                "Suspected fraud - verification required",
                "Network timeout with payment processor",
            ]
            reason = random.choice(failure_reasons)
            logger.info(f"Payment failed: {amount} {currency} - {reason}")
            return PaymentResult(
                success=False,
                message="Payment failed",
                failure_reason=reason,
            )


def get_payment_processor(force_result: Optional[str] = None) -> PaymentProcessor:
    """Factory function to get the payment processor instance."""
    return SimulatedPaymentProcessor(force_result=force_result)
