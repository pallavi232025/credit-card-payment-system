"""
Utility functions for consistent API responses and exception handling.
"""
import logging

from rest_framework.response import Response
from rest_framework.views import exception_handler

logger = logging.getLogger(__name__)


def success_response(data=None, message="Operation successful", status_code=200):
    """Return a standardized success response."""
    return Response({
        "success": True,
        "message": message,
        "data": data,
        "errors": []
    }, status=status_code)


def error_response(message="An error occurred", errors=None, status_code=400):
    """Return a standardized error response."""
    return Response({
        "success": False,
        "message": message,
        "data": None,
        "errors": errors or []
    }, status=status_code)


def custom_exception_handler(exc, context):
    """Custom exception handler for consistent API error responses."""
    response = exception_handler(exc, context)

    if response is not None:
        errors = []
        if isinstance(response.data, dict):
            for field, messages in response.data.items():
                if isinstance(messages, list):
                    for msg in messages:
                        errors.append({"field": field, "message": str(msg)})
                elif isinstance(messages, str):
                    errors.append({"field": field, "message": messages})
                else:
                    errors.append({"field": field, "message": str(messages)})
        elif isinstance(response.data, list):
            for msg in response.data:
                errors.append({"field": "non_field_errors", "message": str(msg)})

        response.data = {
            "success": False,
            "message": "Request failed",
            "data": None,
            "errors": errors
        }

    return response
