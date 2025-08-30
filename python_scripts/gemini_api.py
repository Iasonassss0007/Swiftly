#!/usr/bin/env python3
"""
Swiftly Google Gemini AI API Server
FastAPI server that integrates with Google Gemini AI for intelligent responses.

Features:
- Google Gemini AI integration via API
- Per-user context support (tasks, reminders, history)
- Simple POST /ask endpoint
- CORS enabled for Next.js integration
- Error handling and logging
- Session-based conversation history
"""

import os
import sys
import time
import logging
import json
from pathlib import Path
from typing import Dict, Any, Optional, List
from datetime import datetime
import hashlib

# Load environment variables from .env files
try:
    from dotenv import load_dotenv
    # Load from project root .env.local and python_scripts .env
    project_root = Path(__file__).parent.parent
    load_dotenv(project_root / '.env.local')
    load_dotenv(Path(__file__).parent / '.env')
except ImportError:
    # dotenv not available, rely on system environment variables
    pass

try:
    from fastapi import FastAPI, HTTPException, Request
    from fastapi.middleware.cors import CORSMiddleware
    from pydantic import BaseModel
    import uvicorn
except ImportError:
    print("❌ FastAPI not found. Install with: pip install fastapi uvicorn")
    sys.exit(1)

try:
    import google.generativeai as genai
except ImportError:
    print("❌ Google Generative AI SDK not found. Install with: pip install google-generativeai")
    sys.exit(1)

# Add the project root to Python path
project_root = Path(__file__).parent.parent
sys.path.append(str(project_root))

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Pydantic models for API
class UserContext(BaseModel):
    user_id: Optional[str] = None
    tasks: List[str] = []
    reminders: List[str] = []
    preferences: Dict[str, Any] = {}

class AskRequest(BaseModel):
    content: str
    user_context: Optional[UserContext] = None
    session_id: Optional[str] = None

class AskResponse(BaseModel):
    response: str
    processing_time: float
    session_id: str

class HealthResponse(BaseModel):
    status: str
    api_connected: bool
    model_name: str

# Global variables
gemini_model = None
api_key = None
conversation_history: Dict[str, List[Dict]] = {}
model_name = "gemini-1.5-flash"

# FastAPI app
app = FastAPI(
    title="Swiftly Gemini AI API",
    description="Google Gemini AI Assistant for Swiftly Dashboard",
    version="2.0.0"
)

# CORS middleware for Next.js integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def initialize_gemini():
    """Initialize Google Gemini AI with API key."""
    global gemini_model, api_key
    
    try:
        # Get API key from environment variable
        api_key = os.getenv("GOOGLE_GEMINI_API_KEY")
        if not api_key:
            logger.error("❌ GOOGLE_GEMINI_API_KEY environment variable not set")
            logger.error("💡 Get your API key from: https://makersuite.google.com/app/apikey")
            logger.error("💡 Set it with one of these methods:")
            logger.error("   1. Command: set GOOGLE_GEMINI_API_KEY=your_api_key_here")
            logger.error("   2. Add to .env.local file: GOOGLE_GEMINI_API_KEY=your_api_key_here")
            logger.error("   3. Set as system environment variable")
            return False
        
        # Validate API key format (basic check)
        if not api_key.startswith('AI') or len(api_key) < 30:
            logger.error("❌ Invalid API key format. Please check your GOOGLE_GEMINI_API_KEY")
            logger.error("💡 API keys should start with 'AI' and be around 39 characters long")
            return False
        
        # Configure the Gemini API
        genai.configure(api_key=api_key)  # type: ignore
        
        # Initialize the model
        gemini_model = genai.GenerativeModel(model_name)  # type: ignore
        
        logger.info(f"✅ Swiftly AI productivity assistant initialized successfully (powered by Google Gemini {model_name})")
        return True
        
    except Exception as e:
        logger.error(f"Failed to initialize Google Gemini: {e}")
        logger.error("💡 Please check your API key and internet connection")
        return False

def generate_session_id(user_context: Optional[UserContext] = None) -> str:
    """Generate a unique session ID based on user context and timestamp."""
    timestamp = str(int(time.time()))
    user_id = user_context.user_id if user_context and user_context.user_id else "anonymous"
    raw_string = f"{user_id}_{timestamp}"
    return hashlib.md5(raw_string.encode()).hexdigest()[:12]

def build_context_prompt(user_context: Optional[UserContext] = None) -> str:
    """Build a basic context prompt."""
    
    if not user_context:
        return "You are a helpful AI assistant. Please provide clear and concise responses."
    
    # Add user-specific context integration
    context_parts = ["You are a helpful AI assistant."]
    
    if user_context.tasks:
        context_parts.append(f"\nUser's current tasks: {', '.join(user_context.tasks[:5])}")
    
    if user_context.reminders:
        context_parts.append(f"\nUser's reminders: {', '.join(user_context.reminders[:3])}")
    
    return "\n".join(context_parts)

