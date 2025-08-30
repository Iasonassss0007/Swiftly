/**
 * AI Context Provider
 * 
 * This module provides real-time context information to AI requests,
 * enabling the AI to generate more accurate and contextually aware responses,
 * especially for task creation with proper date handling.
 * 
 * Features:
 * - Current date and time injection
 * - User timezone detection and handling
 * - Structured context formatting for AI prompts
 * - Task-specific context enhancement
 */

/**
 * Real-time context interface for AI requests
 */
export interface AIRealTimeContext {
  currentDate: string
  currentTime: string
  timezone: string
  dayOfWeek: string
  weekNumber: number
  month: string
  year: number
  isWeekend: boolean
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night'
}

/**
 * Enhanced user context for AI requests
 */
export interface EnhancedUserContext {
  user_id: string
  realTime: AIRealTimeContext
  tasks?: string[]
  reminders?: string[]
  preferences?: Record<string, any>
  conversationContext?: string
}

/**
 * Get current real-time context information
 */
export function getCurrentContext(): AIRealTimeContext {
  const now = new Date()
  
  // Get user's timezone
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  
  // Format current date and time
  const currentDate = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: timezone
  })
  
  const currentTime = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: timezone
  })
  
  const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long', timeZone: timezone })
  const month = now.toLocaleDateString('en-US', { month: 'long', timeZone: timezone })
  const year = now.getFullYear()
  
  // Calculate week number
  const startOfYear = new Date(year, 0, 1)
  const daysSinceStart = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000))
  const weekNumber = Math.ceil((daysSinceStart + startOfYear.getDay() + 1) / 7)
  
  // Determine if weekend
  const dayIndex = now.getDay()
  const isWeekend = dayIndex === 0 || dayIndex === 6
  
  // Determine time of day
  const hour = now.getHours()
  let timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night'
  if (hour >= 5 && hour < 12) {
    timeOfDay = 'morning'
  } else if (hour >= 12 && hour < 17) {
    timeOfDay = 'afternoon'
  } else if (hour >= 17 && hour < 21) {
    timeOfDay = 'evening'
  } else {
    timeOfDay = 'night'
  }
  
  return {
    currentDate,
    currentTime,
    timezone,
    dayOfWeek,
    weekNumber,
    month,
    year,
    isWeekend,
    timeOfDay
  }
}

/**
 * Create enhanced context for AI requests with real-time information
 */
export function createEnhancedContext(
  userId: string,
  preferences?: Record<string, any>,
  tasks?: string[],
  reminders?: string[]
): EnhancedUserContext {
  const realTime = getCurrentContext()
  
  return {
    user_id: userId,
    realTime,
    tasks,
    reminders,
    preferences,
    conversationContext: generateConversationContext(realTime)
  }
}

/**
 * Generate conversation context string for AI prompting
 */
function generateConversationContext(realTime: AIRealTimeContext): string {
  const { currentDate, currentTime, dayOfWeek, timeOfDay, isWeekend } = realTime
  
  let context = `Current context: It's ${currentDate} at ${currentTime}.`
  
  if (isWeekend) {
    context += ` It's the weekend (${dayOfWeek}).`
  } else {
    context += ` It's a weekday (${dayOfWeek}).`
  }
  
  context += ` It's ${timeOfDay}.`
  
  return context
}

/**
 * Create comprehensive task management AI prompt with real-time context
 * Enhanced to support all CRUD operations, not just task creation
 */
