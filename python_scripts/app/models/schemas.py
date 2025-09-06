"""
Pydantic models for request/response validation and data structures.
"""

from typing import Dict, Any, Optional, List
from pydantic import BaseModel, Field
from datetime import datetime


class UserContext(BaseModel):
    """User context information for personalized AI responses."""
    user_id: Optional[str] = None
    tasks: List[str] = Field(default_factory=list)
    reminders: List[str] = Field(default_factory=list)
    preferences: Dict[str, Any] = Field(default_factory=dict)
    current_time: Optional[datetime] = None


class AskRequest(BaseModel):
    """Request model for the /ask endpoint."""
    content: str = Field(..., min_length=1, description="User's question or message")
    user_context: Optional[UserContext] = None
    session_id: Optional[str] = None


class AskResponse(BaseModel):
    """Response model for the /ask endpoint."""
    response: str
    processing_time: float
    session_id: str
    timestamp: Optional[datetime] = None


class TaskIntentRequest(BaseModel):
    """Request model for task intent analysis."""
    content: str = Field(..., min_length=1, description="User message to analyze")
    user_context: Optional[UserContext] = None


class TaskIntentResponse(BaseModel):
    """Response model for task intent analysis."""
    has_task_intent: bool
    task_name: Optional[str] = None
    due_date: Optional[str] = None
    priority: Optional[str] = Field(None, pattern="^(low|medium|high)$")
    needs_clarity: bool = False
    processing_time: float


class ConversationMessage(BaseModel):
    """Individual message in a conversation history."""
    role: str = Field(..., pattern="^(user|assistant)$")
    content: str
    timestamp: datetime = Field(default_factory=datetime.now)


class HealthResponse(BaseModel):
    """Response model for the health check endpoint."""
    status: str = Field(..., pattern="^(healthy|degraded|error)$")
    api_connected: bool
    model_name: str
    timestamp: datetime = Field(default_factory=datetime.now)
    version: str = "2.0.0"
