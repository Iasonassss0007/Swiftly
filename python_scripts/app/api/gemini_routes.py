"""
API routes for Gemini AI functionality.
"""

import time
from typing import Dict, Any
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime

from ..models.schemas import (
    AskRequest, 
    AskResponse, 
    TaskIntentRequest, 
    TaskIntentResponse, 
    HealthResponse
)
from ..services.gemini_service import GeminiService
from ..services.conversation_service import ConversationService
from ..services.rag_service import SimpleRAGService
from ..config.settings import Settings, get_settings
from ..utils.logging_config import get_logger

# Create router
router = APIRouter()

# Logger
logger = get_logger("api.gemini_routes")

# Global service instances (will be initialized on startup)
gemini_service: GeminiService = None
conversation_service: ConversationService = None
rag_service: SimpleRAGService = None


def get_gemini_service() -> GeminiService:
    """Dependency to get Gemini service instance."""
    if gemini_service is None:
        raise HTTPException(status_code=503, detail="Gemini service not initialized")
    return gemini_service


def get_conversation_service() -> ConversationService:
    """Dependency to get conversation service instance."""
    if conversation_service is None:
        raise HTTPException(status_code=503, detail="Conversation service not initialized")
    return conversation_service


async def initialize_services(settings: Settings) -> None:
    """Initialize all services."""
    global gemini_service, conversation_service, rag_service
    
    logger.info("Initializing services...")
    
    # Initialize RAG service
    rag_service = SimpleRAGService()
    logger.info("✅ RAG service initialized")
    
    # Initialize services with RAG integration
    gemini_service = GeminiService(settings, rag_service)
    conversation_service = ConversationService()
    
    logger.info("✅ All services initialized successfully")


@router.get("/health", response_model=HealthResponse)
async def health_check(
    settings: Settings = Depends(get_settings),
    gemini: GeminiService = Depends(get_gemini_service)
):
    """Health check endpoint."""
    return HealthResponse(
        status="healthy" if gemini.is_healthy() else "degraded",
        api_connected=gemini.is_healthy(),
        model_name=settings.gemini_model_name,
        timestamp=datetime.now(),
        version=settings.app_version
    )


@router.post("/ask", response_model=AskResponse)
async def ask_gemini(
    request: AskRequest,
    gemini: GeminiService = Depends(get_gemini_service),
    conversation: ConversationService = Depends(get_conversation_service)
):
    """Ask the AI assistant for help with natural conversation."""
    if not request.content.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")
    
    start_time = time.time()
    session_id = request.session_id or conversation.create_session_id()
    
    try:
        # Add user message to conversation history
        conversation.add_message(session_id, "user", request.content)
        
        # Get conversation history for context
        history = conversation.get_gemini_history(session_id)
        
        # Generate AI response
        ai_response = await gemini.generate_response(
            request.content,
            request.user_context,
            history[:-1]  # Exclude the current message from history
        )
        
        # Add AI response to conversation history
        conversation.add_message(session_id, "assistant", ai_response)
        
        processing_time = time.time() - start_time
        logger.info(f"AI generated response in {processing_time:.2f}s for session {session_id}")
        
        return AskResponse(
            response=ai_response,
            processing_time=processing_time,
            session_id=session_id,
            timestamp=datetime.now()
        )
        
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Unexpected error in ask_gemini: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/ask-natural", response_model=AskResponse)
async def ask_natural(
    request: AskRequest,
    gemini: GeminiService = Depends(get_gemini_service),
    conversation: ConversationService = Depends(get_conversation_service)
):
    """
    Enhanced conversational endpoint with RAG capabilities.
    This endpoint provides natural conversation with context awareness.
    """
    if not request.content.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")
    
    start_time = time.time()
    session_id = request.session_id or conversation.create_session_id()
    
    try:
        # Add user message to conversation history
        conversation.add_message(session_id, "user", request.content)
        
        # Get conversation history for context
        history = conversation.get_gemini_history(session_id)
        
        # TODO: Implement RAG system here
        # For now, this is the same as /ask but can be enhanced with:
        # - Knowledge base search
        # - Document retrieval
        # - Context augmentation
        # - Specialized prompting for different types of questions
        
        # Generate AI response with RAG enhancement
        ai_response = await gemini.generate_rag_enhanced_response(
            request.content,
            request.user_context,
            history[:-1]  # Exclude the current message from history
        )
        
        # Add AI response to conversation history
        conversation.add_message(session_id, "assistant", ai_response)
        
        processing_time = time.time() - start_time
        logger.info(f"Natural AI response generated in {processing_time:.2f}s for session {session_id}")
        
        return AskResponse(
            response=ai_response,
            processing_time=processing_time,
            session_id=session_id,
            timestamp=datetime.now()
        )
        
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Unexpected error in ask_natural: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/analyze-task-intent", response_model=TaskIntentResponse)
async def analyze_task_intent(
    request: TaskIntentRequest,
    gemini: GeminiService = Depends(get_gemini_service)
):
    """Analyze user message for task creation intent without generating conversational response."""
    if not request.content.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")
    
    try:
        # Analyze task intent using Gemini
        intent_response = await gemini.analyze_task_intent(request.content)
        
        logger.info(f"Task intent analyzed: {intent_response.has_task_intent}")
        return intent_response
        
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Unexpected error in analyze_task_intent: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.delete("/conversation/{session_id}")
async def clear_conversation(
    session_id: str,
    conversation: ConversationService = Depends(get_conversation_service)
):
    """Clear conversation history for a specific session."""
    success = conversation.clear_session(session_id)
    
    if success:
        return {"message": f"Conversation history cleared for session {session_id}"}
    else:
        raise HTTPException(status_code=404, detail="Session not found")


@router.get("/conversation/{session_id}/info")
async def get_conversation_info(
    session_id: str,
    conversation: ConversationService = Depends(get_conversation_service)
):
    """Get information about a conversation session."""
    session_info = conversation.get_session_info(session_id)
    
    if session_info:
        return {
            "session_id": session_id,
            **session_info
        }
    else:
        raise HTTPException(status_code=404, detail="Session not found")


@router.get("/rag/stats")
async def get_rag_stats():
    """Get RAG knowledge base statistics."""
    global rag_service
    
    if rag_service is None:
        raise HTTPException(status_code=503, detail="RAG service not initialized")
    
    return {
        "rag_stats": rag_service.get_stats(),
        "status": "active"
    }


@router.post("/rag/search")
async def search_knowledge_base(
    query: str,
    limit: int = 5
):
    """Search the RAG knowledge base."""
    global rag_service
    
    if rag_service is None:
        raise HTTPException(status_code=503, detail="RAG service not initialized")
    
    if not query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")
    
    results = rag_service.search(query, limit=limit)
    
    return {
        "query": query,
        "results": [
            {
                "content": doc.content,
                "metadata": doc.metadata,
                "score": score,
                "id": doc.id
            }
            for doc, score in results
        ],
        "total_results": len(results)
    }
