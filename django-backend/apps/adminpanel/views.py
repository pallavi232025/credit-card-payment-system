"""
Admin panel views - dashboard, user management, reporting, CSV export, logs.
"""
import csv
import logging
from decimal import Decimal, InvalidOperation

from django.db.models import Sum, Count, Q
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from apps.cards.models import Card
from apps.cards.serializers import CardSerializer
from apps.transactions.models import Transaction
from apps.transactions.serializers import TransactionSerializer
from apps.users.models import User
from apps.users.permissions import IsAdmin
from apps.users.serializers import UserListSerializer
from apps.users.utils import success_response, error_response
from .models import AdminLog
from .serializers import AdminLogSerializer

logger = logging.getLogger(__name__)


class AdminDashboardView(APIView):
    """Admin dashboard with summary metrics."""
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        today = timezone.now().date()

        # Overall stats
        total_users = User.objects.count()
        total_cards = Card.objects.count()
        total_transactions = Transaction.objects.count()

        tx_stats = Transaction.objects.aggregate(
            successful=Count('id', filter=Q(status='SUCCESS')),
            failed=Count('id', filter=Q(status='FAILED')),
            pending=Count('id', filter=Q(status='PENDING')),
            total_success_amount=Sum('amount', filter=Q(status='SUCCESS')),
        )

        # Today's stats
        today_stats = Transaction.objects.filter(
            created_at__date=today
        ).aggregate(
            today_count=Count('id'),
            today_success_amount=Sum('amount', filter=Q(status='SUCCESS')),
        )

        AdminLog.log_action(
            admin_user=request.user,
            action='VIEW',
            entity_type='DASHBOARD',
            description='Admin viewed dashboard',
            request=request,
        )

        return success_response(data={
            "total_users": total_users,
            "total_cards": total_cards,
            "total_transactions": total_transactions,
            "successful_payments": tx_stats['successful'] or 0,
            "failed_payments": tx_stats['failed'] or 0,
            "pending_payments": tx_stats['pending'] or 0,
            "total_success_amount": str(tx_stats['total_success_amount'] or 0),
            "today_transactions": today_stats['today_count'] or 0,
            "today_success_amount": str(today_stats['today_success_amount'] or 0),
        })


class AdminUserListView(APIView):
    """List and search users (admin only)."""
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        queryset = User.objects.annotate(
            card_count=Count('cards'),
            transaction_count=Count('transactions'),
        )

        # Filters
        search = request.query_params.get('search', '')
        if search:
            queryset = queryset.filter(
                Q(email__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search)
            )

        role_filter = request.query_params.get('role')
        if role_filter and role_filter in dict(User.Role.choices):
            queryset = queryset.filter(role=role_filter)

        is_active = request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')

        # Pagination
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))
        page_size = min(page_size, 100)

        total = queryset.count()
        start = (page - 1) * page_size
        end = start + page_size
        users = queryset.order_by('-created_at')[start:end]

        serializer = UserListSerializer(users, many=True)

        return success_response(data={
            "users": serializer.data,
            "pagination": {
                "page": page,
                "page_size": page_size,
                "total": total,
                "total_pages": (total + page_size - 1) // page_size if page_size > 0 else 0,
            }
        })


