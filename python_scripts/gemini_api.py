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
    project_root = Path(__file__).resolve().parent.parent
    load_dotenv(project_root / '.env.local')
    load_dotenv(Path(__file__).resolve().parent / '.env')
except ImportError:
    pass

try:
    from fastapi import FastAPI, HTTPException, Request
    from fastapi.middleware.cors import CORSMiddleware
    from contextlib import asynccontextmanager
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

# Supabase integration removed - AI works without profile access

# Add the project root to Python path
project_root = Path(__file__).resolve().parent.parent
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

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting AI API server...")
    if initialize_services():
        logger.info("🚀 AI server is ready!")
    else:
        logger.error("❌ Failed to start - service initialization failed")
    yield
    # Shutdown (if needed)
    logger.info("Shutting down AI API server...")

# FastAPI app
app = FastAPI(
    title="Swiftly Gemini AI API",
    description="Google Gemini AI Assistant for Swiftly Dashboard with Supabase Integration",
    version="2.1.0",
    lifespan=lifespan
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
    """Initialize Google Gemini AI."""
    global gemini_model, api_key
    
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

    return True


def build_context_prompt(user_context: Optional[UserContext] = None) -> str:
    """Build a natural language context prompt to guide the AI's personality with real-time context."""
    
    # Get current real-time information
    from datetime import datetime
    
    # Use system local time
    try:
        current_time = datetime.now()
    except Exception:
        current_time = datetime.utcnow()
    
    # Format date/time components
    current_date = current_time.strftime("%Y-%m-%d")  # YYYY-MM-DD
    current_time_str = current_time.strftime("%H:%M")  # HH:MM (24h)
    current_day = current_time.strftime("%A")  # Monday, Tuesday, etc.
    
    context_parts = [
        "You are an intelligent, knowledgeable AI assistant integrated with the Swiftly productivity platform.",
        "Your primary role is to engage in natural, helpful conversations and provide informative answers to questions.",
        "",
        f"REAL-TIME CONTEXT:",
        f"• Current Date: {current_date}",
        f"• Current Time: {current_time_str}",
        f"• Day of Week: {current_day}",
        f"• You have access to accurate, real-time temporal information - never guess dates or times",
        f"• Reference this information naturally when relevant to user queries",
        f"• Use this context for scheduling, time-based questions, or temporal references",
        "",
        "CORE PRINCIPLES:",
        "• Prioritize open-ended conversation and context understanding",
        "• Provide complete, accurate, and helpful information using your knowledge base",
        "• Respond naturally like a knowledgeable colleague, not a scripted bot",
        "• Answer questions about any topic: current events, research, explanations, advice, analysis",
        "• Use natural language processing to understand the full context of queries",
        "",
        "COMMUNICATION STYLE:",
        "• Professional yet conversational tone",
        "• Avoid repetitive phrases, templates, or childish language",
        "• Provide thorough, well-structured responses",
        "• Ask clarifying questions when needed",
        "• Acknowledge when you don't have current information",
        "• Use plain text only - NO markdown formatting, asterisks, or special characters",
        "• Write naturally without bold, italic, or bullet point formatting",
        "",
        "TASK HANDLING:",
        "• Task creation is OPTIONAL and SECONDARY to conversation",
        "• Only suggest tasks when users explicitly request reminders, scheduling, or to-do items",
        "• Always provide a conversational response first, regardless of task intent",
        "• Never force task creation or make it the primary focus"
    ]

    if user_context:
        if user_context.tasks:
            context_parts.append(f"\nUSER CONTEXT: The user is working on: {', '.join(user_context.tasks[:3])}.")
        
        if user_context.reminders:
            context_parts.append(f"They have reminders for: {', '.join(user_context.reminders[:2])}.")

    context_parts.append("\nRespond naturally and helpfully to whatever the user asks, focusing on providing value through information and conversation.")
    context_parts.append("\nIMPORTANT: Write in plain text only. Do not use markdown, asterisks (*), underscores (_), or any special formatting characters except when absolutely necessary.")
    return "\n".join(context_parts)

async def generate_ai_response(
    content: str, 
    user_context: Optional[UserContext] = None,
    session_id: Optional[str] = None
) -> str:
    """Generate AI response using Google Gemini, enriched with user context."""
    if not gemini_model:
        raise HTTPException(status_code=503, detail="AI model not initialized")

    system_prompt = build_context_prompt(user_context)
    
    history = conversation_history.get(session_id, [])
    chat = gemini_model.start_chat(history=history)
    
    full_prompt = f"{system_prompt}\n\nUser: {content}\nAssistant:"

    try:
        response = await chat.send_message_async(
            full_prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=0.8, top_p=0.9, top_k=40, max_output_tokens=1000, candidate_count=1
            )
        )
        ai_response = response.text.strip()
        
        if session_id:
            conversation_history[session_id] = chat.history
        
        return ai_response
    except Exception as e:
        logger.error(f"Error generating AI response: {e}")
        return "I apologize, but I'm having trouble processing your request right now."


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    return HealthResponse(
        status="healthy" if gemini_model else "degraded",
        api_connected=gemini_model is not None,
        model_name=model_name
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

@app.post("/analyze-task-intent")
async def analyze_task_intent(request: AskRequest):
    """Analyze user message for task creation intent without generating conversational response."""
    if not request.content.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")
    
    start_time = time.time()
    
    try:
        # Use Gemini specifically for task intent analysis
        if not gemini_model:
            raise HTTPException(status_code=503, detail="AI model not initialized")

        # Create a focused prompt for task intent analysis only
        task_analysis_prompt = f"""You are a task intent analyzer. Analyze this message and return ONLY a JSON response:

Message: "{request.content}"

Determine if the user wants to create a task, reminder, or to-do item. Respond with JSON:
{{
  "hasTaskIntent": true/false,
  "taskName": "exact task name" or null,
  "dueDate": "YYYY-MM-DD HH:MM" or null,
  "priority": "low"|"medium"|"high" or null,
  "needsClarity": true/false
}}

Only detect task intent for explicit requests like "remind me", "schedule", "create task", "add to list".
Do NOT detect intent for questions, information requests, or general conversation.

Return only the JSON, nothing else."""

        try:
            response = await gemini_model.generate_content_async(
                task_analysis_prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.3, top_p=0.8, top_k=20, max_output_tokens=200, candidate_count=1
                )
            )
            ai_response = response.text.strip()
            
            processing_time = time.time() - start_time
            logger.info(f"Task intent analyzed in {processing_time:.2f}s")
            
            return {"response": ai_response, "processing_time": processing_time}
            
        except Exception as e:
            logger.error(f"Error in task intent analysis: {e}")
            # Return no intent if analysis fails
            return {
                "response": '{"hasTaskIntent": false, "taskName": null, "dueDate": null, "priority": null, "needsClarity": false}',
                "processing_time": time.time() - start_time
            }
            
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Unexpected error in analyze_task_intent: {e}")
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
    
    print("🚀 Starting AI API Server...")
    print(f"📡 Server will be available at http://{args.host}:{args.port}")
    print("\n⚠️  Make sure to set GOOGLE_GEMINI_API_KEY environment variable!")
    
    uvicorn.run("gemini_api:app", host=args.host, port=args.port, reload=args.reload, log_level="info")

if __name__ == "__main__":
    main()
