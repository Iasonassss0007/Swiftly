#!/usr/bin/env python3
"""
Example Usage of Swiftly Google Gemini API
Demonstrates how to call the Gemini API with user context and session management.
"""

import requests
import json
import time

# API Configuration
API_BASE_URL = "http://127.0.0.1:8000"

def test_health():
    """Test the health endpoint."""
    print("🔍 Testing API health...")
    try:
        response = requests.get(f"{API_BASE_URL}/health")
        data = response.json()
        print(f"✅ API Status: {data['status']}")
        print(f"✅ API Connected: {data['api_connected']}")
        print(f"✅ Model: {data['model_name']}")
        return True
    except Exception as e:
        print(f"❌ Health check failed: {e}")
        return False

def ask_simple_question():
    """Ask a simple question without context."""
    print("\n💬 Asking simple question...")
    
    question = "Hello! Can you help me organize my day?"
    
    payload = {
        "content": question
    }
    
    try:
        response = requests.post(f"{API_BASE_URL}/ask", json=payload)
        data = response.json()
        
        print(f"Question: {question}")
        print(f"Response: {data['response']}")
        print(f"Processing time: {data['processing_time']:.2f}s")
        print(f"Session ID: {data['session_id']}")
        
        return data['session_id']
    except Exception as e:
        print(f"❌ Simple question failed: {e}")
        return None

def ask_with_context(session_id=None):
    """Ask a question with user context."""
    print("\n🎯 Asking question with user context...")
    
    question = "Based on my current tasks, what should I prioritize today?"
    
    user_context = {
        "user_id": "demo_user_123",
        "tasks": [
            "Complete project proposal by Friday",
            "Team meeting at 2 PM today",
            "Review budget reports",
            "Call client about new requirements"
        ],
        "reminders": [
            "Doctor appointment at 4 PM",
            "Pick up groceries after work"
        ],
        "preferences": {
            "work_hours": "9 AM - 6 PM",
            "priority_style": "urgent_first",
            "break_preference": "15_min_every_2_hours"
        }
    }
    
    payload = {
        "content": question,
        "user_context": user_context
    }
    
    if session_id:
        payload["session_id"] = session_id
    
    try:
        response = requests.post(f"{API_BASE_URL}/ask", json=payload)
        data = response.json()
        
        print(f"Question: {question}")
        print(f"Response: {data['response']}")
        print(f"Processing time: {data['processing_time']:.2f}s")
        print(f"Session ID: {data['session_id']}")
        
        return data['session_id']
    except Exception as e:
        print(f"❌ Context question failed: {e}")
        return None

def ask_followup_question(session_id):
    """Ask a follow-up question in the same session."""
    print("\n🔄 Asking follow-up question...")
    
    question = "What about my afternoon schedule?"
    
    payload = {
        "content": question,
        "session_id": session_id
    }
    
    try:
        response = requests.post(f"{API_BASE_URL}/ask", json=payload)
        data = response.json()
        
        print(f"Question: {question}")
        print(f"Response: {data['response']}")
        print(f"Processing time: {data['processing_time']:.2f}s")
        print(f"Session ID: {data['session_id']}")
        
    except Exception as e:
        print(f"❌ Follow-up question failed: {e}")

def main():
    """Main example function."""
    print("🚀 Swiftly Google Gemini API Example")
    print("=" * 50)
    
    # Test health first
    if not test_health():
        print("❌ API server is not running or not healthy")
        print("💡 Start the server with: python gemini_api.py")
        return
    
    # Simple question
    session_id = ask_simple_question()
    time.sleep(1)
    
    # Question with context
    session_id = ask_with_context(session_id)
    time.sleep(1)
    
    # Follow-up question
    if session_id:
        ask_followup_question(session_id)
    
    print("\n🎉 Example completed!")
    print("💡 Try integrating this into your Next.js dashboard using the AskSwiftlyForm component")

if __name__ == "__main__":
    main()