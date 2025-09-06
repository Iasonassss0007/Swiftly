"""
Context building utilities for AI prompts.
"""

from typing import Optional
from datetime import datetime
from ..models.schemas import UserContext


def build_context_prompt(user_context: Optional[UserContext] = None) -> str:
    """
    Build a natural language context prompt to guide the AI's personality with real-time context.
    
    Args:
        user_context: Optional user context information
        
    Returns:
        Formatted context prompt string
    """
    # Get current real-time information
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

    # Add user-specific context if available
    if user_context:
        if user_context.tasks:
            context_parts.append(f"\nUSER CONTEXT: The user is working on: {', '.join(user_context.tasks[:3])}.")
        
        if user_context.reminders:
            context_parts.append(f"They have reminders for: {', '.join(user_context.reminders[:2])}.")

    context_parts.append("\nRespond naturally and helpfully to whatever the user asks, focusing on providing value through information and conversation.")
    context_parts.append("\nIMPORTANT: Write in plain text only. Do not use markdown, asterisks (*), underscores (_), or any special formatting characters except when absolutely necessary.")
    
    return "\n".join(context_parts)


def build_task_intent_prompt(message: str) -> str:
    """
    Build a focused prompt for task intent analysis.
    
    Args:
        message: User message to analyze
        
    Returns:
        Task intent analysis prompt
    """
    return f"""You are a task intent analyzer. Analyze this message and return ONLY a JSON response:

Message: "{message}"

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