class AdminUserDetailView(APIView):
    """View/modify a user (admin only)."""
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request, user_id):
        try:
            user = User.objects.annotate(
                card_count=Count('cards'),
                transaction_count=Count('transactions'),
            ).get(id=user_id)
        except User.DoesNotExist:
            return error_response(message="User not found", status_code=404)

        serializer = UserListSerializer(user)

        AdminLog.log_action(
            admin_user=request.user,
            action='VIEW',
            entity_type='USER',
            entity_id=user_id,
            description=f'Admin viewed user {user.email}',
            request=request,
        )

        return success_response(data=serializer.data)

    def patch(self, request, user_id):
        """Activate/deactivate user."""
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return error_response(message="User not found", status_code=404)

        # Prevent admin from deactivating themselves
        if user.id == request.user.id:
            return error_response(
                message="You cannot modify your own account",
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        is_active = request.data.get('is_active')
        if is_active is not None:
            user.is_active = bool(is_active)
            user.save(update_fields=['is_active', 'updated_at'])

            action = 'ACTIVATE' if user.is_active else 'DEACTIVATE'
            AdminLog.log_action(
                admin_user=request.user,
                action=action,
                entity_type='USER',
                entity_id=user_id,
                description=f'Admin {action.lower()}d user {user.email}',
                request=request,
            )

            logger.info(f"Admin {request.user.email} {action.lower()}d user {user.email}")

        return success_response(
            data=UserListSerializer(user).data,
            message=f"User {'activated' if user.is_active else 'deactivated'} successfully"
        )


class AdminCardListView(APIView):
    """View all cards (admin only) - shows masked data only."""
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        queryset = Card.objects.select_related('user').all()

        # Filters
        search = request.query_params.get('search', '')
        if search:
            queryset = queryset.filter(
                Q(card_holder_name__icontains=search) |
                Q(last_four_digits__icontains=search) |
                Q(user__email__icontains=search)
            )

        user_id = request.query_params.get('user_id')
        if user_id:
            queryset = queryset.filter(user_id=user_id)

        # Pagination
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))
        page_size = min(page_size, 100)

        total = queryset.count()
        start = (page - 1) * page_size
        end = start + page_size
        cards = queryset.order_by('-created_at')[start:end]

        # Serialize with user email
        data = []
        for card in cards:
            card_data = CardSerializer(card).data
            card_data['user_email'] = card.user.email
            data.append(card_data)

        AdminLog.log_action(
            admin_user=request.user,
            action='VIEW',
            entity_type='CARDS',
            description='Admin viewed cards list',
            request=request,
        )

        return success_response(data={
            "cards": data,
            "pagination": {
                "page": page,
                "page_size": page_size,
                "total": total,
                "total_pages": (total + page_size - 1) // page_size if page_size > 0 else 0,
            }
        })


class AdminTransactionListView(APIView):
    """View all transactions (admin only)."""
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        queryset = Transaction.objects.select_related('card', 'user').all()

        # Filters
        status_filter = request.query_params.get('status')
        if status_filter and status_filter in dict(Transaction.Status.choices):
            queryset = queryset.filter(status=status_filter)

        from_date = request.query_params.get('from_date')
        if from_date:
            queryset = queryset.filter(created_at__date__gte=from_date)

        to_date = request.query_params.get('to_date')
        if to_date:
            queryset = queryset.filter(created_at__date__lte=to_date)

        min_amount = request.query_params.get('min_amount')
        if min_amount:
            try:
                queryset = queryset.filter(amount__gte=Decimal(min_amount))
            except (InvalidOperation, ValueError):
                pass

        max_amount = request.query_params.get('max_amount')
        if max_amount:
            try:
                queryset = queryset.filter(amount__lte=Decimal(max_amount))
            except (InvalidOperation, ValueError):
                pass

        search = request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(transaction_reference__icontains=search) |
                Q(user__email__icontains=search)
            )

        user_id = request.query_params.get('user_id')
        if user_id:
            queryset = queryset.filter(user_id=user_id)

        # Sorting
        sort = request.query_params.get('sort', '-created_at')
        allowed_sorts = ['created_at', '-created_at', 'amount', '-amount', 'status', '-status']
        if sort in allowed_sorts:
            queryset = queryset.order_by(sort)

        # Pagination
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))
        page_size = min(page_size, 100)

        total = queryset.count()
        start = (page - 1) * page_size
        end = start + page_size
        transactions = queryset[start:end]

        serializer = TransactionSerializer(transactions, many=True)

        return success_response(data={
            "transactions": serializer.data,
            "pagination": {
                "page": page,
                "page_size": page_size,
                "total": total,
                "total_pages": (total + page_size - 1) // page_size if page_size > 0 else 0,
            }
        })


