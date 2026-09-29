"""
Management command to seed the database with demo data.
"""
import logging
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.users.models import User
from apps.cards.models import Card
from apps.transactions.models import Transaction
from apps.adminpanel.models import AdminLog

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Seed database with demo data'

    def handle(self, *args, **options):
        if User.objects.filter(email='admin@example.com').exists():
            self.stdout.write(self.style.WARNING('Seed data already exists. Skipping.'))
            return

        self.stdout.write('Seeding database...')

        # Create admin user
        admin = User.objects.create_superuser(
            email='admin@example.com',
            password='Admin@123',
            first_name='Admin',
            last_name='User',
        )
        self.stdout.write(f'  Created admin: {admin.email} / Admin@123')

        # Create normal user
        user = User.objects.create_user(
            email='user@example.com',
            password='User@1234',
            first_name='John',
            last_name='Doe',
        )
        self.stdout.write(f'  Created user: {user.email} / User@1234')

        # Create second normal user
        user2 = User.objects.create_user(
            email='jane@example.com',
            password='User@1234',
            first_name='Jane',
            last_name='Smith',
        )
        self.stdout.write(f'  Created user: {user2.email} / User@1234')

        # Create cards for user
        card1 = Card.objects.create(
            user=user,
            card_holder_name='John Doe',
            masked_card_number='************1111',
            last_four_digits='1111',
            card_type='CREDIT',
            card_brand='VISA',
            expiry_month=12,
            expiry_year=2028,
        )

        card2 = Card.objects.create(
            user=user,
            card_holder_name='John Doe',
            masked_card_number='************4242',
            last_four_digits='4242',
            card_type='DEBIT',
            card_brand='MASTERCARD',
            expiry_month=6,
            expiry_year=2029,
        )

        card3 = Card.objects.create(
            user=user2,
            card_holder_name='Jane Smith',
            masked_card_number='***********0005',
            last_four_digits='0005',
            card_type='CREDIT',
            card_brand='AMEX',
            expiry_month=3,
            expiry_year=2028,
        )

        self.stdout.write(f'  Created {Card.objects.count()} sample cards')

        # Create transactions
        now = timezone.now()
        transactions_data = [
            # Successful transactions
            {'user': user, 'card': card1, 'amount': Decimal('1500.00'), 'currency': 'INR', 'status': 'SUCCESS', 'description': 'Online Purchase', 'delta_days': 0},
            {'user': user, 'card': card2, 'amount': Decimal('2500.50'), 'currency': 'INR', 'status': 'SUCCESS', 'description': 'Subscription Payment', 'delta_days': 1},
            {'user': user, 'card': card1, 'amount': Decimal('750.00'), 'currency': 'INR', 'status': 'SUCCESS', 'description': 'Grocery Shopping', 'delta_days': 2},
            {'user': user, 'card': card2, 'amount': Decimal('3200.00'), 'currency': 'INR', 'status': 'SUCCESS', 'description': 'Electronics Purchase', 'delta_days': 3},
            {'user': user2, 'card': card3, 'amount': Decimal('5000.00'), 'currency': 'INR', 'status': 'SUCCESS', 'description': 'Flight Booking', 'delta_days': 1},
            # Failed transactions
            {'user': user, 'card': card1, 'amount': Decimal('50000.00'), 'currency': 'INR', 'status': 'FAILED', 'description': 'Large Purchase', 'failure_reason': 'Insufficient funds', 'delta_days': 1},
            {'user': user2, 'card': card3, 'amount': Decimal('15000.00'), 'currency': 'INR', 'status': 'FAILED', 'description': 'Hotel Booking', 'failure_reason': 'Card declined by issuer', 'delta_days': 2},
            # Pending transactions
            {'user': user, 'card': card1, 'amount': Decimal('999.99'), 'currency': 'INR', 'status': 'PENDING', 'description': 'Pending Order', 'delta_days': 0},
        ]

        for tx_data in transactions_data:
            delta_days = tx_data.pop('delta_days', 0)
            failure_reason = tx_data.pop('failure_reason', '')
            tx = Transaction(
                failure_reason=failure_reason,
                **tx_data,
            )
            tx.save()
            # Update created_at to simulate different dates
            if delta_days > 0:
                Transaction.objects.filter(id=tx.id).update(
                    created_at=now - timezone.timedelta(days=delta_days)
                )

        self.stdout.write(f'  Created {Transaction.objects.count()} sample transactions')

        # Create admin log
        AdminLog.objects.create(
            admin_user=admin,
            action='SEED',
            entity_type='SYSTEM',
            description='Database seeded with demo data',
        )

        self.stdout.write(self.style.SUCCESS('Database seeded successfully!'))
        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('Demo Credentials:'))
        self.stdout.write(f'  Admin: admin@example.com / Admin@123')
        self.stdout.write(f'  User:  user@example.com / User@1234')
        self.stdout.write(f'  User:  jane@example.com / User@1234')
