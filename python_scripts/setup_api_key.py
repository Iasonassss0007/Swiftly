#!/usr/bin/env python3
"""
Quick Setup Script for Google Gemini API Key
Helps configure the GOOGLE_GEMINI_API_KEY environment variable.
"""

import os
from pathlib import Path

def main():
    print("🚀 Swiftly Gemini API Key Setup")
    print("=" * 40)
    
    # Check if API key is already set
    current_key = os.getenv("GOOGLE_GEMINI_API_KEY")
    if current_key:
        print(f"✅ API key already set: {current_key[:10]}...{current_key[-5:]}")
        choice = input("Do you want to update it? (y/N): ").lower()
        if choice != 'y':
            print("Setup cancelled.")
            return
    
    print("\n📝 Step 1: Get your API key")
    print("   1. Visit: https://makersuite.google.com/app/apikey")
    print("   2. Sign in with your Google account")
    print("   3. Click 'Create API Key'")
    print("   4. Copy the generated API key")
    
    print("\n🔑 Step 2: Enter your API key")
    api_key = input("Paste your Google Gemini API key here: ").strip()
    
    if not api_key:
        print("❌ No API key provided. Setup cancelled.")
        return
    
    # Basic validation
    if not api_key.startswith('AI') or len(api_key) < 30:
        print("⚠️  Warning: API key format looks unusual")
        print("   Expected format: AIzaSy... (around 39 characters)")
        choice = input("Continue anyway? (y/N): ").lower()
        if choice != 'y':
            print("Setup cancelled.")
            return
    
    # Write to .env.local file
    env_file = Path(__file__).parent.parent / '.env.local'
    
    try:
        # Read existing content if file exists
        existing_content = ""
        if env_file.exists():
            with open(env_file, 'r') as f:
                lines = f.readlines()
            
            # Filter out existing GOOGLE_GEMINI_API_KEY lines
            filtered_lines = []
            for line in lines:
                if not line.strip().startswith('GOOGLE_GEMINI_API_KEY'):
                    filtered_lines.append(line)
            existing_content = ''.join(filtered_lines)
        
        # Write updated content
        with open(env_file, 'w') as f:
            f.write(existing_content)
            if existing_content and not existing_content.endswith('\n'):
                f.write('\n')
            f.write(f"GOOGLE_GEMINI_API_KEY={api_key}\n")
            f.write("NEXT_PUBLIC_GEMINI_API_URL=http://127.0.0.1:8000\n")
        
        print(f"✅ API key saved to {env_file}")
        
        # Test the configuration
        print("\n🧪 Testing API key...")
        os.environ["GOOGLE_GEMINI_API_KEY"] = api_key
        
        try:
            import google.generativeai as genai  # type: ignore
            # Configure the API key using the proper method
            genai.configure(api_key=api_key)  # type: ignore
            
            # Test with a simple model instantiation and generation
            model = genai.GenerativeModel("gemini-1.5-flash")  # type: ignore
            
            response = model.generate_content("Say 'API key test successful'")
            if "successful" in response.text.lower():
                print("✅ API key test passed!")
            else:
                print("⚠️  API key works but got unexpected response")
                
        except ImportError:
            print("ℹ️  Cannot test API key - google-generativeai not installed")
            print("   Run: pip install -r requirements.txt")
        except Exception as e:
            print(f"❌ API key test failed: {e}")
            print("   Please verify your API key is correct")
            return
        
        print("\n🎉 Setup completed successfully!")
        print("🚀 You can now start the API server:")
        print("   cd python_scripts")
        print("   python gemini_api.py")
        print("   or")
        print("   start_gemini_api.bat")
        
    except Exception as e:
        print(f"❌ Failed to save API key: {e}")

if __name__ == "__main__":
    main()