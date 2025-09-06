"""
Configuration settings for the Swiftly AI API.
"""

import os
from pathlib import Path
from functools import lru_cache
from typing import List, Optional
from dataclasses import dataclass


class Settings:
    """Application settings with environment variable support."""
    
    def __init__(self):
        """Initialize settings from environment variables."""
        self.load_env_files()
        
        # API Configuration
        self.app_name: str = "Swiftly AI API"
        self.app_version: str = "2.0.0"
        self.debug: bool = os.getenv("DEBUG", "false").lower() == "true"
        
        # Server Configuration
        self.host: str = os.getenv("HOST", "127.0.0.1")
        self.port: int = int(os.getenv("PORT", "8000"))
        
        # CORS Configuration
        self.allowed_origins: List[str] = [
            "http://localhost:3000", 
            "http://127.0.0.1:3000", 
            "http://localhost:3001", 
            "http://127.0.0.1:3001"
        ]
        
        # Google Gemini AI Configuration
        self.google_gemini_api_key: Optional[str] = os.getenv("GOOGLE_GEMINI_API_KEY")
        self.gemini_model_name: str = os.getenv("GEMINI_MODEL_NAME", "gemini-1.5-flash")
        
        # AI Generation Configuration
        self.default_temperature: float = float(os.getenv("AI_TEMPERATURE", "0.8"))
        self.default_top_p: float = float(os.getenv("AI_TOP_P", "0.9"))
        self.default_top_k: int = int(os.getenv("AI_TOP_K", "40"))
        self.default_max_tokens: int = int(os.getenv("AI_MAX_TOKENS", "1000"))
        
        # Task Intent Analysis Configuration
        self.task_intent_temperature: float = float(os.getenv("TASK_INTENT_TEMPERATURE", "0.3"))
        self.task_intent_max_tokens: int = int(os.getenv("TASK_INTENT_MAX_TOKENS", "200"))
        
        # Logging Configuration
        self.log_level: str = os.getenv("LOG_LEVEL", "INFO")
        self.log_format: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
        
    def load_env_files(self):
        """Load environment variables from .env files."""
        try:
            from dotenv import load_dotenv
            project_root = Path(__file__).resolve().parent.parent.parent.parent
            load_dotenv(project_root / '.env.local')
            load_dotenv(Path(__file__).resolve().parent.parent.parent / '.env')
        except ImportError:
            pass


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
