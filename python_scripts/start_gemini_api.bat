@echo off
echo Starting Swiftly Gemini AI API Server...
echo.
echo Make sure you have set the GOOGLE_GEMINI_API_KEY environment variable!
echo.
cd /d "%~dp0"
python gemini_api.py --host 127.0.0.1 --port 8000
pause