class AdminDailySummaryView(APIView):
    """Daily payment summary report."""
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        from django.db.models.functions import TruncDate

        days = int(request.query_params.get('days', 30))
        days = min(days, 365)

        from_date = request.query_params.get('from_date')
        to_date = request.query_params.get('to_date')

        queryset = Transaction.objects.all()

        if from_date:
            queryset = queryset.filter(created_at__date__gte=from_date)
        if to_date:
            queryset = queryset.filter(created_at__date__lte=to_date)

        if not from_date and not to_date:
            cutoff = timezone.now() - timezone.timedelta(days=days)
            queryset = queryset.filter(created_at__gte=cutoff)

        daily_data = queryset.annotate(
            date=TruncDate('created_at')
        ).values('date').annotate(
            total=Count('id'),
            successful=Count('id', filter=Q(status='SUCCESS')),
            failed=Count('id', filter=Q(status='FAILED')),
            pending=Count('id', filter=Q(status='PENDING')),
            success_amount=Sum('amount', filter=Q(status='SUCCESS')),
            failed_amount=Sum('amount', filter=Q(status='FAILED')),
        ).order_by('-date')

        summary = []
        for day in daily_data:
            summary.append({
                "date": str(day['date']),
                "total_transactions": day['total'],
                "successful_transactions": day['successful'],
                "failed_transactions": day['failed'],
                "pending_transactions": day['pending'],
                "successful_amount": str(day['success_amount'] or 0),
                "failed_amount": str(day['failed_amount'] or 0),
            })

        return success_response(data={"daily_summary": summary})


class AdminCSVExportView(APIView):
    """Export transactions to CSV."""
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        queryset = Transaction.objects.select_related('card', 'user').all()

        # Apply filters
        status_filter = request.query_params.get('status')
        if status_filter and status_filter in dict(Transaction.Status.choices):
            queryset = queryset.filter(status=status_filter)

        from_date = request.query_params.get('from_date')
        if from_date:
            queryset = queryset.filter(created_at__date__gte=from_date)

        to_date = request.query_params.get('to_date')
        if to_date:
            queryset = queryset.filter(created_at__date__lte=to_date)

        min_amount = request.query_params.get('min_amount')
        if min_amount:
            try:
                queryset = queryset.filter(amount__gte=Decimal(min_amount))
            except (InvalidOperation, ValueError):
                pass

        max_amount = request.query_params.get('max_amount')
        if max_amount:
            try:
                queryset = queryset.filter(amount__lte=Decimal(max_amount))
            except (InvalidOperation, ValueError):
                pass

        queryset = queryset.order_by('-created_at')

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="transactions_export.csv"'

        writer = csv.writer(response)
        writer.writerow([
            'Transaction ID', 'Transaction Reference', 'User Email',
            'Amount', 'Currency', 'Status', 'Card Last 4',
            'Description', 'Created At', 'Updated At'
        ])

        for tx in queryset:
            writer.writerow([
                tx.id,
                tx.transaction_reference,
                tx.user.email if tx.user else '',
                str(tx.amount),
                tx.currency,
                tx.status,
                tx.card.last_four_digits if tx.card else '',
                tx.description,
                tx.created_at.strftime('%Y-%m-%d %H:%M:%S') if tx.created_at else '',
                tx.updated_at.strftime('%Y-%m-%d %H:%M:%S') if tx.updated_at else '',
            ])

        AdminLog.log_action(
            admin_user=request.user,
            action='EXPORT',
            entity_type='TRANSACTIONS',
            description=f'Admin exported {queryset.count()} transactions to CSV',
            request=request,
        )

        logger.info(f"Admin {request.user.email} exported transactions CSV")

        return response


class AdminLogListView(APIView):
    """View admin activity logs."""
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        queryset = AdminLog.objects.select_related('admin_user').all()

        # Filters
        action = request.query_params.get('action')
        if action:
            queryset = queryset.filter(action__icontains=action)

        entity_type = request.query_params.get('entity_type')
        if entity_type:
            queryset = queryset.filter(entity_type__icontains=entity_type)

        # Pagination
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))
        page_size = min(page_size, 100)

        total = queryset.count()
        start = (page - 1) * page_size
        end = start + page_size
        logs = queryset[start:end]

        serializer = AdminLogSerializer(logs, many=True)

        return success_response(data={
            "logs": serializer.data,
            "pagination": {
                "page": page,
                "page_size": page_size,
                "total": total,
                "total_pages": (total + page_size - 1) // page_size if page_size > 0 else 0,
            }
        })
