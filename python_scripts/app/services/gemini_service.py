"""
Google Gemini AI service for generating responses and analyzing task intent.
"""

import time
from typing import Optional, Dict, Any
from fastapi import HTTPException

try:
    import google.generativeai as genai
except ImportError:
    raise ImportError("Google Generative AI SDK not found. Install with: pip install google-generativeai")

from ..models.schemas import UserContext, TaskIntentResponse
from ..config.settings import Settings
from ..utils.logging_config import get_logger
from ..utils.context_builder import build_context_prompt, build_task_intent_prompt
from .rag_service import SimpleRAGService


class GeminiService:
    """Service for interacting with Google Gemini AI."""
    
    def __init__(self, settings: Settings, rag_service: Optional[SimpleRAGService] = None):
        """
        Initialize the Gemini service.
        
        Args:
            settings: Application settings
            rag_service: Optional RAG service for enhanced responses
        """
        self.settings = settings
        self.logger = get_logger("gemini_service")
        self.model = None
        self.rag_service = rag_service
        self._initialize_model()
    
    def _initialize_model(self) -> None:
        """Initialize the Gemini AI model."""
        try:
            if not self.settings.google_gemini_api_key:
                raise ValueError("GOOGLE_GEMINI_API_KEY not set")
            
            genai.configure(api_key=self.settings.google_gemini_api_key)
            self.model = genai.GenerativeModel(self.settings.gemini_model_name)
            self.logger.info(f"✅ Gemini AI initialized (model: {self.settings.gemini_model_name})")
            
        except Exception as e:
            self.logger.error(f"Failed to initialize Google Gemini: {e}")
            raise
    
    def is_healthy(self) -> bool:
        """Check if the service is healthy."""
        return self.model is not None
    
    async def generate_response(
        self,
        content: str,
        user_context: Optional[UserContext] = None,
        conversation_history: Optional[list] = None
    ) -> str:
        """
        Generate an AI response using Google Gemini.
        
        Args:
            content: User's message
            user_context: Optional user context
            conversation_history: Optional conversation history
            
        Returns:
            Generated AI response
            
        Raises:
            HTTPException: If the model is not initialized or generation fails
        """
        if not self.model:
            raise HTTPException(status_code=503, detail="AI model not initialized")
        
        try:
            system_prompt = build_context_prompt(user_context)
            
            # Start chat with history if provided
            if conversation_history:
                chat = self.model.start_chat(history=conversation_history)
            else:
                chat = self.model.start_chat()
            
            full_prompt = f"{system_prompt}\n\nUser: {content}\nAssistant:"
            
            response = await chat.send_message_async(
                full_prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=self.settings.default_temperature,
                    top_p=self.settings.default_top_p,
                    top_k=self.settings.default_top_k,
                    max_output_tokens=self.settings.default_max_tokens,
                    candidate_count=1
                )
            )
            
            return response.text.strip()
            
        except Exception as e:
            self.logger.error(f"Error generating AI response: {e}")
            return "I apologize, but I'm having trouble processing your request right now."
    
    async def generate_rag_enhanced_response(
        self,
        content: str,
        user_context: Optional[UserContext] = None,
        conversation_history: Optional[list] = None
    ) -> str:
        """
        Generate an AI response enhanced with RAG (Retrieval-Augmented Generation).
        
        Args:
            content: User's message
            user_context: Optional user context
            conversation_history: Optional conversation history
            
        Returns:
            RAG-enhanced AI response
            
        Raises:
            HTTPException: If the model is not initialized or generation fails
        """
        if not self.model:
            raise HTTPException(status_code=503, detail="AI model not initialized")
        
        try:
            # Build base context prompt
            base_prompt = build_context_prompt(user_context)
            
            # Enhance prompt with RAG if available
            if self.rag_service:
                enhanced_prompt = self.rag_service.enhance_prompt(content, base_prompt)
                self.logger.debug("Enhanced prompt with RAG context")
            else:
                enhanced_prompt = base_prompt
                self.logger.debug("RAG service not available, using base prompt")
            
            # Start chat with history if provided
            if conversation_history:
                chat = self.model.start_chat(history=conversation_history)
            else:
                chat = self.model.start_chat()
            
            full_prompt = f"{enhanced_prompt}\n\nUser: {content}\nAssistant:"
            
            response = await chat.send_message_async(
                full_prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=self.settings.default_temperature,
                    top_p=self.settings.default_top_p,
                    top_k=self.settings.default_top_k,
                    max_output_tokens=self.settings.default_max_tokens,
                    candidate_count=1
                )
            )
            
            return response.text.strip()
            
        except Exception as e:
            self.logger.error(f"Error generating RAG-enhanced AI response: {e}")
            return "I apologize, but I'm having trouble processing your request right now."
    
    async def analyze_task_intent(self, content: str) -> TaskIntentResponse:
        """
        Analyze user message for task creation intent.
        
        Args:
            content: User's message to analyze
            
        Returns:
            Task intent analysis response
            
        Raises:
            HTTPException: If the model is not initialized or analysis fails
        """
        if not self.model:
            raise HTTPException(status_code=503, detail="AI model not initialized")
        
        start_time = time.time()
        
        try:
            task_analysis_prompt = build_task_intent_prompt(content)
            
            response = await self.model.generate_content_async(
                task_analysis_prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=self.settings.task_intent_temperature,
                    top_p=0.8,
                    top_k=20,
                    max_output_tokens=self.settings.task_intent_max_tokens,
                    candidate_count=1
                )
            )
            
            ai_response = response.text.strip()
            processing_time = time.time() - start_time
            
            self.logger.info(f"Task intent analyzed in {processing_time:.2f}s")
            
            # Try to parse the JSON response
            try:
                import json
                intent_data = json.loads(ai_response)
                
                return TaskIntentResponse(
                    has_task_intent=intent_data.get("hasTaskIntent", False),
                    task_name=intent_data.get("taskName"),
                    due_date=intent_data.get("dueDate"),
                    priority=intent_data.get("priority"),
                    needs_clarity=intent_data.get("needsClarity", False),
                    processing_time=processing_time
                )
                
            except (json.JSONDecodeError, KeyError) as e:
                self.logger.warning(f"Failed to parse task intent response: {e}")
                # Return no intent if parsing fails
                return TaskIntentResponse(
                    has_task_intent=False,
                    task_name=None,
                    due_date=None,
                    priority=None,
                    needs_clarity=False,
                    processing_time=processing_time
                )
                
        except Exception as e:
            self.logger.error(f"Error in task intent analysis: {e}")
            processing_time = time.time() - start_time
            
            # Return no intent if analysis fails
            return TaskIntentResponse(
                has_task_intent=False,
                task_name=None,
                due_date=None,
                priority=None,
                needs_clarity=False,
                processing_time=processing_time
            )
