"""
Conversation management service for handling chat history and sessions.
"""

import time
from typing import Dict, List, Optional
from datetime import datetime

from ..models.schemas import ConversationMessage
from ..utils.logging_config import get_logger


class ConversationService:
    """Service for managing conversation history and sessions."""
    
    def __init__(self):
        """Initialize the conversation service."""
        self.logger = get_logger("conversation_service")
        self.conversations: Dict[str, List[ConversationMessage]] = {}
        self.session_metadata: Dict[str, Dict] = {}
    
    def create_session_id(self) -> str:
        """Create a new session ID."""
        return str(int(time.time() * 1000))  # Millisecond timestamp
    
    def add_message(
        self,
        session_id: str,
        role: str,
        content: str,
        timestamp: Optional[datetime] = None
    ) -> None:
        """
        Add a message to the conversation history.
        
        Args:
            session_id: Session identifier
            role: Message role (user or assistant)
            content: Message content
            timestamp: Optional message timestamp
        """
        if session_id not in self.conversations:
            self.conversations[session_id] = []
            self.session_metadata[session_id] = {
                "created_at": datetime.now(),
                "last_activity": datetime.now(),
                "message_count": 0
            }
        
        message = ConversationMessage(
            role=role,
            content=content,
            timestamp=timestamp or datetime.now()
        )
        
        self.conversations[session_id].append(message)
        self.session_metadata[session_id]["last_activity"] = datetime.now()
        self.session_metadata[session_id]["message_count"] += 1
        
        self.logger.debug(f"Added {role} message to session {session_id}")
    
    def get_conversation_history(
        self,
        session_id: str,
        limit: Optional[int] = None
    ) -> List[ConversationMessage]:
        """
        Get conversation history for a session.
        
        Args:
            session_id: Session identifier
            limit: Optional limit on number of messages to return
            
        Returns:
            List of conversation messages
        """
        if session_id not in self.conversations:
            return []
        
        messages = self.conversations[session_id]
        
        if limit:
            return messages[-limit:]
        
        return messages
    
    def get_gemini_history(self, session_id: str) -> List[Dict]:
        """
        Get conversation history in Gemini-compatible format.
        
        Args:
            session_id: Session identifier
            
        Returns:
            List of messages in Gemini format
        """
        messages = self.get_conversation_history(session_id)
        
        gemini_history = []
        for message in messages:
            gemini_history.append({
                "role": message.role,
                "parts": [{"text": message.content}]
            })
        
        return gemini_history
    
    def clear_session(self, session_id: str) -> bool:
        """
        Clear conversation history for a session.
        
        Args:
            session_id: Session identifier
            
        Returns:
            True if session was cleared, False if session didn't exist
        """
        if session_id in self.conversations:
            del self.conversations[session_id]
            del self.session_metadata[session_id]
            self.logger.info(f"Cleared session {session_id}")
            return True
        
        return False
    
    def get_session_info(self, session_id: str) -> Optional[Dict]:
        """
        Get metadata information about a session.
        
        Args:
            session_id: Session identifier
            
        Returns:
            Session metadata or None if session doesn't exist
        """
        return self.session_metadata.get(session_id)
    
    def cleanup_old_sessions(self, max_age_hours: int = 24) -> int:
        """
        Clean up old conversation sessions.
        
        Args:
            max_age_hours: Maximum age in hours before cleanup
            
        Returns:
            Number of sessions cleaned up
        """
        current_time = datetime.now()
        sessions_to_remove = []
        
        for session_id, metadata in self.session_metadata.items():
            age_hours = (current_time - metadata["last_activity"]).total_seconds() / 3600
            if age_hours > max_age_hours:
                sessions_to_remove.append(session_id)
        
        for session_id in sessions_to_remove:
            self.clear_session(session_id)
        
        if sessions_to_remove:
            self.logger.info(f"Cleaned up {len(sessions_to_remove)} old sessions")
        
        return len(sessions_to_remove)
