"""
Django admin configuration for Card model.
"""
from django.contrib import admin
from .models import Card


@admin.register(Card)
class CardAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'card_brand', 'masked_card_number', 'card_holder_name', 'card_type', 'expiry_month', 'expiry_year', 'created_at')
    list_filter = ('card_brand', 'card_type', 'created_at')
    search_fields = ('card_holder_name', 'last_four_digits', 'user__email')
    readonly_fields = ('masked_card_number', 'last_four_digits', 'card_brand', 'created_at', 'updated_at')
    ordering = ('-created_at',)

    def has_change_permission(self, request, obj=None):
        return False  # Cards should not be edited
