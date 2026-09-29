"""
Tests for Transaction management - listing, filtering, user isolation.
"""
from decimal import Decimal

from django.test import TestCase
from rest_framework.test import APIClient

from apps.users.models import User
from apps.cards.models import Card
from apps.transactions.models import Transaction


class TestTransactionListing(TestCase):
    """Tests for transaction listing and filtering."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='test@example.com', password='TestPass@123',
            first_name='Test', last_name='User',
        )
        self.user2 = User.objects.create_user(
            email='test2@example.com', password='TestPass@123',
            first_name='Test2', last_name='User2',
        )
        self.card = Card.objects.create(
            user=self.user, card_holder_name='Test', masked_card_number='************1111',
            last_four_digits='1111', card_type='CREDIT', card_brand='VISA',
            expiry_month=12, expiry_year=2028,
        )
        # Create transactions
        Transaction.objects.create(
            user=self.user, card=self.card, amount=Decimal('1000.00'),
            currency='INR', status='SUCCESS', description='Test payment 1',
        )
        Transaction.objects.create(
            user=self.user, card=self.card, amount=Decimal('500.00'),
            currency='INR', status='FAILED', description='Test payment 2',
            failure_reason='Insufficient funds',
        )
        Transaction.objects.create(
            user=self.user, card=self.card, amount=Decimal('750.00'),
            currency='INR', status='PENDING', description='Test payment 3',
        )
        # Other user's transaction
        card2 = Card.objects.create(
            user=self.user2, card_holder_name='Test2', masked_card_number='************2222',
            last_four_digits='2222', card_type='CREDIT', card_brand='VISA',
            expiry_month=12, expiry_year=2028,
        )
        Transaction.objects.create(
            user=self.user2, card=card2, amount=Decimal('2000.00'),
            currency='INR', status='SUCCESS', description='Other user payment',
        )

        # Login
        response = self.client.post('/api/auth/login/', {
            'email': 'test@example.com', 'password': 'TestPass@123'
        }, format='json')
        self.token = response.data['data']['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

    def test_list_transactions(self):
        response = self.client.get('/api/transactions/')
        self.assertEqual(response.status_code, 200)
        # User should only see their own 3 transactions
        self.assertEqual(len(response.data['data']['transactions']), 3)

    def test_user_isolation(self):
        """User cannot see other user's transactions."""
        response = self.client.get('/api/transactions/')
        emails = [tx.get('user_email') for tx in response.data['data']['transactions']]
        self.assertTrue(all(e == 'test@example.com' for e in emails))

    def test_filter_by_status(self):
        response = self.client.get('/api/transactions/?status=SUCCESS')
        self.assertEqual(len(response.data['data']['transactions']), 1)
        self.assertEqual(response.data['data']['transactions'][0]['status'], 'SUCCESS')

    def test_filter_by_amount(self):
        response = self.client.get('/api/transactions/?min_amount=700&max_amount=1100')
        transactions = response.data['data']['transactions']
        for tx in transactions:
            self.assertGreaterEqual(float(tx['amount']), 700)
            self.assertLessEqual(float(tx['amount']), 1100)

    def test_pagination(self):
        response = self.client.get('/api/transactions/?page=1&page_size=2')
        self.assertEqual(len(response.data['data']['transactions']), 2)
        self.assertEqual(response.data['data']['pagination']['total'], 3)
        self.assertEqual(response.data['data']['pagination']['total_pages'], 2)

    def test_search_by_reference(self):
        tx = Transaction.objects.filter(user=self.user).first()
        response = self.client.get(f'/api/transactions/?search={tx.transaction_reference}')
        self.assertEqual(len(response.data['data']['transactions']), 1)

    def test_transaction_detail(self):
        tx = Transaction.objects.filter(user=self.user).first()
        response = self.client.get(f'/api/transactions/{tx.id}/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['data']['id'], tx.id)

    def test_transaction_detail_other_user(self):
        tx = Transaction.objects.filter(user=self.user2).first()
        response = self.client.get(f'/api/transactions/{tx.id}/')
        self.assertEqual(response.status_code, 404)


class TestTransactionModel(TestCase):
    """Tests for Transaction model."""

    def test_auto_reference_generation(self):
        user = User.objects.create_user(
            email='test@example.com', password='TestPass@123',
            first_name='Test', last_name='User',
        )
        tx = Transaction.objects.create(
            user=user, amount=Decimal('100.00'), currency='INR', status='PENDING',
        )
        self.assertTrue(tx.transaction_reference.startswith('TXN-'))
        self.assertEqual(len(tx.transaction_reference), 16)  # TXN- + 12 chars

    def test_decimal_precision(self):
        user = User.objects.create_user(
            email='test@example.com', password='TestPass@123',
            first_name='Test', last_name='User',
        )
        tx = Transaction.objects.create(
            user=user, amount=Decimal('1234.56'), currency='INR', status='SUCCESS',
        )
        tx.refresh_from_db()
        self.assertEqual(tx.amount, Decimal('1234.56'))
