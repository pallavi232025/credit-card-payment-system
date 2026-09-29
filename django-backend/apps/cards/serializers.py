"""
Card serializers - handles card creation with masking and validation.
"""
from datetime import datetime

from rest_framework import serializers

from .models import Card


class CardCreateSerializer(serializers.Serializer):
    """
    Serializer for adding a new card.
    Accepts full card number for validation/masking, but NEVER stores it.
    CVV is accepted for frontend UX but NEVER stored or sent to this endpoint.
    """
    card_number = serializers.CharField(max_length=19, write_only=True)
    card_holder_name = serializers.CharField(max_length=150)
    expiry_month = serializers.IntegerField(min_value=1, max_value=12)
    expiry_year = serializers.IntegerField()
    card_type = serializers.ChoiceField(choices=Card.CardType.choices)

    def validate_card_number(self, value):
        cleaned = value.replace(' ', '').replace('-', '')
        if not cleaned.isdigit() or len(cleaned) < 13 or len(cleaned) > 19:
            raise serializers.ValidationError("Invalid card number format.")
        if not Card.luhn_check(cleaned):
            raise serializers.ValidationError("Invalid card number (Luhn check failed).")
        return cleaned

    def validate_card_holder_name(self, value):
        if not value.strip():
            raise serializers.ValidationError("Card holder name is required.")
        if len(value.strip()) < 2:
            raise serializers.ValidationError("Card holder name must be at least 2 characters.")
        return value.strip()

    def validate_expiry_year(self, value):
        current_year = datetime.now().year
        if value < current_year or value > current_year + 20:
            raise serializers.ValidationError("Invalid expiry year.")
        return value

    def validate(self, attrs):
        now = datetime.now()
        expiry_month = attrs['expiry_month']
        expiry_year = attrs['expiry_year']
        if expiry_year == now.year and expiry_month < now.month:
            raise serializers.ValidationError({"expiry_month": "Card has expired."})
        return attrs

    def create(self, validated_data):
        card_number = validated_data.pop('card_number')
        user = self.context['request'].user

        card = Card.objects.create(
            user=user,
            card_holder_name=validated_data['card_holder_name'],
            masked_card_number=Card.mask_card_number(card_number),
            last_four_digits=card_number[-4:],
            card_type=validated_data['card_type'],
            card_brand=Card.detect_card_brand(card_number),
            expiry_month=validated_data['expiry_month'],
            expiry_year=validated_data['expiry_year'],
        )
        return card


class CardSerializer(serializers.ModelSerializer):
    """Serializer for displaying saved cards. Never includes full card number or CVV."""

    class Meta:
        model = Card
        fields = [
            'id', 'card_holder_name', 'masked_card_number', 'last_four_digits',
            'card_type', 'card_brand', 'expiry_month', 'expiry_year',
            'created_at', 'updated_at'
        ]
        read_only_fields = fields
