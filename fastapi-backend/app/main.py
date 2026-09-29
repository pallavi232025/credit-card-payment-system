"""
FastAPI application entry point for Payment Processing Service.
"""
import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.payment_router import router as payment_router
from app.core.config import settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(levelname)s %(asctime)s %(name)s: %(message)s',
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Credit Card Payment System - Payment API",
    description="FastAPI service for payment processing with simulated payment gateway",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# CORS configuration
origins = [o.strip() for o in settings.CORS_ORIGINS.split(',')]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler - never exposes internal details."""
    logger.error(f"Unhandled error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": "An internal error occurred",
            "data": None,
            "errors": [],
        }
    )


@app.on_event("startup")
async def startup_event():
    logger.info("Payment Processing Service started")


@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Payment Processing Service shutting down")


# Include routers
app.include_router(payment_router)


@app.get("/", tags=["Root"])
async def root():
    """Root endpoint."""
    return {
        "service": "Credit Card Payment System - Payment API",
        "version": "1.0.0",
        "docs": "/docs",
    }
