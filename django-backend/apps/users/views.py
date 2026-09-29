"""
Authentication and user management views.
"""
import logging

from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User
from .serializers import UserRegistrationSerializer, UserLoginSerializer, UserProfileSerializer
from .utils import success_response, error_response

logger = logging.getLogger(__name__)


class RegisterView(APIView):
    """User registration endpoint."""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            tokens = RefreshToken.for_user(user)
            tokens['role'] = user.role
            tokens['email'] = user.email

            logger.info(f"User registered: {user.email}")

            return success_response(
                data={
                    "user": UserProfileSerializer(user).data,
                    "access": str(tokens.access_token),
                    "refresh": str(tokens),
                },
                message="Registration successful",
                status_code=status.HTTP_201_CREATED
            )
        return error_response(
            message="Registration failed",
            errors=[{"field": k, "message": v[0] if isinstance(v, list) else str(v)}
                    for k, v in serializer.errors.items()],
            status_code=status.HTTP_400_BAD_REQUEST
        )


class LoginView(APIView):
    """User login endpoint."""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserLoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            tokens = RefreshToken.for_user(user)
            tokens['role'] = user.role
            tokens['email'] = user.email

            logger.info(f"User logged in: {user.email}")

            return success_response(
                data={
                    "user": UserProfileSerializer(user).data,
                    "access": str(tokens.access_token),
                    "refresh": str(tokens),
                },
                message="Login successful"
            )
        return error_response(
            message="Login failed",
            errors=[{"field": "non_field_errors", "message": str(v[0]) if isinstance(v, list) else str(v)}
                    for k, v in serializer.errors.items()],
            status_code=status.HTTP_401_UNAUTHORIZED
        )


class LogoutView(APIView):
    """User logout endpoint - blacklists refresh token."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
        except Exception:
            pass  # Token may already be blacklisted or invalid

        logger.info(f"User logged out: {request.user.email}")

        return success_response(message="Logout successful")


class ProfileView(APIView):
    """Get current user's profile."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserProfileSerializer(request.user)
        return success_response(data=serializer.data, message="Profile retrieved")


class DashboardView(APIView):
    """Get user dashboard stats."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from apps.cards.models import Card
        from apps.transactions.models import Transaction
        from django.db.models import Sum, Count, Q
        from django.utils import timezone

        user = request.user
        today = timezone.now().date()

        card_count = Card.objects.filter(user=user).count()

        tx_stats = Transaction.objects.filter(user=user).aggregate(
            total=Count('id'),
            successful=Count('id', filter=Q(status='SUCCESS')),
            failed=Count('id', filter=Q(status='FAILED')),
            pending=Count('id', filter=Q(status='PENDING')),
            total_success_amount=Sum('amount', filter=Q(status='SUCCESS')),
        )

        recent_transactions = Transaction.objects.filter(user=user).select_related('card').order_by('-created_at')[:5]
        from apps.transactions.serializers import TransactionSerializer
        recent_tx_data = TransactionSerializer(recent_transactions, many=True).data

        return success_response(data={
            "card_count": card_count,
            "total_transactions": tx_stats['total'] or 0,
            "successful_payments": tx_stats['successful'] or 0,
            "failed_payments": tx_stats['failed'] or 0,
            "pending_payments": tx_stats['pending'] or 0,
            "total_success_amount": str(tx_stats['total_success_amount'] or 0),
            "recent_transactions": recent_tx_data,
        })
