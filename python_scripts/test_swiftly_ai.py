#!/usr/bin/env python3
"""
Test Swiftly AI Personal Admin Assistant
Verifies that Google Gemini is properly configured as Swiftly AI with productivity capabilities.
"""

import requests
import json
import time

API_BASE_URL = "http://127.0.0.1:8000"

def test_swiftly_ai_identity():
    """Test that the API identifies as Swiftly AI with admin assistant focus."""
    print("🤖 Testing Swiftly AI Identity...")
    
    try:
        response = requests.get(f"{API_BASE_URL}/")
        data = response.json()
        
        if "Swiftly AI" in data.get("message", ""):
            print("✅ API correctly identifies as Swiftly AI")
            print(f"✅ Powered by: {data.get('powered_by', 'Unknown')}")
            print(f"✅ Capabilities: {len(data.get('capabilities', []))} listed")
            return True
        else:
            print(f"❌ API doesn't identify as Swiftly AI: {data.get('message', '')}")
            return False
            
    except Exception as e:
        print(f"❌ Identity test failed: {e}")
        return False

def test_admin_assistance():
    """Test Swiftly AI's admin assistance capabilities."""
    print("\n📋 Testing Admin Assistance...")
    
    # Test with admin-focused context
    test_request = {
        "content": "I need help organizing my weekly schedule and managing my deadlines. Can you assist me?",
        "user_context": {
            "user_id": "test_admin_user",
            "tasks": [
                "Prepare quarterly report (due Friday)",
                "Schedule team meeting for next week",
                "Review budget proposals (due Wednesday)",
                "Client follow-up calls",
                "Update project timelines"
            ],
            "reminders": [
                "Board meeting Tuesday 2pm",
                "Deadline review Wednesday 4pm",
                "Client presentation Friday 10am"
            ],
            "preferences": {
                "work_hours": "9am-6pm",
                "peak_productivity": "morning",
                "meeting_preference": "afternoon",
                "admin_style": "proactive"
            }
        }
    }
    
    try:
        response = requests.post(f"{API_BASE_URL}/ask", json=test_request, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            ai_response = data.get("response", "")
            
            # Check for admin assistant keywords
            admin_indicators = [
                "schedule", "organize", "deadline", "meeting", "admin", 
                "productivity", "workflow", "calendar", "priority", "manage"
            ]
            
            admin_score = sum(1 for indicator in admin_indicators 
                            if indicator in ai_response.lower())
            
            if admin_score >= 3:
                print(f"✅ Response demonstrates admin assistant focus (score: {admin_score}/10)")
                print(f"✅ Response length: {len(ai_response)} characters")
                print(f"✅ Processing time: {data.get('processing_time', 0):.2f}s")
                
                # Check for proactive suggestions
                if "💡" in ai_response or "suggestion" in ai_response.lower():
                    print("✅ Includes proactive suggestions")
                
                return True
            else:
                print(f"❌ Response lacks admin assistant focus (score: {admin_score}/10)")
                print(f"Response preview: {ai_response[:200]}...")
                return False
        else:
            print(f"❌ Request failed: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Admin assistance test failed: {e}")
        return False

def test_productivity_features():
    """Test Swiftly AI's productivity features."""
    print("\n⚡ Testing Productivity Features...")
    
    productivity_request = {
        "content": "What automation suggestions do you have for my repetitive weekly tasks?",
        "user_context": {
            "user_id": "test_productivity_user",
            "tasks": [
                "Weekly status reports",
                "Daily email check",
                "Meeting notes compilation",
                "Invoice processing"
            ]
        }
    }
    
    try:
        response = requests.post(f"{API_BASE_URL}/ask", json=productivity_request, timeout=15)
        
        if response.status_code == 200:
            data = response.json()
            ai_response = data.get("response", "").lower()
            
            # Check for automation/productivity keywords
            productivity_keywords = ["automate", "template", "workflow", "efficiency", "system", "process"]
            productivity_score = sum(1 for keyword in productivity_keywords 
                                   if keyword in ai_response)
            
            if productivity_score >= 2:
                print("✅ Demonstrates productivity and automation focus")
                print(f"✅ Productivity indicators found: {productivity_score}/6")
                return True
            else:
                print(f"❌ Limited productivity focus (score: {productivity_score}/6)")
                return False
        else:
            print(f"❌ Productivity test failed: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Productivity test failed: {e}")
        return False

def main():
    """Run Swiftly AI admin assistant tests."""
    print("🧪 Swiftly AI Personal Admin Assistant Test Suite")
    print("=" * 55)
    
    tests = [
        ("Swiftly AI Identity", test_swiftly_ai_identity),
        ("Admin Assistance", test_admin_assistance),
        ("Productivity Features", test_productivity_features)
    ]
    
    results = []
    
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ {test_name} failed with exception: {e}")
            results.append((test_name, False))
    
    # Summary
    print("\n📊 Test Results Summary:")
    print("=" * 35)
    
    passed = 0
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {test_name}")
        if result:
            passed += 1
    
    print(f"\n🎯 Overall: {passed}/{len(results)} tests passed")
    
    if passed == len(results):
        print("🎉 Swiftly AI is working perfectly as a personal admin assistant!")
        print("🚀 Google Gemini is successfully configured as Swiftly AI!")
    else:
        print("⚠️  Some functionality needs attention. Check the failed tests above.")
    
    return passed == len(results)

if __name__ == "__main__":
    import sys
    success = main()
    sys.exit(0 if success else 1)