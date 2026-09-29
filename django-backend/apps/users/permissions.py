"""
Custom permissions for role-based access control.
"""
from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    """Allow access only to admin users."""
    message = "Admin access required."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and hasattr(request.user, 'role')
            and request.user.role == 'ADMIN'
        )


class IsOwnerOrAdmin(BasePermission):
    """Allow access to the owner of the object or admin users."""
    message = "You do not have permission to access this resource."

    def has_object_permission(self, request, view, obj):
        if hasattr(request.user, 'role') and request.user.role == 'ADMIN':
            return True
        if hasattr(obj, 'user'):
            return obj.user == request.user
        if hasattr(obj, 'user_id'):
            return obj.user_id == request.user.id
        return obj == request.user
