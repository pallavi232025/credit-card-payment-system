"""
AdminLog model for tracking admin operations.
"""
from django.conf import settings
from django.db import models


class AdminLog(models.Model):
    """Audit log for admin operations."""

    admin_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='admin_logs',
        db_index=True,
    )
    action = models.CharField(max_length=100)
    entity_type = models.CharField(max_length=50)
    entity_id = models.CharField(max_length=50, blank=True, default='')
    description = models.TextField(blank=True, default='')
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'admin_logs'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['admin_user', 'created_at']),
            models.Index(fields=['entity_type', 'created_at']),
        ]

    def __str__(self):
        return f"[{self.created_at}] {self.admin_user.email}: {self.action} {self.entity_type}"

    @classmethod
    def log_action(cls, admin_user, action, entity_type, entity_id='', description='', request=None):
        """Create an admin log entry."""
        ip_address = None
        user_agent = ''
        if request:
            ip_address = cls._get_client_ip(request)
            user_agent = request.META.get('HTTP_USER_AGENT', '')

        return cls.objects.create(
            admin_user=admin_user,
            action=action,
            entity_type=entity_type,
            entity_id=str(entity_id),
            description=description,
            ip_address=ip_address,
            user_agent=user_agent,
        )

    @staticmethod
    def _get_client_ip(request):
        """Extract client IP from request."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR')
