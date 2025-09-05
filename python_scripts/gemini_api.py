#!/usr/bin/env python3
"""
Swiftly Google Gemini AI API Server
FastAPI server that integrates with Google Gemini AI for intelligent responses.

Features:
- Google Gemini AI integration via API
- Supabase integration for user profile context
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
    project_root = Path(__file__).parent.parent
    load_dotenv(project_root / '.env.local')
    load_dotenv(Path(__file__).parent / '.env')
except ImportError:
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

try:
    from supabase import create_client, Client
except ImportError:
    print("Supabase SDK not found. Install with: pip install supabase")
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
class UserProfile(BaseModel):
    id: str
    full_name: Optional[str] = None
    email: Optional[str] = None
    company_name: Optional[str] = None
    role: Optional[str] = None

class UserContext(BaseModel):
    user_id: Optional[str] = None
    tasks: List[str] = []
    reminders: List[str] = []
    preferences: Dict[str, Any] = {}
    profile: Optional[UserProfile] = None

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
    supabase_connected: bool

# Global variables
gemini_model = None
api_key = None
supabase_client: Optional[Client] = None
conversation_history: Dict[str, List[Dict]] = {}
model_name = "gemini-1.5-flash"

# FastAPI app
app = FastAPI(
    title="Swiftly Gemini AI API",
    description="Google Gemini AI Assistant for Swiftly Dashboard with Supabase Integration",
    version="2.1.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001", "http://127.0.0.1:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def initialize_services():
    """Initialize Google Gemini AI and Supabase client."""
    global gemini_model, api_key, supabase_client
    
    # Initialize Gemini
    try:
        api_key = os.getenv("GOOGLE_GEMINI_API_KEY")
        if not api_key:
            logger.error("❌ GOOGLE_GEMINI_API_KEY not set.")
            return False
        genai.configure(api_key=api_key)
        gemini_model = genai.GenerativeModel(model_name)
        logger.info(f"✅ Gemini AI initialized (model: {model_name})")
    except Exception as e:
        logger.error(f"Failed to initialize Google Gemini: {e}")
        return False

    # Initialize Supabase
    try:
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_SERVICE_KEY")
        if not supabase_url or not supabase_key:
            logger.error("❌ SUPABASE_URL or SUPABASE_SERVICE_KEY not set.")
            return False
        supabase_client = create_client(supabase_url, supabase_key)
        logger.info("✅ Supabase client initialized.")
    except Exception as e:
        logger.error(f"Failed to initialize Supabase client: {e}")
        return False

    return True

async def fetch_user_profile(user_id: str) -> Optional[Dict]:
    """Fetch user profile from Supabase."""
    if not supabase_client:
        logger.warning("Supabase client not available, skipping profile fetch.")
        return None
    try:
        response = await supabase_client.from_("profiles").select("id, full_name, email, company_name, role").eq("id", user_id).single().execute()
        if response.data:
            logger.info(f"Successfully fetched profile for user {user_id}")
            return response.data
        return None
    except Exception as e:
        logger.error(f"Error fetching profile for user {user_id}: {e}")
        return None

def build_context_prompt(user_context: Optional[UserContext] = None) -> str:
    """Build a natural language context prompt to guide the AI's personality."""
    if not user_context or not user_context.profile:
        return "You are a helpful and friendly AI assistant for the Swiftly platform. Be conversational and natural in your responses."

    profile = user_context.profile
    name = profile.full_name or "the user"
    
    context_parts = [
        f"You are a personal AI assistant for {name}. Your goal is to be as helpful and natural as possible, like a real human assistant.",
        f"Here is some information about {name} to help you personalize the conversation:",
        f"- Name: {profile.full_name}",
        f"- Email: {profile.email}",
    ]
    if profile.company_name:
        context_parts.append(f"- Company: {profile.company_name}")
    if profile.role:
        context_parts.append(f"- Role: {profile.role}")

    if user_context.tasks:
        context_parts.append(f"\nThey are currently working on these tasks: {', '.join(user_context.tasks[:5])}.")
    
    if user_context.reminders:
        context_parts.append(f"They have the following reminders: {', '.join(user_context.reminders[:3])}.")

    context_parts.append("\nAdopt a friendly, conversational, and proactive tone. Always aim to be helpful.")
    return "\n".join(context_parts)

async def generate_ai_response(
    content: str, 
    user_context: Optional[UserContext] = None,
    session_id: Optional[str] = None
) -> str:
    """Generate AI response using Google Gemini, enriched with user context."""
    if not gemini_model:
        raise HTTPException(status_code=503, detail="AI model not initialized")

    if user_context and user_context.user_id:
        profile_data = await fetch_user_profile(user_context.user_id)
        if profile_data:
            user_context.profile = UserProfile(**profile_data)

    system_prompt = build_context_prompt(user_context)
    
    history = conversation_history.get(session_id, [])
    chat = gemini_model.start_chat(history=history)
    
    full_prompt = f"{system_prompt}\n\nUser: {content}\nAssistant:"

    try:
        response = await chat.send_message_async(
            full_prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=0.7, top_p=0.9, top_k=40, max_output_tokens=500, candidate_count=1
            )
        )
        ai_response = response.text.strip()
        
        if session_id:
            conversation_history[session_id] = chat.history
        
        return ai_response
    except Exception as e:
        logger.error(f"Error generating AI response: {e}")
        return "I apologize, but I'm having trouble processing your request right now."

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup."""
    logger.info("Starting AI API server...")
    if initialize_services():
        logger.info("🚀 AI server is ready!")
    else:
        logger.error("❌ Failed to start - service initialization failed")

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    return HealthResponse(
        status="healthy" if gemini_model and supabase_client else "degraded",
        api_connected=gemini_model is not None,
        model_name=model_name,
        supabase_connected=supabase_client is not None
    )

@app.post("/ask", response_model=AskResponse)
async def ask_gemini(request: AskRequest):
    """Ask the AI assistant for help."""
    if not request.content.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")
    
    start_time = time.time()
    session_id = request.session_id or str(int(time.time()))
    
    try:
        ai_response = await generate_ai_response(request.content, request.user_context, session_id)
        processing_time = time.time() - start_time
        logger.info(f"AI generated response in {processing_time:.2f}s for session {session_id}")
        return AskResponse(response=ai_response, processing_time=processing_time, session_id=session_id)
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Unexpected error in ask_gemini: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

# Other endpoints (extract_task_name, root, etc.) remain largely the same
# but are omitted here for brevity in this diff.
# A full implementation would include them.

def main():
    """Main function to run the API server."""
    import argparse
    parser = argparse.ArgumentParser(description="Swiftly Gemini AI API Server")
    parser.add_argument("--host", default="127.0.0.1", help="Host to bind to")
    parser.add_argument("--port", type=int, default=8000, help="Port to bind to")
    parser.add_argument("--reload", action="store_true", help="Enable auto-reload")
    args = parser.parse_args()
    
    print("🚀 Starting AI API Server with Supabase Integration...")
    print(f"📡 Server will be available at http://{args.host}:{args.port}")
    print("\n⚠️  Make sure to set GOOGLE_GEMINI_API_KEY, SUPABASE_URL, and SUPABASE_SERVICE_KEY environment variables!")
    
    uvicorn.run("gemini_api:app", host=args.host, port=args.port, reload=args.reload, log_level="info")

if __name__ == "__main__":
    main()
