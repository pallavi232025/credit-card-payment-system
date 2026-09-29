"""
Tests for Card management - add, list, delete, security.
"""
from django.test import TestCase
from rest_framework.test import APIClient

from apps.users.models import User
from apps.cards.models import Card


class TestCardManagement(TestCase):
    """Tests for card CRUD operations."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='test@example.com',
            password='TestPass@123',
            first_name='Test',
            last_name='User',
        )
        self.user2 = User.objects.create_user(
            email='test2@example.com',
            password='TestPass@123',
            first_name='Test2',
            last_name='User2',
        )
        # Get token
        response = self.client.post('/api/auth/login/', {
            'email': 'test@example.com', 'password': 'TestPass@123'
        }, format='json')
        self.token = response.data['data']['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

    def test_add_card_success(self):
        data = {
            'card_number': '4111111111111111',
            'card_holder_name': 'Test User',
            'expiry_month': 12,
            'expiry_year': 2028,
            'card_type': 'CREDIT',
        }
        response = self.client.post('/api/cards/', data, format='json')
        self.assertEqual(response.status_code, 201)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['data']['last_four_digits'], '1111')
        self.assertEqual(response.data['data']['card_brand'], 'VISA')
        self.assertIn('************', response.data['data']['masked_card_number'])

    def test_card_number_masked(self):
        data = {
            'card_number': '4111111111111111',
            'card_holder_name': 'Test User',
            'expiry_month': 12,
            'expiry_year': 2028,
            'card_type': 'CREDIT',
        }
        self.client.post('/api/cards/', data, format='json')
        card = Card.objects.first()
        self.assertEqual(card.masked_card_number, '************1111')
        self.assertEqual(card.last_four_digits, '1111')
        # Verify full card number is NOT stored
        self.assertNotIn('4111111111111111', card.masked_card_number)

    def test_cvv_not_stored(self):
        """Verify CVV is never stored in the database."""
        data = {
            'card_number': '4111111111111111',
            'card_holder_name': 'Test User',
            'expiry_month': 12,
            'expiry_year': 2028,
            'card_type': 'CREDIT',
        }
        self.client.post('/api/cards/', data, format='json')
        card = Card.objects.first()
        # Card model has no CVV field
        self.assertFalse(hasattr(card, 'cvv'))

    def test_list_cards(self):
        Card.objects.create(
            user=self.user, card_holder_name='Test', masked_card_number='************1111',
            last_four_digits='1111', card_type='CREDIT', card_brand='VISA',
            expiry_month=12, expiry_year=2028,
        )
        response = self.client.get('/api/cards/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data['data']), 1)

    def test_delete_card(self):
        card = Card.objects.create(
            user=self.user, card_holder_name='Test', masked_card_number='************1111',
            last_four_digits='1111', card_type='CREDIT', card_brand='VISA',
            expiry_month=12, expiry_year=2028,
        )
        response = self.client.delete(f'/api/cards/{card.id}/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(Card.objects.count(), 0)

    def test_unauthorized_access(self):
        self.client.credentials()  # Remove auth
        response = self.client.get('/api/cards/')
        self.assertEqual(response.status_code, 401)

    def test_cross_user_access_prevention(self):
        """User cannot see or delete another user's cards."""
        card = Card.objects.create(
            user=self.user2, card_holder_name='User2', masked_card_number='************2222',
            last_four_digits='2222', card_type='CREDIT', card_brand='VISA',
            expiry_month=12, expiry_year=2028,
        )
        # Try to list - should only see own cards
        response = self.client.get('/api/cards/')
        self.assertEqual(len(response.data['data']), 0)

        # Try to delete other user's card
        response = self.client.delete(f'/api/cards/{card.id}/')
        self.assertEqual(response.status_code, 404)

    def test_invalid_card_number_luhn(self):
        data = {
            'card_number': '1234567890123456',
            'card_holder_name': 'Test User',
            'expiry_month': 12,
            'expiry_year': 2028,
            'card_type': 'CREDIT',
        }
        response = self.client.post('/api/cards/', data, format='json')
        self.assertEqual(response.status_code, 400)

    def test_expired_card(self):
        data = {
            'card_number': '4111111111111111',
            'card_holder_name': 'Test User',
            'expiry_month': 1,
            'expiry_year': 2020,
            'card_type': 'CREDIT',
        }
        response = self.client.post('/api/cards/', data, format='json')
        self.assertEqual(response.status_code, 400)


class TestCardModel(TestCase):
    """Tests for Card model utility methods."""

    def test_mask_card_number(self):
        self.assertEqual(Card.mask_card_number('4111111111111111'), '************1111')
        self.assertEqual(Card.mask_card_number('378282246310005'), '***********0005')

    def test_detect_card_brand_visa(self):
        self.assertEqual(Card.detect_card_brand('4111111111111111'), 'VISA')

    def test_detect_card_brand_mastercard(self):
        self.assertEqual(Card.detect_card_brand('5500000000000004'), 'MASTERCARD')

    def test_detect_card_brand_amex(self):
        self.assertEqual(Card.detect_card_brand('378282246310005'), 'AMEX')

    def test_luhn_check_valid(self):
        self.assertTrue(Card.luhn_check('4111111111111111'))
        self.assertTrue(Card.luhn_check('5500000000000004'))

    def test_luhn_check_invalid(self):
        self.assertFalse(Card.luhn_check('1234567890123456'))
        self.assertFalse(Card.luhn_check('0000000000000000'))
