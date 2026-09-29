"""
Card management views - CRUD operations for saved cards.
"""
import logging

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from apps.users.utils import success_response, error_response
from .models import Card
from .serializers import CardCreateSerializer, CardSerializer

logger = logging.getLogger(__name__)


class CardListCreateView(APIView):
    """List user's cards or add a new card."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        cards = Card.objects.filter(user=request.user)
        serializer = CardSerializer(cards, many=True)
        return success_response(data=serializer.data, message="Cards retrieved")

    def post(self, request):
        serializer = CardCreateSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            card = serializer.save()
            logger.info(f"Card added for user {request.user.email}: ****{card.last_four_digits}")
            return success_response(
                data=CardSerializer(card).data,
                message="Card added successfully",
                status_code=status.HTTP_201_CREATED
            )
        return error_response(
            message="Failed to add card",
            errors=[{"field": k, "message": v[0] if isinstance(v, list) else str(v)}
                    for k, v in serializer.errors.items()],
            status_code=status.HTTP_400_BAD_REQUEST
        )


class CardDeleteView(APIView):
    """Delete a user's saved card."""
    permission_classes = [IsAuthenticated]

    def delete(self, request, card_id):
        try:
            card = Card.objects.get(id=card_id, user=request.user)
        except Card.DoesNotExist:
            return error_response(
                message="Card not found",
                status_code=status.HTTP_404_NOT_FOUND
            )

        last_four = card.last_four_digits
        card.delete()
        logger.info(f"Card deleted for user {request.user.email}: ****{last_four}")
        return success_response(message="Card deleted successfully")
