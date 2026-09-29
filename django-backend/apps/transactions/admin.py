"""
Django admin configuration for Transaction model.
"""
from django.contrib import admin
from .models import Transaction


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ('transaction_reference', 'user', 'amount', 'currency', 'status', 'created_at')
    list_filter = ('status', 'currency', 'created_at')
    search_fields = ('transaction_reference', 'user__email', 'description')
    readonly_fields = ('transaction_reference', 'created_at', 'updated_at')
    ordering = ('-created_at',)

    def has_change_permission(self, request, obj=None):
        return False  # Transactions should not be edited manually
