"""
SQLAlchemy models matching the Django-created tables.
These are read/write models for FastAPI to interact with the shared database.
"""
from sqlalchemy import Column, Integer, String, Numeric, DateTime, Text, Boolean, ForeignKey
from sqlalchemy.sql import func

from app.core.database import Base


class User(Base):
    """User model - mirrors Django's users table."""
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True)
    first_name = Column(String(100))
    last_name = Column(String(100))
    password = Column(String(128))  # Django's password hash field
    role = Column(String(10), default='USER')
    is_active = Column(Boolean, default=True)
    is_staff = Column(Boolean, default=False)
    is_superuser = Column(Boolean, default=False)
    last_login = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())


class Card(Base):
    """Card model - mirrors Django's cards table."""
    __tablename__ = 'cards'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), index=True)
    card_holder_name = Column(String(150))
    masked_card_number = Column(String(19))
    last_four_digits = Column(String(4))
    card_type = Column(String(10))
    card_brand = Column(String(15))
    expiry_month = Column(Integer)
    expiry_year = Column(Integer)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())


class Transaction(Base):
    """Transaction model - mirrors Django's transactions table."""
    __tablename__ = 'transactions'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), index=True)
    card_id = Column(Integer, ForeignKey('cards.id'), nullable=True)
    transaction_reference = Column(String(50), unique=True, index=True)
    amount = Column(Numeric(12, 2))
    currency = Column(String(3), default='INR')
    description = Column(String(255), default='')
    status = Column(String(10), default='PENDING')
    failure_reason = Column(Text, default='')
    idempotency_key = Column(String(100), nullable=True, unique=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
