"""
API routes for the Swiftly AI API.
"""

from .gemini_routes import router as gemini_router

__all__ = ["gemini_router"]
