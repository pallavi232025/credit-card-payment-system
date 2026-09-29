"""
Transaction views - listing and filtering transaction history.
"""
from decimal import Decimal, InvalidOperation

from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from apps.users.utils import success_response
from .models import Transaction
from .serializers import TransactionSerializer


class TransactionListView(APIView):
    """List user's transactions with filtering, sorting, and pagination."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        queryset = Transaction.objects.filter(user=request.user).select_related('card')

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
            queryset = queryset.filter(transaction_reference__icontains=search)

        # Sorting
        sort = request.query_params.get('sort', '-created_at')
        allowed_sorts = ['created_at', '-created_at', 'amount', '-amount', 'status', '-status']
        if sort in allowed_sorts:
            queryset = queryset.order_by(sort)

        # Pagination
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))
        page_size = min(page_size, 100)  # Max 100 items

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


class TransactionDetailView(APIView):
    """Get single transaction detail."""
    permission_classes = [IsAuthenticated]

    def get(self, request, transaction_id):
        from apps.users.utils import error_response
        try:
            transaction = Transaction.objects.select_related('card').get(
                id=transaction_id, user=request.user
            )
        except Transaction.DoesNotExist:
            return error_response(message="Transaction not found", status_code=404)

        serializer = TransactionSerializer(transaction)
        return success_response(data=serializer.data)
