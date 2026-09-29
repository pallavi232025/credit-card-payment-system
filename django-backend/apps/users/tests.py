"""
Tests for User authentication - registration, login, profile, protected endpoints.
"""
import pytest
from django.test import TestCase
from rest_framework.test import APIClient

from apps.users.models import User


class TestUserRegistration(TestCase):
    """Tests for user registration endpoint."""

    def setUp(self):
        self.client = APIClient()
        self.url = '/api/auth/register/'

    def test_register_success(self):
        data = {
            'email': 'test@example.com',
            'first_name': 'Test',
            'last_name': 'User',
            'password': 'TestPass@123',
            'confirm_password': 'TestPass@123',
        }
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, 201)
        self.assertTrue(response.data['success'])
        self.assertIn('access', response.data['data'])
        self.assertIn('refresh', response.data['data'])
        self.assertEqual(response.data['data']['user']['email'], 'test@example.com')

    def test_register_duplicate_email(self):
        User.objects.create_user(email='test@example.com', password='TestPass@123',
                                  first_name='Test', last_name='User')
        data = {
            'email': 'test@example.com',
            'first_name': 'Test2',
            'last_name': 'User2',
            'password': 'TestPass@123',
            'confirm_password': 'TestPass@123',
        }
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, 400)
        self.assertFalse(response.data['success'])

    def test_register_password_mismatch(self):
        data = {
            'email': 'test@example.com',
            'first_name': 'Test',
            'last_name': 'User',
            'password': 'TestPass@123',
            'confirm_password': 'DifferentPass@123',
        }
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, 400)

    def test_register_weak_password(self):
        data = {
            'email': 'test@example.com',
            'first_name': 'Test',
            'last_name': 'User',
            'password': '123',
            'confirm_password': '123',
        }
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, 400)

    def test_register_missing_fields(self):
        data = {'email': 'test@example.com'}
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, 400)


class TestUserLogin(TestCase):
    """Tests for user login endpoint."""

    def setUp(self):
        self.client = APIClient()
        self.url = '/api/auth/login/'
        self.user = User.objects.create_user(
            email='test@example.com',
            password='TestPass@123',
            first_name='Test',
            last_name='User',
        )

    def test_login_success(self):
        data = {'email': 'test@example.com', 'password': 'TestPass@123'}
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data['success'])
        self.assertIn('access', response.data['data'])
        self.assertEqual(response.data['data']['user']['role'], 'USER')

    def test_login_wrong_password(self):
        data = {'email': 'test@example.com', 'password': 'WrongPass@123'}
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, 401)

    def test_login_nonexistent_user(self):
        data = {'email': 'nobody@example.com', 'password': 'TestPass@123'}
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, 401)

    def test_login_inactive_user(self):
        self.user.is_active = False
        self.user.save()
        data = {'email': 'test@example.com', 'password': 'TestPass@123'}
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, 401)


class TestProtectedEndpoint(TestCase):
    """Tests for JWT-protected endpoints."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='test@example.com',
            password='TestPass@123',
            first_name='Test',
            last_name='User',
        )

    def _get_token(self):
        response = self.client.post('/api/auth/login/', {
            'email': 'test@example.com',
            'password': 'TestPass@123',
        }, format='json')
        return response.data['data']['access']

    def test_profile_authenticated(self):
        token = self._get_token()
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        response = self.client.get('/api/auth/profile/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['data']['email'], 'test@example.com')

    def test_profile_unauthenticated(self):
        response = self.client.get('/api/auth/profile/')
        self.assertEqual(response.status_code, 401)

    def test_profile_invalid_token(self):
        self.client.credentials(HTTP_AUTHORIZATION='Bearer invalidtoken')
        response = self.client.get('/api/auth/profile/')
        self.assertEqual(response.status_code, 401)

    def test_dashboard_authenticated(self):
        token = self._get_token()
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        response = self.client.get('/api/auth/dashboard/')
        self.assertEqual(response.status_code, 200)
        self.assertIn('card_count', response.data['data'])


class TestPasswordSecurity(TestCase):
    """Tests to verify password security."""

    def test_password_not_stored_plaintext(self):
        user = User.objects.create_user(
            email='test@example.com',
            password='TestPass@123',
            first_name='Test',
            last_name='User',
        )
        self.assertNotEqual(user.password, 'TestPass@123')
        self.assertTrue(user.password.startswith('pbkdf2_sha256$'))

    def test_password_not_in_api_response(self):
        client = APIClient()
        data = {
            'email': 'test@example.com',
            'first_name': 'Test',
            'last_name': 'User',
            'password': 'TestPass@123',
            'confirm_password': 'TestPass@123',
        }
        response = client.post('/api/auth/register/', data, format='json')
        self.assertNotIn('password', response.data['data']['user'])
        self.assertNotIn('password_hash', response.data['data']['user'])
