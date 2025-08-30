#!/usr/bin/env python3
"""
Swiftly Google Gemini Setup and Test Script
Installs dependencies and tests the Gemini API integration.
"""

import subprocess
import sys
import os
from pathlib import Path

def install_dependencies():
    """Install required Python dependencies."""
    print("📦 Installing Python dependencies...")
    
    try:
        subprocess.check_call([
            sys.executable, "-m", "pip", "install", "-r", "requirements.txt"
        ])
        print("✅ Dependencies installed successfully!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install dependencies: {e}")
        return False

def check_api_key():
    """Check if Google Gemini API key is set."""
    api_key = os.getenv("GOOGLE_GEMINI_API_KEY")
    if not api_key:
        print("❌ GOOGLE_GEMINI_API_KEY environment variable not set")
        print("💡 Get your API key from: https://makersuite.google.com/app/apikey")
        print("💡 Set it with: set GOOGLE_GEMINI_API_KEY=your_api_key_here")
        return False
    
    print("✅ Google Gemini API key found")
    return True

def test_import():
    """Test if we can import the required libraries."""
    try:
        import google.generativeai as genai
        import fastapi
        import uvicorn
        print("✅ All required libraries imported successfully")
        return True
    except ImportError as e:
        print(f"❌ Import error: {e}")
        return False

def test_api_connection():
    """Test connection to Google Gemini API."""
    try:
        import google.generativeai as genai
        
        api_key = os.getenv("GOOGLE_GEMINI_API_KEY")
        if not api_key:
            return False
        
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-1.5-flash")
        
        # Test with a simple prompt
        response = model.generate_content("Hello, respond with 'Connection successful'")
        
        if "successful" in response.text.lower():
            print("✅ Google Gemini API connection test passed")
            return True
        else:
            print(f"⚠️ Unexpected response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ API connection test failed: {e}")
        return False

def main():
    """Main setup function."""
    print("🚀 Swiftly Google Gemini Setup")
    print("=" * 50)
    
    # Check if we're in the right directory
    if not Path("requirements.txt").exists():
        print("❌ requirements.txt not found. Please run this from python_scripts directory.")
        return False
    
    # Install dependencies
    if not install_dependencies():
        return False
    
    # Test imports
    if not test_import():
        return False
    
    # Check API key
    if not check_api_key():
        return False
    
    # Test API connection
    if not test_api_connection():
        return False
    
    print("\n🎉 Setup completed successfully!")
    print("🚀 You can now start the API server:")
    print("   python gemini_api.py")
    print("   or")
    print("   start_gemini_api.bat")
    
    return True

if __name__ == "__main__":
    success = main()
    if not success:
        sys.exit(1)