"""
FastAPI application configuration.
"""
from pydantic_settings import BaseSettings
from decouple import config


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    DATABASE_URL: str = config(
        'FASTAPI_DATABASE_URL',
        default='mysql+pymysql://ccpay_user:ccpay_password@localhost:3306/credit_card_db'
    )
    JWT_SECRET_KEY: str = config(
        'FASTAPI_JWT_SECRET_KEY',
        default='jwt-secret-change-in-production'
    )
    JWT_ALGORITHM: str = 'HS256'
    PAYMENT_SUCCESS_RATE: int = config('PAYMENT_SUCCESS_RATE', default=80, cast=int)
    CORS_ORIGINS: str = config(
        'FASTAPI_CORS_ORIGINS',
        default='http://localhost:5173,http://localhost:3000'
    )

    class Config:
        env_file = '.env'


settings = Settings()
