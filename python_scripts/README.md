# Swiftly Google Gemini AI Integration

Complete Google Gemini AI integration for your Swiftly dashboard. This integration provides AI-powered responses directly in your Next.js dashboard through a Python FastAPI backend that connects to Google's Gemini AI API.

## 🏗️ Project Structure

```
Swiftly/
├── python_scripts/
│   ├── gemini_api.py              # FastAPI server with Gemini integration
│   ├── requirements.txt           # Python dependencies
│   └── start_gemini_api.bat       # Startup script
├── components/
│   └── AskSwiftlyForm.tsx         # React component
└── nextjs_dashboard/              # Your Next.js app
    ├── app/
    ├── components/
    └── ...
```

## 🚀 Quick Start

### 1. Prerequisites

- **Python 3.8+** installed
- **Node.js 18+** for Next.js
- **Google Gemini API Key** (get from [Google AI Studio](https://makersuite.google.com/app/apikey))
- **4GB+ RAM** recommended

### 2. Quick Setup

```bash
# Navigate to python scripts directory
cd python_scripts

# Install dependencies
pip install -r requirements.txt

# Set your Google Gemini API key
set GOOGLE_GEMINI_API_KEY=your_api_key_here
# Or on Linux/macOS: export GOOGLE_GEMINI_API_KEY=your_api_key_here
```

## 🖥️ Running the Integration

### Start the AI API Server

**Windows:**
```cmd
cd python_scripts
start_gemini_api.bat
```

**Manual start:**
```bash
cd python_scripts
python gemini_api.py --host 127.0.0.1 --port 8000
```

### Start the Next.js Dashboard

```bash
# In the main Swiftly directory
npm run dev
```

The dashboard will be available at `http://localhost:3000`

## 🎯 Features

### AI-Powered Form Component

The `AskSwiftlyForm` component provides:

- **Real-time AI responses** from Google Gemini AI
- **Per-user context support** (tasks, reminders, preferences)
- **Session-based conversation history**
- **Loading states** with "Asking..." indicator
- **Error handling** for API connectivity issues
- **Responsive design** with perfect Tailwind styling
- **Accessibility** with ARIA labels and keyboard navigation
- **Animated responses** using Framer Motion

### FastAPI Backend

The Python backend offers:

- **Google Gemini AI integration** via official SDK
- **No local model downloads** required
- **Per-user context management**
- **CORS enabled** for Next.js integration
- **Health check endpoint** at `/health`
- **Auto-documentation** at `/docs`
- **Error handling** and logging
- **Session management** for conversation continuity

## 📡 API Endpoints

### POST /ask
Ask the AI a question and get a response.

**Request:**
```json
{
  "content": "Help me organize my tasks for today",
  "user_context": {
    "user_id": "user123",
    "tasks": ["Complete project proposal", "Team meeting at 2pm"],
    "reminders": ["Call client at 3pm"],
    "preferences": {"work_hours": "9am-6pm"}
  },
  "session_id": "optional_session_id"
}
```

**Response:**
```json
{
  "response": "Based on your current tasks and schedule, I recommend prioritizing your project proposal in the morning before your 2pm team meeting. Don't forget your client call at 3pm!",
  "processing_time": 0.85,
  "session_id": "abc123def456"
}
```

### GET /health
Check API server status.

**Response:**
```json
{
  "status": "healthy",
  "api_connected": true,
  "model_name": "gemini-1.5-flash"
}
```

### GET /docs
Interactive API documentation (Swagger UI)

## 💻 Usage Examples

### Basic Usage in Dashboard

1. Open your Swiftly dashboard at `http://localhost:3000`
2. Navigate to the home page
3. Use the "Ask Swiftly" form to ask questions
4. Get AI-powered responses instantly

### Example Questions

```
✅ "How should I prioritize my tasks for today?"
✅ "Create a schedule for my morning routine"
✅ "What's the best way to manage project deadlines?"
✅ "Help me organize my notes about the marketing campaign"
✅ "Remind me about important meetings this week"
```

### React Component Usage

```tsx
import AskSwiftlyForm from '@/components/AskSwiftlyForm'

export default function MyPage() {
  return (
    <div className="container mx-auto p-6">
      <h1>AI Assistant</h1>
      <AskSwiftlyForm className="mt-4" />
    </div>
  )
}
```

### Direct API Usage

```typescript
// Fetch API example
const response = await fetch('http://127.0.0.1:8000/ask', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ content: 'Your question here' })
})

const data = await response.json()
console.log(data.response)
```

```python
# Python requests example
import requests

response = requests.post('http://127.0.0.1:8000/ask', 
  json={'content': 'Your question here'})
print(response.json()['response'])
```

## ⚙️ Configuration

### Environment Variables

Add to your `.env.local`:

```env
# Google Gemini AI API Configuration
NEXT_PUBLIC_GEMINI_API_URL=http://127.0.0.1:8000
GOOGLE_GEMINI_API_KEY=your_gemini_api_key_here
```

### API Server Configuration

The FastAPI server can be configured with command line arguments:

```bash
python gemini_api.py --host 0.0.0.0 --port 8000 --reload
```

Options:
- `--host`: Host to bind to (default: 127.0.0.1)
- `--port`: Port to bind to (default: 8000)
- `--reload`: Enable auto-reload for development

## 🔧 Customization

### Modify AI Responses

Edit the `generate_response` function in `gemma3_api.py`:

```python
def generate_response(prompt: str, max_new_tokens: int = 150) -> str:
    # Customize the prompt format
    formatted_prompt = f"<start_of_turn>user\n{prompt}<end_of_turn>\n<start_of_turn>model\n"
    
    # Adjust generation parameters
    outputs = model.generate(
        **inputs,
        max_new_tokens=max_new_tokens,
        temperature=0.7,  # Adjust creativity (0.1-1.0)
        top_p=0.9,        # Adjust randomness (0.1-1.0)
        repetition_penalty=1.1  # Reduce repetition
    )
```

### Style the React Component

The `AskSwiftlyForm` uses Tailwind CSS classes that match your existing design:

```tsx
// Customize the styling
<input
  className="w-full px-6 py-4 pr-32 text-lg border border-[#ADB3BD]/30 rounded-xl..."
  // Add your custom classes
/>
```

## 🐛 Troubleshooting

### Common Issues

#### 1. "API Key Not Set" Error

**Problem:** Error message about `GOOGLE_GEMINI_API_KEY` environment variable not set

**Solutions:**
```bash
# Option 1: Use the setup script
python setup_api_key.py

# Option 2: Set manually
set GOOGLE_GEMINI_API_KEY=your_api_key_here

# Option 3: Add to .env.local file
echo GOOGLE_GEMINI_API_KEY=your_api_key_here >> .env.local
```

#### 2. "Failed to fetch" Error

**Problem:** React app can't connect to Google Gemini AI

**Solutions:**
- Ensure Python API server is running on port 8000
- Check if `NEXT_PUBLIC_SWIFTLY_API_URL` is set correctly
- Verify no firewall blocking local connections
- Try accessing `http://127.0.0.1:8000/health` in browser

#### 3. Slow Response Times

**Problem:** Google Gemini AI takes too long to respond

**Solutions:**
- Check internet connection (Google Gemini uses cloud API)
- Reduce max_output_tokens in `gemini_api.py` if needed
- Monitor API quota limits in Google AI Studio

#### 4. Import Errors

**Problem:** `ModuleNotFoundError` when starting Python server

**Solutions:**
```bash
# Reinstall dependencies
pip install --upgrade -r requirements.txt

# Or install specific packages
pip install google-generativeai fastapi uvicorn
```

#### 5. CORS Errors

**Problem:** Browser blocks API requests due to CORS

**Solutions:**
- Verify your Next.js app runs on `http://localhost:3000`
- Check CORS configuration in `gemini_api.py`
- Add your custom port to `allow_origins` if using different port

### Performance Optimization

#### For Low-Memory Systems (4-8GB RAM):

```python
# In gemma3_api.py, modify model loading:
model = AutoModelForCausalLM.from_pretrained(
    str(model_path),
    torch_dtype=torch.float16,  # Use half precision
    device_map="cpu",
    low_cpu_mem_usage=True,
    max_memory={"cpu": "4GB"}   # Limit memory usage
)
```

#### For Better Performance:

```python
# Optimize generation parameters:
outputs = model.generate(
    **inputs,
    max_new_tokens=50,      # Shorter responses
    do_sample=False,        # Disable sampling for speed
    num_beams=1,           # Single beam
    use_cache=True         # Enable caching
)
```

### Logging and Debugging

Enable detailed logging:

```python
# Add to gemma3_api.py
import logging
logging.basicConfig(level=logging.DEBUG)
```

Check API server logs:
```bash
python gemma3_api.py --reload
# Watch the console output for errors
```

Monitor system resources:
```bash
# Check memory usage
htop  # Linux/macOS
taskmgr  # Windows

# Check Python processes
ps aux | grep python  # Linux/macOS
```

## 📚 Additional Resources

- [Google Gemini AI Documentation](https://ai.google.dev/gemma)
- [Google AI Studio](https://makersuite.google.com/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Swiftly Project Repository](https://github.com/your-repo/swiftly)

## 🆘 Getting Help

1. **Check the logs** in your terminal where the Python server is running
2. **Verify model files** are complete and not corrupted
3. **Test the API directly** using `curl` or browser at `http://127.0.0.1:8000/docs`
4. **Check system resources** (RAM usage, available disk space)
5. **Try restarting** both the Python server and Next.js app

### Health Check

Quick test to verify everything is working:

```bash
# Test API server
curl http://127.0.0.1:8000/health

# Test AI endpoint
curl -X POST http://127.0.0.1:8000/ask \
  -H "Content-Type: application/json" \
  -d '{"content": "Hello, are you working?"}'
```

Expected responses indicate a healthy system.