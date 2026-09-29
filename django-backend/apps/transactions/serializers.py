"""
Transaction serializers.
"""
from rest_framework import serializers

from apps.cards.serializers import CardSerializer
from .models import Transaction


class TransactionSerializer(serializers.ModelSerializer):
    """Serializer for transaction display."""
    card_last_four = serializers.SerializerMethodField()
    card_brand = serializers.SerializerMethodField()
    user_email = serializers.SerializerMethodField()

    class Meta:
        model = Transaction
        fields = [
            'id', 'transaction_reference', 'amount', 'currency',
            'description', 'status', 'failure_reason',
            'card_last_four', 'card_brand', 'user_email',
            'created_at', 'updated_at'
        ]
        read_only_fields = fields

    def get_card_last_four(self, obj):
        return obj.card.last_four_digits if obj.card else None

    def get_card_brand(self, obj):
        return obj.card.card_brand if obj.card else None

    def get_user_email(self, obj):
        return obj.user.email if obj.user else None
