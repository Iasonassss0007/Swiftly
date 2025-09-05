import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { message, mode } = await request.json()

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Get current date for context
    const now = new Date()
    const currentDate = now.toISOString().split('T')[0] // YYYY-MM-DD
    const currentTime = now.toTimeString().split(' ')[0].substring(0, 5) // HH:MM
    const currentDayName = now.toLocaleDateString('en-US', { weekday: 'long' })
    
    // Enhanced prompt for Gemini to extract all task information including precise time parsing
    const prompt = `You are Swiftly's Task Creation AI. Today is ${currentDayName}, ${currentDate} at ${currentTime}.

Analyze this user message to extract task creation information:

"${message}"

Extract all available task details and respond with JSON in this exact format:
{
  "hasTaskIntent": true/false,
  "taskName": "exact name they specified" or null,
  "description": "any additional context or details" or null,
  "dueDate": "YYYY-MM-DD HH:MM" or "YYYY-MM-DD" or null,
  "priority": "low" | "medium" | "high" or null,
  "tags": ["tag1", "tag2"] or [],
  "assignees": ["person1", "person2"] or [],
  "needsClarity": true/false,
  "clarificationMessage": "what specific information is missing" or null
}

CRITICAL INSTRUCTIONS FOR DATE AND TIME PARSING:

1. ALWAYS calculate dates based on TODAY'S date (${currentDate}):
   - "tomorrow" = ${currentDate} + 1 day
   - "next week" = ${currentDate} + 7 days
   - "Monday", "Tuesday", etc. = next occurrence of that weekday from today
   - "in 3 days" = ${currentDate} + 3 days
   - "end of month" = last day of current month
   - "next month" = same date next month

2. PARSE TIME EXPRESSIONS NATURALLY:
   - "6pm" or "6 pm" = 18:00
   - "3:30pm" or "3:30 pm" = 15:30
   - "9am" or "9 am" = 09:00
   - "noon" = 12:00
   - "midnight" = 00:00
   - "morning" = 09:00
   - "afternoon" = 14:00
   - "evening" = 18:00

3. COMBINE DATE AND TIME:
   - "tomorrow 6pm" = tomorrow's date at 18:00
   - "Monday at 3:30pm" = next Monday at 15:30
   - "next week 9am" = 7 days from today at 09:00

4. TASK NAME EXTRACTION:
   - Extract the EXACT task name as specified
   - Remove action words like "remind me to", "create task for", "schedule"
   - Examples:
     * "remind me to call mom tomorrow 6pm" → taskName: "call mom"
     * "schedule meeting with team next Monday 2pm" → taskName: "meeting with team"

5. PRIORITY DETECTION:
   - HIGH: urgent, asap, critical, high priority, immediately, emergency, important
   - LOW: low priority, when you can, whenever, no rush, optional
   - MEDIUM: default if no priority indicators

6. SMART TAG INFERENCE:
   - meeting, call, discussion → "meeting"
   - review, feedback, check → "review"
   - personal, myself → "personal"
   - work, office, business → "work"
   - urgent, asap, critical → "urgent"

7. ASSIGNEE DETECTION:
   - Identify people mentioned by name
   - Look for "with [person]", "assign to [person]", "@[person]"

EXAMPLES:
"remind me to call mom tomorrow 6pm" →
{
  "hasTaskIntent": true,
  "taskName": "call mom",
  "dueDate": "2024-01-16 18:00",
  "priority": "medium",
  "tags": ["personal"]
}

"urgent meeting with Sarah next Monday at 2:30pm" →
{
  "hasTaskIntent": true,
  "taskName": "meeting with Sarah",
  "dueDate": "2024-01-22 14:30",
  "priority": "high",
  "tags": ["meeting", "urgent"],
  "assignees": ["Sarah"]
}

Only return the JSON, nothing else.`

    // Call Gemini API (using existing Python service)
    const geminiResponse = await fetch('http://localhost:8000/ask', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: prompt,
        session_id: `intent_${Date.now()}`
      })
    })

    if (!geminiResponse.ok) {
      throw new Error(`Gemini API error: ${geminiResponse.status}`)
    }

    const result = await geminiResponse.json()
    console.log('🤖 [GEMINI API] Raw response:', result.response)

    // Parse Gemini's JSON response
    const responseText = result.response || ''
    console.log('🤖 [GEMINI API] Raw response:', responseText)
    
    let parsedResult
    try {
      // Try to parse as JSON first
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const jsonResponse = JSON.parse(jsonMatch[0])
        parsedResult = {
          hasTaskIntent: jsonResponse.hasTaskIntent || false,
          taskName: jsonResponse.taskName || null,
          description: jsonResponse.description || null,
          dueDate: jsonResponse.dueDate || null,
          priority: jsonResponse.priority || null,
          tags: jsonResponse.tags || [],
          assignees: jsonResponse.assignees || [],
          needsClarity: jsonResponse.needsClarity || false,
          clarificationMessage: jsonResponse.clarificationMessage,
          rawResponse: responseText
        }
      } else {
        // Fallback if no JSON found
        parsedResult = {
          hasTaskIntent: false,
          taskName: null,
          description: null,
          dueDate: null,
          priority: null,
          tags: [],
          assignees: [],
          needsClarity: false,
          rawResponse: responseText
        }
      }
    } catch (parseError) {
      console.error('❌ [GEMINI API] JSON parse error:', parseError)
      parsedResult = {
        hasTaskIntent: false,
        taskName: null,
        description: null,
        dueDate: null,
        priority: null,
        tags: [],
        assignees: [],
        needsClarity: false,
        rawResponse: responseText
      }
    }

    console.log('✅ [GEMINI API] Parsed result:', parsedResult)

    return NextResponse.json(parsedResult)

  } catch (error) {
    console.error('❌ [GEMINI API] Error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to analyze task intent',
        hasTaskIntent: false,
        taskName: null,
        description: null,
        dueDate: null,
        priority: null,
        tags: [],
        assignees: [],
        needsClarity: false
      },
      { status: 500 }
    )
  }
}