export function createTaskPrompt(
  userMessage: string,
  enhancedContext: EnhancedUserContext
): string {
  const { realTime } = enhancedContext
  
  return `You are a powerful AI assistant for comprehensive task management. ${enhancedContext.conversationContext}

🎯 FULL TASK MANAGEMENT CAPABILITIES:
You have COMPLETE ACCESS to all task operations with NO RESTRICTIONS:
✅ CREATE tasks (any title, description, due date, priority)
✅ READ/VIEW tasks (show details, list all, search)
✅ UPDATE/EDIT tasks (change any field: title, description, status, priority, due date)
✅ DELETE tasks (remove any task)
✅ COMPLETE/UNCOMPLETE tasks (mark as done or todo)
✅ PRIORITIZE tasks (set high/medium/low priority)
✅ RESCHEDULE tasks (change due dates)
✅ BATCH OPERATIONS (multiple tasks at once)
✅ SEARCH & FILTER (find tasks by any criteria)

🕐 CURRENT DATE CONTEXT:
- Today is: ${realTime.currentDate}
- Current time: ${realTime.currentTime}
- Day of week: ${realTime.dayOfWeek}
- Time of day: ${realTime.timeOfDay}
- Timezone: ${realTime.timezone}

📅 DATE REFERENCE GUIDE:
- "today" = ${realTime.currentDate}
- "tomorrow" = ${getTomorrowDate(realTime)}
- "next week" = ${getNextWeekDate(realTime)}
- "this weekend" = ${getThisWeekendDate(realTime)}

💡 OPERATION EXAMPLES:

📝 CREATE TASKS:
User: "Create a task called job interview tomorrow"
You: "Got it! I created a task named 'Job interview' for tomorrow (${getTomorrowDate(realTime)})."

User: "Add urgent task: fix server issue"
You: "Done! I've added 'Fix server issue' with high priority to your tasks."

👀 VIEW/LIST TASKS:
User: "Show me all my tasks"
You: "Here are all your tasks: [lists tasks]"

User: "List high priority tasks"
You: "Here are your high priority tasks: [filtered list]"

🔍 SEARCH TASKS:
User: "Find tasks about meetings"
You: "I found these meeting-related tasks: [search results]"

✏️ UPDATE TASKS:
User: "Change the title of task #123 to 'Updated Title'"
You: "Updated! Task #123 is now titled 'Updated Title'."

User: "Set task #456 to high priority"
You: "Done! Task #456 is now high priority."

✅ COMPLETE TASKS:
User: "Mark task #789 as done"
You: "Perfect! Task #789 is now marked as completed."

🗑️ DELETE TASKS:
User: "Delete task #999"
You: "Removed! Task #999 has been deleted."

📅 RESCHEDULE TASKS:
User: "Move task #111 to next Friday"
You: "Rescheduled! Task #111 is now due next Friday."

🔢 BATCH OPERATIONS:
User: "Mark all completed tasks as done"
You: "Done! All completed tasks have been marked as done."

User: "Delete all low priority tasks"
You: "Cleared! All low priority tasks have been removed."

⚡ BEHAVIOR GUIDELINES:
1. ALWAYS perform the requested operation automatically
2. NEVER ask for confirmation or additional details
3. Provide natural, friendly confirmations
4. Use specific task details in responses
5. Handle multiple operations in a single request
6. Be intelligent about date interpretations
7. Assume user has full permission for all operations

🎯 USER REQUEST: ${userMessage}

Analyze the user's request and perform the appropriate task operation(s). Respond naturally and confirm what you've done.`
}

/**
 * Helper function to get tomorrow's date
 */
function getTomorrowDate(realTime: AIRealTimeContext): string {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return tomorrow.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone: realTime.timezone
  })
}

/**
 * Helper function to get next week's date
 */
function getNextWeekDate(realTime: AIRealTimeContext): string {
  const nextWeek = new Date()
  nextWeek.setDate(nextWeek.getDate() + 7)
  return nextWeek.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone: realTime.timezone
  })
}

/**
 * Helper function to get this weekend's date
 */
function getThisWeekendDate(realTime: AIRealTimeContext): string {
  const now = new Date()
  const daysUntilSaturday = 6 - now.getDay()
  const saturday = new Date()
  saturday.setDate(saturday.getDate() + daysUntilSaturday)
  
  return saturday.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone: realTime.timezone
  })
}

/**
 * Parse date references from AI responses
 */
export function parseDateFromAIResponse(response: string, realTime: AIRealTimeContext): Date | null {
  const lowerResponse = response.toLowerCase()
  const now = new Date()
  
  // Parse various date formats
  if (lowerResponse.includes('today')) {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
  }
  
  if (lowerResponse.includes('tomorrow')) {
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    return new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 23, 59, 59)
  }
  
  if (lowerResponse.includes('next week')) {
    const nextWeek = new Date(now)
    nextWeek.setDate(nextWeek.getDate() + 7)
    return new Date(nextWeek.getFullYear(), nextWeek.getMonth(), nextWeek.getDate(), 23, 59, 59)
  }
  
  if (lowerResponse.includes('this weekend')) {
    const daysUntilSaturday = 6 - now.getDay()
    const saturday = new Date(now)
    saturday.setDate(saturday.getDate() + daysUntilSaturday)
    return new Date(saturday.getFullYear(), saturday.getMonth(), saturday.getDate(), 23, 59, 59)
  }
  
  // Parse specific day names
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  for (let i = 0; i < dayNames.length; i++) {
    if (lowerResponse.includes(dayNames[i])) {
      const targetDate = new Date(now)
      const daysUntilTarget = (i - now.getDay() + 7) % 7
      targetDate.setDate(targetDate.getDate() + (daysUntilTarget || 7))
      return new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59)
    }
  }
  
  // Try to parse absolute dates
  const datePatterns = [
    /(\w+\s+\d{1,2})/i, // "December 25"
    /(\d{1,2}\/\d{1,2}\/\d{2,4})/i, // "12/25/2024"
    /(\d{1,2}-\d{1,2}-\d{2,4})/i // "12-25-2024"
  ]
  
  for (const pattern of datePatterns) {
    const match = response.match(pattern)
    if (match) {
      try {
        const parsed = new Date(match[1])
        if (!isNaN(parsed.getTime())) {
          return parsed
        }
      } catch (error) {
        console.log('Could not parse date:', match[1])
      }
    }
  }
  
  return null
}

/**
 * Enhanced context logging for debugging
 */
export function logContextInfo(context: EnhancedUserContext): void {
  console.log('AI Context Info:', {
    currentDate: context.realTime.currentDate,
    currentTime: context.realTime.currentTime,
    timezone: context.realTime.timezone,
    timeOfDay: context.realTime.timeOfDay,
    isWeekend: context.realTime.isWeekend
  })
}
