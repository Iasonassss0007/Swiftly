"""
RAG (Retrieval-Augmented Generation) service for enhanced AI responses.

This service provides knowledge base search and context augmentation
for more informed and accurate AI responses.
"""

import os
import json
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
from pathlib import Path

from ..utils.logging_config import get_logger


class Document:
    """Represents a document in the knowledge base."""
    
    def __init__(self, content: str, metadata: Optional[Dict[str, Any]] = None):
        self.content = content
        self.metadata = metadata or {}
        self.created_at = datetime.now()
        self.id = self._generate_id()
    
    def _generate_id(self) -> str:
        """Generate a unique ID for the document."""
        import hashlib
        content_hash = hashlib.md5(self.content.encode()).hexdigest()[:8]
        timestamp = str(int(self.created_at.timestamp()))
        return f"doc_{content_hash}_{timestamp}"
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert document to dictionary."""
        return {
            "id": self.id,
            "content": self.content,
            "metadata": self.metadata,
            "created_at": self.created_at.isoformat()
        }


class SimpleRAGService:
    """
    Simple RAG service implementation using basic text matching.
    
    In a production environment, this would be enhanced with:
    - Vector embeddings (using sentence-transformers or OpenAI embeddings)
    - Vector database (Pinecone, Weaviate, ChromaDB)
    - Advanced semantic search
    - Document chunking strategies
    - Reranking algorithms
    """
    
    def __init__(self, knowledge_base_path: Optional[str] = None):
        """
        Initialize the RAG service.
        
        Args:
            knowledge_base_path: Optional path to load knowledge base from
        """
        self.logger = get_logger("rag_service")
        self.documents: List[Document] = []
        self.knowledge_base_path = knowledge_base_path
        
        # Load existing knowledge base if path provided
        if self.knowledge_base_path and os.path.exists(self.knowledge_base_path):
            self._load_knowledge_base()
        else:
            self._initialize_default_knowledge()
    
    def _initialize_default_knowledge(self) -> None:
        """Initialize with default Swiftly-related knowledge."""
        default_docs = [
            {
                "content": "Swiftly is an AI-powered admin life concierge application designed to simplify scheduling, task management, reminders, and productivity optimization through intelligent automation.",
                "metadata": {"type": "product_overview", "category": "general"}
            },
            {
                "content": "Swiftly features include: AI-powered task creation from natural language, multiple task views (Kanban, Calendar, List, Gantt), smart scheduling optimization, team collaboration, and integrations with third-party services.",
                "metadata": {"type": "features", "category": "functionality"}
            },
            {
                "content": "The Swiftly AI assistant can help with task management, scheduling, productivity insights, and answering questions about your workflow and productivity patterns.",
                "metadata": {"type": "ai_capabilities", "category": "assistant"}
            },
            {
                "content": "Task priorities in Swiftly are categorized as: Low (nice to have, flexible deadlines), Medium (important but not urgent), High (urgent and important, immediate attention required).",
                "metadata": {"type": "task_priorities", "category": "tasks"}
            },
            {
                "content": "Swiftly supports team collaboration through shared task boards, real-time updates, task assignment, and team calendar views. Team members can collaborate on projects and track progress together.",
                "metadata": {"type": "collaboration", "category": "teams"}
            },
            {
                "content": "The calendar view in Swiftly allows you to see tasks and events in month, week, and day views. You can drag and drop to reschedule tasks, and the calendar integrates with your existing calendar systems.",
                "metadata": {"type": "calendar", "category": "scheduling"}
            }
        ]
        
        for doc_data in default_docs:
            doc = Document(doc_data["content"], doc_data["metadata"])
            self.documents.append(doc)
        
        self.logger.info(f"Initialized RAG service with {len(self.documents)} default documents")
    
    def _load_knowledge_base(self) -> None:
        """Load knowledge base from file."""
        try:
            with open(self.knowledge_base_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            for doc_data in data.get("documents", []):
                doc = Document(doc_data["content"], doc_data.get("metadata", {}))
                self.documents.append(doc)
            
            self.logger.info(f"Loaded {len(self.documents)} documents from knowledge base")
            
        except Exception as e:
            self.logger.error(f"Failed to load knowledge base: {e}")
            self._initialize_default_knowledge()
    
    def save_knowledge_base(self, path: Optional[str] = None) -> bool:
        """Save knowledge base to file."""
        save_path = path or self.knowledge_base_path
        if not save_path:
            self.logger.error("No save path provided for knowledge base")
            return False
        
        try:
            data = {
                "documents": [doc.to_dict() for doc in self.documents],
                "created_at": datetime.now().isoformat(),
                "version": "1.0"
            }
            
            with open(save_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            
            self.logger.info(f"Saved knowledge base with {len(self.documents)} documents")
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to save knowledge base: {e}")
            return False
    
    def add_document(self, content: str, metadata: Optional[Dict[str, Any]] = None) -> str:
        """
        Add a document to the knowledge base.
        
        Args:
            content: Document content
            metadata: Optional metadata
            
        Returns:
            Document ID
        """
        doc = Document(content, metadata)
        self.documents.append(doc)
        self.logger.debug(f"Added document {doc.id} to knowledge base")
        return doc.id
    
    def search(self, query: str, limit: int = 5, min_score: float = 0.1) -> List[Tuple[Document, float]]:
        """
        Search for relevant documents using simple text matching.
        
        Args:
            query: Search query
            limit: Maximum number of results
            min_score: Minimum relevance score
            
        Returns:
            List of (document, score) tuples
        """
        if not query.strip():
            return []
        
        query_lower = query.lower()
        query_words = set(query_lower.split())
        
        results = []
        
        for doc in self.documents:
            content_lower = doc.content.lower()
            content_words = set(content_lower.split())
            
            # Calculate simple word overlap score
            common_words = query_words.intersection(content_words)
            score = len(common_words) / len(query_words) if query_words else 0
            
            # Boost score for exact phrase matches
            if query_lower in content_lower:
                score += 0.3
            
            # Boost score based on metadata relevance
            if doc.metadata:
                metadata_text = " ".join(str(v) for v in doc.metadata.values()).lower()
                metadata_words = set(metadata_text.split())
                metadata_common = query_words.intersection(metadata_words)
                score += len(metadata_common) * 0.1
            
            if score >= min_score:
                results.append((doc, score))
        
        # Sort by score descending and limit results
        results.sort(key=lambda x: x[1], reverse=True)
        return results[:limit]
    
    def get_context_for_query(self, query: str, max_context_length: int = 1000) -> str:
        """
        Get relevant context for a query.
        
        Args:
            query: User query
            max_context_length: Maximum length of context to return
            
        Returns:
            Formatted context string
        """
        relevant_docs = self.search(query, limit=3)
        
        if not relevant_docs:
            return ""
        
        context_parts = []
        current_length = 0
        
        for doc, score in relevant_docs:
            doc_context = f"• {doc.content}"
            
            if current_length + len(doc_context) > max_context_length:
                break
            
            context_parts.append(doc_context)
            current_length += len(doc_context)
        
        if context_parts:
            context = "RELEVANT CONTEXT:\n" + "\n".join(context_parts) + "\n\n"
            self.logger.debug(f"Retrieved {len(context_parts)} relevant documents for query")
            return context
        
        return ""
    
    def enhance_prompt(self, user_query: str, base_prompt: str) -> str:
        """
        Enhance a base prompt with relevant context from the knowledge base.
        
        Args:
            user_query: User's query
            base_prompt: Base system prompt
            
        Returns:
            Enhanced prompt with relevant context
        """
        context = self.get_context_for_query(user_query)
        
        if context:
            enhanced_prompt = f"{base_prompt}\n\n{context}Use this context to provide more accurate and informed responses when relevant."
            return enhanced_prompt
        
        return base_prompt
    
    def get_stats(self) -> Dict[str, Any]:
        """Get statistics about the knowledge base."""
        categories = {}
        total_content_length = 0
        
        for doc in self.documents:
            total_content_length += len(doc.content)
            
            category = doc.metadata.get("category", "unknown")
            categories[category] = categories.get(category, 0) + 1
        
        return {
            "total_documents": len(self.documents),
            "total_content_length": total_content_length,
            "average_document_length": total_content_length / len(self.documents) if self.documents else 0,
            "categories": categories
        }
