"""
Tests for payment processing service.
"""
from decimal import Decimal
from unittest.mock import patch, MagicMock

import pytest

from app.services.payment_processor import (
    SimulatedPaymentProcessor,
    PaymentResult,
    get_payment_processor,
)


class TestSimulatedPaymentProcessor:
    """Tests for the simulated payment processor."""

    def test_forced_success(self):
        processor = SimulatedPaymentProcessor(force_result='SUCCESS')
        result = processor.process_payment(
            amount=Decimal('1000.00'),
            currency='INR',
            card_last_four='1111',
            card_brand='VISA',
        )
        assert result.success is True
        assert result.failure_reason == ''

    def test_forced_failure(self):
        processor = SimulatedPaymentProcessor(force_result='FAILED')
        result = processor.process_payment(
            amount=Decimal('1000.00'),
            currency='INR',
            card_last_four='1111',
            card_brand='VISA',
        )
        assert result.success is False
        assert result.failure_reason != ''

    def test_success_rate_100(self):
        processor = SimulatedPaymentProcessor(success_rate=100)
        result = processor.process_payment(
            amount=Decimal('500.00'),
            currency='USD',
            card_last_four='4242',
            card_brand='MASTERCARD',
        )
        assert result.success is True

    def test_success_rate_0(self):
        processor = SimulatedPaymentProcessor(success_rate=0)
        result = processor.process_payment(
            amount=Decimal('500.00'),
            currency='EUR',
            card_last_four='0005',
            card_brand='AMEX',
        )
        assert result.success is False

    def test_payment_result_dataclass(self):
        result = PaymentResult(success=True, message="OK")
        assert result.success is True
        assert result.message == "OK"
        assert result.failure_reason == ''

    def test_factory_function(self):
        processor = get_payment_processor()
        assert isinstance(processor, SimulatedPaymentProcessor)

    def test_factory_with_forced_result(self):
        processor = get_payment_processor(force_result='SUCCESS')
        assert isinstance(processor, SimulatedPaymentProcessor)
        assert processor.force_result == 'SUCCESS'


class TestPaymentRequestValidation:
    """Tests for payment request validation via Pydantic schemas."""

    def test_valid_payment_request(self):
        from app.schemas.payment import PaymentRequest
        req = PaymentRequest(
            card_id=1,
            amount=Decimal('1000.00'),
            currency='INR',
            description='Test payment',
        )
        assert req.card_id == 1
        assert req.amount == Decimal('1000.00')

    def test_invalid_amount_zero(self):
        from app.schemas.payment import PaymentRequest
        with pytest.raises(Exception):
            PaymentRequest(card_id=1, amount=Decimal('0'), currency='INR')

    def test_invalid_amount_negative(self):
        from app.schemas.payment import PaymentRequest
        with pytest.raises(Exception):
            PaymentRequest(card_id=1, amount=Decimal('-100'), currency='INR')

    def test_invalid_currency(self):
        from app.schemas.payment import PaymentRequest
        with pytest.raises(Exception):
            PaymentRequest(card_id=1, amount=Decimal('100'), currency='XYZ')

    def test_amount_exceeds_max(self):
        from app.schemas.payment import PaymentRequest
        with pytest.raises(Exception):
            PaymentRequest(card_id=1, amount=Decimal('1000000'), currency='INR')

    def test_valid_currencies(self):
        from app.schemas.payment import PaymentRequest
        for curr in ['INR', 'USD', 'EUR', 'GBP']:
            req = PaymentRequest(card_id=1, amount=Decimal('100'), currency=curr)
            assert req.currency == curr