def get_conversation_history(session_id: str) -> List[Dict]:
    """Get conversation history for a session."""
    return conversation_history.get(session_id, [])

def add_to_conversation_history(session_id: str, user_message: str, ai_response: str):
    """Add a message pair to conversation history."""
    if session_id not in conversation_history:
        conversation_history[session_id] = []
    
    conversation_history[session_id].append({
        "timestamp": datetime.now().isoformat(),
        "user": user_message,
        "assistant": ai_response
    })
    
    # Keep only last 10 conversation pairs to manage memory
    if len(conversation_history[session_id]) > 10:
        conversation_history[session_id] = conversation_history[session_id][-10:]

async def generate_ai_response(
    content: str, 
    user_context: Optional[UserContext] = None,
    session_id: Optional[str] = None
) -> str:
    """Generate AI response using Google Gemini."""
    try:
        if not gemini_model:
            raise HTTPException(status_code=503, detail="AI model not initialized")
        
        # Build basic context prompt
        system_prompt = build_context_prompt(user_context)
        
        # Get conversation history
        history_context = ""
        if session_id:
            history = get_conversation_history(session_id)
            if history:
                recent_history = history[-2:]  # Last 2 exchanges
                history_parts = []
                for h in recent_history:
                    history_parts.append(f"User: {h['user']}")
                    history_parts.append(f"Assistant: {h['assistant']}")
                history_context = "\n".join(history_parts) + "\n" if history_parts else ""
        
        # Construct the prompt
        full_prompt = f"{system_prompt}\n\n{history_context}User: {content}\nAssistant:"
        
        # Generate response using Gemini
        response = gemini_model.generate_content(
            full_prompt,
            generation_config=genai.types.GenerationConfig(  # type: ignore
                temperature=0.7,
                top_p=0.9,
                top_k=40,
                max_output_tokens=500,
                candidate_count=1,
            )
        )
        
        ai_response = response.text.strip()
        
        # Add to conversation history
        if session_id:
            add_to_conversation_history(session_id, content, ai_response)
        
        return ai_response
        
    except Exception as e:
        logger.error(f"Error generating AI response: {e}")
        return "I apologize, but I'm having trouble processing your request right now. Please try again."

@app.on_event("startup")
async def startup_event():
    """Initialize AI on startup."""
    logger.info("Starting AI API server...")
    
    success = initialize_gemini()
    if success:
        logger.info("🚀 AI server is ready!")
    else:
        logger.error("❌ Failed to start - AI initialization failed")

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    api_connected = gemini_model is not None
    return HealthResponse(
        status="healthy" if api_connected else "api_not_initialized",
        api_connected=api_connected,
        model_name=model_name
    )

@app.post("/ask", response_model=AskResponse)
async def ask_gemini(request: AskRequest):
    """
    Ask the AI assistant for help.
    
    Args:
        request: Contains the user's question, optional user context, and session ID
    
    Returns:
        AI response with processing time and session ID
    """
    if not gemini_model:
        raise HTTPException(status_code=503, detail="AI model not initialized")
    
    if not request.content.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")
    
    start_time = time.time()
    
    try:
        # Generate or use provided session ID
        session_id = request.session_id or generate_session_id(request.user_context)
        
        # Generate AI response
        ai_response = await generate_ai_response(
            request.content,
            request.user_context,
            session_id
        )
        
        processing_time = time.time() - start_time
        
        logger.info(f"AI generated response in {processing_time:.2f}s for session {session_id}")
        
        return AskResponse(
            response=ai_response,
            processing_time=processing_time,
            session_id=session_id
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in ask_gemini: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/")
async def root():
    """Root endpoint with AI information."""
    return {
        "message": "AI Assistant API",
        "powered_by": "Google Gemini API",
        "version": "2.0.0",
        "docs": "/docs",
        "health": "/health"
    }

def main():
    """Main function to run the API server."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Swiftly Gemini AI API Server")
    parser.add_argument("--host", default="127.0.0.1", help="Host to bind to")
    parser.add_argument("--port", type=int, default=8000, help="Port to bind to")
    parser.add_argument("--reload", action="store_true", help="Enable auto-reload")
    
    args = parser.parse_args()
    
    print("🚀 Starting AI API Server...")
    print(f"📡 Server will be available at http://{args.host}:{args.port}")
    print(f"📚 API documentation at http://{args.host}:{args.port}/docs")
    print("\n⚠️  Make sure to set GOOGLE_GEMINI_API_KEY environment variable!")
    
    uvicorn.run(
        "gemini_api:app",
        host=args.host,
        port=args.port,
        reload=args.reload,
        log_level="info"
    )

if __name__ == "__main__":
    main()