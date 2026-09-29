"""
Card model - stores only masked card information, never full card numbers or CVV.
"""
from django.conf import settings
from django.db import models


class Card(models.Model):
    """
    Saved card model.
    SECURITY: Only stores masked card number and last four digits.
    NEVER stores full card number or CVV.
    """

    class CardType(models.TextChoices):
        CREDIT = 'CREDIT', 'Credit'
        DEBIT = 'DEBIT', 'Debit'

    class CardBrand(models.TextChoices):
        VISA = 'VISA', 'Visa'
        MASTERCARD = 'MASTERCARD', 'Mastercard'
        AMEX = 'AMEX', 'American Express'
        OTHER = 'OTHER', 'Other'

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='cards',
        db_index=True,
    )
    card_holder_name = models.CharField(max_length=150)
    masked_card_number = models.CharField(max_length=19)  # ************1234
    last_four_digits = models.CharField(max_length=4)
    card_type = models.CharField(max_length=10, choices=CardType.choices)
    card_brand = models.CharField(max_length=15, choices=CardBrand.choices, default=CardBrand.OTHER)
    expiry_month = models.PositiveSmallIntegerField()
    expiry_year = models.PositiveSmallIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'cards'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'created_at']),
        ]

    def __str__(self):
        return f"{self.card_brand} ****{self.last_four_digits} ({self.card_holder_name})"

    @staticmethod
    def mask_card_number(card_number: str) -> str:
        """Mask card number, showing only last 4 digits."""
        cleaned = card_number.replace(' ', '').replace('-', '')
        return '*' * (len(cleaned) - 4) + cleaned[-4:]

    @staticmethod
    def detect_card_brand(card_number: str) -> str:
        """Detect card brand from card number prefix."""
        cleaned = card_number.replace(' ', '').replace('-', '')
        if cleaned.startswith('4'):
            return Card.CardBrand.VISA
        elif cleaned[:2] in ('51', '52', '53', '54', '55') or (2221 <= int(cleaned[:4]) <= 2720):
            return Card.CardBrand.MASTERCARD
        elif cleaned[:2] in ('34', '37'):
            return Card.CardBrand.AMEX
        return Card.CardBrand.OTHER

    @staticmethod
    def luhn_check(card_number: str) -> bool:
        """Validate card number using Luhn algorithm."""
        cleaned = card_number.replace(' ', '').replace('-', '')
        if not cleaned.isdigit():
            return False

        digits = [int(d) for d in cleaned]
        digits.reverse()
        total = 0
        for i, d in enumerate(digits):
            if i % 2 == 1:
                d *= 2
                if d > 9:
                    d -= 9
            total += d
        return total % 10 == 0
