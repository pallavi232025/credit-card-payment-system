"""
Tests for Admin panel - dashboard, user management, CSV export, logs.
"""
from decimal import Decimal

from django.test import TestCase
from rest_framework.test import APIClient

from apps.users.models import User
from apps.cards.models import Card
from apps.transactions.models import Transaction
from apps.adminpanel.models import AdminLog


class TestAdminAccess(TestCase):
    """Tests for admin access control."""

    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_superuser(
            email='admin@example.com', password='Admin@123',
            first_name='Admin', last_name='User',
        )
        self.user = User.objects.create_user(
            email='user@example.com', password='User@1234',
            first_name='Normal', last_name='User',
        )

    def _admin_login(self):
        response = self.client.post('/api/auth/login/', {
            'email': 'admin@example.com', 'password': 'Admin@123'
        }, format='json')
        return response.data['data']['access']

    def _user_login(self):
        response = self.client.post('/api/auth/login/', {
            'email': 'user@example.com', 'password': 'User@1234'
        }, format='json')
        return response.data['data']['access']

    def test_admin_dashboard_access(self):
        token = self._admin_login()
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        response = self.client.get('/api/admin/dashboard/')
        self.assertEqual(response.status_code, 200)
        self.assertIn('total_users', response.data['data'])

    def test_user_cannot_access_admin(self):
        token = self._user_login()
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        response = self.client.get('/api/admin/dashboard/')
        self.assertEqual(response.status_code, 403)

    def test_admin_user_list(self):
        token = self._admin_login()
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        response = self.client.get('/api/admin/users/')
        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(len(response.data['data']['users']), 2)

    def test_admin_activate_deactivate_user(self):
        token = self._admin_login()
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

        # Deactivate user
        response = self.client.patch(
            f'/api/admin/users/{self.user.id}/',
            {'is_active': False}, format='json'
        )
        self.assertEqual(response.status_code, 200)
        self.user.refresh_from_db()
        self.assertFalse(self.user.is_active)

        # Activate user
        response = self.client.patch(
            f'/api/admin/users/{self.user.id}/',
            {'is_active': True}, format='json'
        )
        self.assertEqual(response.status_code, 200)
        self.user.refresh_from_db()
        self.assertTrue(self.user.is_active)

    def test_admin_cannot_deactivate_self(self):
        token = self._admin_login()
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        response = self.client.patch(
            f'/api/admin/users/{self.admin.id}/',
            {'is_active': False}, format='json'
        )
        self.assertEqual(response.status_code, 400)

    def test_csv_export(self):
        # Create some transactions first
        card = Card.objects.create(
            user=self.user, card_holder_name='Test', masked_card_number='************1111',
            last_four_digits='1111', card_type='CREDIT', card_brand='VISA',
            expiry_month=12, expiry_year=2028,
        )
        Transaction.objects.create(
            user=self.user, card=card, amount=Decimal('1000.00'),
            currency='INR', status='SUCCESS', description='Test',
        )

        token = self._admin_login()
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        response = self.client.get('/api/admin/transactions/export/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['Content-Type'], 'text/csv')
        content = response.content.decode()
        self.assertIn('Transaction ID', content)
        self.assertIn('Transaction Reference', content)
        # Verify no full card numbers or CVV in export
        self.assertNotIn('4111111111111111', content)

    def test_admin_daily_summary(self):
        token = self._admin_login()
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        response = self.client.get('/api/admin/reports/daily-summary/')
        self.assertEqual(response.status_code, 200)
        self.assertIn('daily_summary', response.data['data'])

    def test_admin_logs_created(self):
        token = self._admin_login()
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        # View dashboard to create a log
        self.client.get('/api/admin/dashboard/')
        # Check logs
        response = self.client.get('/api/admin/logs/')
        self.assertEqual(response.status_code, 200)
        self.assertGreater(len(response.data['data']['logs']), 0)

    def test_admin_view_cards(self):
        Card.objects.create(
            user=self.user, card_holder_name='Test', masked_card_number='************1111',
            last_four_digits='1111', card_type='CREDIT', card_brand='VISA',
            expiry_month=12, expiry_year=2028,
        )
        token = self._admin_login()
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        response = self.client.get('/api/admin/cards/')
        self.assertEqual(response.status_code, 200)
        cards = response.data['data']['cards']
        self.assertEqual(len(cards), 1)
        # Verify no full card numbers
        self.assertIn('************', cards[0]['masked_card_number'])
