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
    
    // Using dedicated task intent endpoint - no need for complex prompt here

    // Call dedicated task intent analysis endpoint
    console.log('🔍 [TASK INTENT] Calling dedicated task intent API...')
    
    let geminiResponse
    try {
      geminiResponse = await fetch('http://127.0.0.1:8000/analyze-task-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: message // Send original message, not the full prompt
        })
      })

      console.log('🔍 [TASK INTENT] Task intent API response status:', geminiResponse.status)

      if (!geminiResponse.ok) {
        const errorText = await geminiResponse.text()
        console.error('❌ [TASK INTENT] Task intent API error:', geminiResponse.status, errorText)
        throw new Error(`Task intent API error: ${geminiResponse.status} - ${errorText}`)
      }
    } catch (fetchError) {
      console.error('❌ [TASK INTENT] Fetch error:', fetchError)
      throw new Error(`Failed to connect to task intent API: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`)
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