"""
Admin panel serializers.
"""
from rest_framework import serializers
from .models import AdminLog


class AdminLogSerializer(serializers.ModelSerializer):
    """Serializer for admin activity logs."""
    admin_email = serializers.SerializerMethodField()

    class Meta:
        model = AdminLog
        fields = [
            'id', 'admin_email', 'action', 'entity_type',
            'entity_id', 'description', 'ip_address', 'created_at'
        ]
        read_only_fields = fields

    def get_admin_email(self, obj):
        return obj.admin_user.email if obj.admin_user else None
