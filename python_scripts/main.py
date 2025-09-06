#!/usr/bin/env python3
"""
Swiftly AI API - Modular FastAPI Application

A refactored, scalable AI backend for the Swiftly productivity platform.
Features modular architecture, proper dependency injection, and enhanced logging.

Features:
- Google Gemini AI integration
- Conversational AI with session management  
- Task intent detection
- RAG-ready architecture
- Proper logging and error handling
- Modular, maintainable codebase
"""

import sys
import argparse
from contextlib import asynccontextmanager
from pathlib import Path

# Add the project root to Python path for imports
project_root = Path(__file__).resolve().parent
sys.path.append(str(project_root))

try:
    from fastapi import FastAPI
    from fastapi.middleware.cors import CORSMiddleware
    import uvicorn
except ImportError:
    print("❌ FastAPI not found. Install with: pip install fastapi uvicorn")
    sys.exit(1)

from app.config import get_settings
from app.api.gemini_routes import router as gemini_router, initialize_services
from app.utils.logging_config import setup_logging


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    settings = get_settings()
    logger = setup_logging(settings.log_level, settings.log_format)
    
    # Startup
    logger.info("🚀 Starting Swiftly AI API server...")
    
    try:
        await initialize_services(settings)
        logger.info("✅ AI server is ready!")
    except Exception as e:
        logger.error(f"❌ Failed to start - service initialization failed: {e}")
        raise
    
    yield
    
    # Shutdown
    logger.info("🛑 Shutting down AI API server...")


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    settings = get_settings()
    
    # Create FastAPI app
    app = FastAPI(
        title=settings.app_name,
        description="Modular AI backend for Swiftly productivity platform with Google Gemini integration",
        version=settings.app_version,
        lifespan=lifespan
    )
    
    # Add CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Include routers
    app.include_router(gemini_router, prefix="", tags=["AI"])
    
    # Root endpoint
    @app.get("/")
    async def root():
        """Root endpoint with API information."""
        return {
            "message": "Swiftly AI API - Modular Backend",
            "version": settings.app_version,
            "status": "running",
            "endpoints": {
                "health": "/health",
                "ask": "/ask",
                "ask_natural": "/ask-natural", 
                "task_intent": "/analyze-task-intent"
            }
        }
    
    return app


# Create app instance
app = create_app()


def main():
    """Main function to run the API server."""
    parser = argparse.ArgumentParser(description="Swiftly AI API Server - Modular Backend")
    parser.add_argument("--host", default="127.0.0.1", help="Host to bind to")
    parser.add_argument("--port", type=int, default=8000, help="Port to bind to")
    parser.add_argument("--reload", action="store_true", help="Enable auto-reload for development")
    parser.add_argument("--log-level", default="INFO", help="Logging level")
    args = parser.parse_args()
    
    print("🚀 Starting Swiftly AI API Server (Modular Architecture)...")
    print(f"📡 Server will be available at http://{args.host}:{args.port}")
    print(f"📚 API documentation at http://{args.host}:{args.port}/docs")
    print(f"📊 Health check at http://{args.host}:{args.port}/health")
    print("\n⚠️  Make sure to set GOOGLE_GEMINI_API_KEY environment variable!")
    print("\n🔧 Available endpoints:")
    print("   • POST /ask - Natural conversation with AI")
    print("   • POST /ask-natural - Enhanced conversational AI (RAG-ready)")
    print("   • POST /analyze-task-intent - Task intent detection")
    print("   • GET /health - Health check")
    print("   • GET /docs - API documentation")
    
    try:
        uvicorn.run(
            "main:app",
            host=args.host,
            port=args.port,
            reload=args.reload,
            log_level=args.log_level.lower()
        )
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
    except Exception as e:
        print(f"\n❌ Server error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
