"""
Django admin configuration for AdminLog model.
"""
from django.contrib import admin
from .models import AdminLog


@admin.register(AdminLog)
class AdminLogAdmin(admin.ModelAdmin):
    list_display = ('admin_user', 'action', 'entity_type', 'entity_id', 'ip_address', 'created_at')
    list_filter = ('action', 'entity_type', 'created_at')
    search_fields = ('admin_user__email', 'description', 'entity_type')
    readonly_fields = ('admin_user', 'action', 'entity_type', 'entity_id', 'description', 'ip_address', 'user_agent', 'created_at')
    ordering = ('-created_at',)

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
