/**
 * AI Task Creation Service
 * 
 * This service automatically detects task creation commands from AI chat responses
 * and creates tasks in the database with real-time UI updates.
 * 
 * Features:
 * - Intelligent task command detection using regex and keyword analysis
 * - Structured data extraction from natural language AI responses
 * - Integration with instant loading cache system for immediate UI updates
 * - Comprehensive error handling and validation
 * - Support for various task properties (title, description, due date, priority)
 */

import { getTaskCache, Task } from './task-cache'
import { parseDateFromAIResponse, getCurrentContext, type AIRealTimeContext } from './ai-context-provider'

/**
 * Extracted task data from AI response
 */
export interface ExtractedTask {
  title: string
  description?: string
  dueDate?: Date
  priority?: 'low' | 'medium' | 'high'
  status?: 'todo' | 'in_progress' | 'done'
  tags?: string[]
}

/**
 * Result of task creation attempt
 */
export interface TaskCreationResult {
  success: boolean
  task?: Task
  error?: string
  detected: boolean
  rawExtraction?: ExtractedTask
}

/**
 * Task detection patterns and keywords
 */
const TASK_DETECTION_PATTERNS = {
  // Direct task creation commands
  createCommands: [
    /(?:create|make|add|set up|schedule|plan)\s+(?:a\s+)?(?:new\s+)?task/i,
    /(?:i\s+(?:will|need to|should|have to)|you\s+(?:should|need to|have to))\s+.+/i,
    /(?:reminder|todo|to-do)(?:\s+(?:item|task))?/i,
    /(?:add\s+to|put\s+on)\s+(?:my\s+)?(?:task\s+list|todo\s+list|schedule)/i
  ],
  
  // Task properties patterns
  titlePatterns: [
    /(?:task|todo|reminder)(?:\s+(?:named|called|titled))?\s*[:"']([^"']+)[:"']?/i,
    /(?:create|make|add)\s+(?:a\s+)?(?:task|todo|reminder)\s+[:"']?([^"'\n]+)[:"']?/i,
    /(?:task|todo|reminder):\s*([^.\n]+)/i
  ],
  
  // Due date patterns
  dueDatePatterns: [
    /(?:due|by|before|on|for)\s+(today|tomorrow|this\s+week|next\s+week)/i,
    /(?:due|by|before|on|for)\s+(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)/i,
    /(?:due|by|before|on|for)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i,
    /(?:due|by|before|on|for)\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}/i
  ],
  
  // Priority patterns
  priorityPatterns: [
    /(?:high|urgent|important)\s+priority/i,
    /(?:low|minor)\s+priority/i,
    /priority\s*:\s*(high|medium|low|urgent|important|minor)/i
  ]
}

/**
 * Class responsible for detecting and creating tasks from AI responses
 */
export class AITaskService {
  private userId: string
  private cache: ReturnType<typeof getTaskCache>

  constructor(userId: string) {
    this.userId = userId
    this.cache = getTaskCache(userId)
  }

  /**
   * Main method to process AI response and create tasks if detected
   * Now enhanced with real-time context for better date parsing
   */
  async processAIResponse(
    userMessage: string, 
    aiResponse: string,
    realTimeContext?: AIRealTimeContext
  ): Promise<TaskCreationResult> {
    try {
      console.log('Processing AI response for task detection...')
      console.log('User message:', userMessage)
      console.log('AI response:', aiResponse)

      // Validate inputs
      if (!userMessage?.trim() && !aiResponse?.trim()) {
        return {
          success: false,
          detected: false,
          error: 'No valid message content to process'
        }
      }

      // Step 1: Detect if this is a task creation request
      const isTaskRequest = this.detectTaskCreationIntent(userMessage, aiResponse)
      
      if (!isTaskRequest) {
        console.log('No task creation intent detected')
        return {
          success: false,
          detected: false,
          error: 'No task creation intent detected'
        }
      }

      console.log('Task creation intent detected!')

      // Step 2: Extract task data from the AI response with real-time context
      const extractedTask = this.extractTaskData(userMessage, aiResponse, realTimeContext)
      
      if (!extractedTask.title || extractedTask.title.length < 2) {
        console.log('Could not extract valid task title')
        return {
          success: false,
          detected: true,
          error: 'Could not extract valid task title. Please provide more specific task details.',
          rawExtraction: extractedTask
        }
      }

      // Validate extracted data
      if (extractedTask.title.length > 200) {
        extractedTask.title = extractedTask.title.substring(0, 200).trim()
      }

      if (extractedTask.description && extractedTask.description.length > 1000) {
        extractedTask.description = extractedTask.description.substring(0, 1000).trim()
      }

      console.log('Extracted task data:', extractedTask)

      // Step 3: Create the task in database and cache
      const task = await this.createTask(extractedTask)
      
      console.log('Task created successfully:', task.id)

      return {
        success: true,
        detected: true,
        task,
        rawExtraction: extractedTask
      }

    } catch (error) {
      console.error('Error processing AI response for task creation:', error)
      
      // Provide user-friendly error messages
      let errorMessage = 'Unknown error occurred'
      if (error instanceof Error) {
        if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'Network error - please check your connection and try again'
        } else if (error.message.includes('database') || error.message.includes('supabase')) {
          errorMessage = 'Database error - please try again in a moment'
        } else if (error.message.includes('auth') || error.message.includes('user')) {
          errorMessage = 'Authentication error - please refresh the page and try again'
        } else {
          errorMessage = error.message
        }
      }
      
      return {
        success: false,
        detected: true,
        error: errorMessage
      }
    }
  }

  /**
   * Detect if the user message or AI response indicates task creation intent
   */
  private detectTaskCreationIntent(userMessage: string, aiResponse: string): boolean {
    // Ensure we have valid input
    if (!userMessage && !aiResponse) return false
    
    const combinedText = `${userMessage || ''} ${aiResponse || ''}`.toLowerCase().trim()
    
    if (combinedText.length < 3) return false

    // Check for direct task creation commands
    for (const pattern of TASK_DETECTION_PATTERNS.createCommands) {
      if (pattern.test(combinedText)) {
        console.log('Task creation pattern matched:', pattern)
        return true
      }
    }

    // Check for task-related keywords in context
    const taskKeywords = [
      'task', 'todo', 'reminder', 'schedule', 'deadline', 'due date',
      'assign', 'complete', 'finish', 'accomplish', 'work on'
    ]

    const actionKeywords = [
      'create', 'make', 'add', 'set up', 'plan', 'organize', 'prepare'
    ]

    const hasTaskKeyword = taskKeywords.some(keyword => 
      combinedText.includes(keyword)
    )

    const hasActionKeyword = actionKeywords.some(keyword => 
      combinedText.includes(keyword)
    )

    // If we have both task and action keywords, likely a task creation request
    if (hasTaskKeyword && hasActionKeyword) {
      console.log('Task + action keywords detected')
      return true
    }

    // Check for specific phrases that indicate task creation
    const taskCreationPhrases = [
      'i need to', 'i have to', 'i should', 'i will',
      'add to my list', 'put on my schedule', 'dont forget',
      'remind me to', 'make sure i', 'help me remember'
    ]

    for (const phrase of taskCreationPhrases) {
      if (combinedText.includes(phrase)) {
        console.log('Task creation phrase detected:', phrase)
        return true
      }
    }

    // Additional checks for edge cases
    // Check if user is asking to be reminded about something
    if (combinedText.includes('remind') && (combinedText.includes('me') || combinedText.includes('to'))) {
      console.log('Reminder request detected')
      return true
    }

    // Check for appointment/meeting scheduling
    if (combinedText.includes('meeting') || combinedText.includes('appointment')) {
      if (combinedText.includes('schedule') || combinedText.includes('book') || combinedText.includes('plan')) {
        console.log('Meeting/appointment scheduling detected')
        return true
      }
    }

    return false
  }

  /**
   * Extract task data from the user message and AI response
   * Enhanced with real-time context for accurate date parsing
   */
  private extractTaskData(
    userMessage: string, 
    aiResponse: string, 
    realTimeContext?: AIRealTimeContext
  ): ExtractedTask {
    const combinedText = `${userMessage} ${aiResponse}`
    
    const task: ExtractedTask = {
      title: '',
      priority: 'medium',
      status: 'todo'
    }

    // Extract title
    task.title = this.extractTaskTitle(combinedText)

    // Extract description (use AI response as description if it's helpful)
    task.description = this.extractTaskDescription(userMessage, aiResponse)

    // Extract due date with real-time context
    task.dueDate = this.extractDueDate(combinedText, realTimeContext)

    // Extract priority
    task.priority = this.extractPriority(combinedText)

    // Extract tags
    task.tags = this.extractTags(combinedText)

    return task
  }

  /**
   * Extract task title from text
   */
  private extractTaskTitle(text: string): string {
    // Try title patterns first
    for (const pattern of TASK_DETECTION_PATTERNS.titlePatterns) {
      const match = text.match(pattern)
      if (match && match[1]) {
        return this.cleanTaskTitle(match[1])
      }
    }

    // Fallback: Look for quoted strings
    const quotedMatch = text.match(/["']([^"']+)["']/i)
    if (quotedMatch && quotedMatch[1]) {
      return this.cleanTaskTitle(quotedMatch[1])
    }

    // Fallback: Extract from common task creation patterns
    const patterns = [
      /(?:create|make|add|set up)\s+(?:a\s+)?(?:task|todo|reminder)\s+(?:for\s+|to\s+)?([^.!?]+)/i,
      /(?:i\s+(?:need|have|should))\s+to\s+([^.!?]+)/i,
      /(?:remind\s+me\s+to|help\s+me\s+remember\s+to)\s+([^.!?]+)/i,
      /(?:add\s+to\s+my\s+list|put\s+on\s+my\s+schedule):\s*([^.!?]+)/i
    ]

    for (const pattern of patterns) {
      const match = text.match(pattern)
      if (match && match[1]) {
        return this.cleanTaskTitle(match[1])
      }
    }

    // Final fallback: Use first meaningful sentence
    const sentences = text.split(/[.!?]/)
    for (const sentence of sentences) {
      const cleaned = sentence.trim()
      if (cleaned.length > 5 && cleaned.length < 100) {
        // Remove common prefixes
        const withoutPrefixes = cleaned.replace(
          /^(?:create|make|add|set up|i need to|i have to|i should|remind me to|help me remember to)\s+/i, 
          ''
        )
        if (withoutPrefixes.length > 0) {
          return this.cleanTaskTitle(withoutPrefixes)
        }
      }
    }

    return ''
  }

  /**
   * Clean and format task title
   */
  private cleanTaskTitle(title: string): string {
    return title
      .trim()
      .replace(/^(?:a\s+|an\s+|the\s+)/i, '') // Remove articles
      .replace(/[.!?]+$/, '') // Remove trailing punctuation
      .trim()
      .substring(0, 200) // Limit length
  }

  /**
   * Extract task description
   */
  private extractTaskDescription(userMessage: string, aiResponse: string): string | undefined {
    // If AI response looks like a helpful elaboration, use it as description
    if (aiResponse && 
        aiResponse.length > 20 && 
        aiResponse.length < 500 &&
        !aiResponse.toLowerCase().includes('i cannot') &&
        !aiResponse.toLowerCase().includes('i don\'t understand')) {
      
      // Clean up the AI response for use as description
      const cleaned = aiResponse
        .replace(/^(?:sure,?\s*|okay,?\s*|alright,?\s*|i'll\s+)/i, '')
        .replace(/(?:\s*let me know if you need anything else\.?|\s*is there anything else\??)$/i, '')
        .trim()
      
      if (cleaned.length > 10) {
        return cleaned
      }
    }

    return undefined
  }

  /**
   * Extract due date from text
   */
  private extractDueDate(text: string): Date | undefined {
    const now = new Date()

    for (const pattern of TASK_DETECTION_PATTERNS.dueDatePatterns) {
      const match = text.match(pattern)
      if (match && match[1]) {
        const dateStr = match[1].toLowerCase()
        
        // Handle relative dates
        if (dateStr === 'today') {
          return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
        }
        
        if (dateStr === 'tomorrow') {
          const tomorrow = new Date(now)
          tomorrow.setDate(tomorrow.getDate() + 1)
          return new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 23, 59, 59)
        }
        
        if (dateStr === 'this week') {
          const endOfWeek = new Date(now)
          endOfWeek.setDate(endOfWeek.getDate() + (7 - endOfWeek.getDay()))
          return endOfWeek
        }
        
        if (dateStr === 'next week') {
          const nextWeek = new Date(now)
          nextWeek.setDate(nextWeek.getDate() + (14 - nextWeek.getDay()))
          return nextWeek
        }

        // Handle day names
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
        const dayIndex = dayNames.indexOf(dateStr)
        if (dayIndex !== -1) {
          const targetDate = new Date(now)
          const daysUntilTarget = (dayIndex - now.getDay() + 7) % 7
          targetDate.setDate(targetDate.getDate() + (daysUntilTarget || 7))
          return new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59)
        }

        // Try to parse as date
        try {
          const parsed = new Date(dateStr)
          if (!isNaN(parsed.getTime())) {
            return parsed
          }
        } catch (error) {
          console.log('Could not parse date:', dateStr)
        }
      }
    }

    // If real-time parsing fails, fall back to existing logic
    console.log('Using fallback date parsing')
    return undefined
  }

  /**
   * Extract priority from text
   */
  private extractPriority(text: string): 'low' | 'medium' | 'high' {
    for (const pattern of TASK_DETECTION_PATTERNS.priorityPatterns) {
      const match = text.match(pattern)
      if (match) {
        const priorityText = match[1]?.toLowerCase() || match[0].toLowerCase()
        
        if (priorityText.includes('high') || priorityText.includes('urgent') || priorityText.includes('important')) {
          return 'high'
        }
        
        if (priorityText.includes('low') || priorityText.includes('minor')) {
          return 'low'
        }
      }
    }

    // Default to medium priority
    return 'medium'
  }

  /**
   * Extract tags from text
   */
  private extractTags(text: string): string[] {
    const tags: string[] = []

    // Common category keywords that become tags
    const categoryKeywords = [
      'work', 'personal', 'family', 'health', 'finance', 'education',
      'shopping', 'travel', 'meeting', 'appointment', 'call', 'email',
      'urgent', 'important', 'project', 'research', 'review'
    ]

    for (const keyword of categoryKeywords) {
      if (text.toLowerCase().includes(keyword)) {
        tags.push(keyword.charAt(0).toUpperCase() + keyword.slice(1))
      }
    }

    // Remove duplicates
    return [...new Set(tags)]
  }

  /**
   * Create task using the cache system for instant UI updates
   */
  private async createTask(extractedTask: ExtractedTask): Promise<Task> {
    const taskData: Omit<Task, 'id'> = {
      title: extractedTask.title,
      description: extractedTask.description,
      priority: extractedTask.priority || 'medium',
      status: extractedTask.status || 'todo',
      dueDate: extractedTask.dueDate || null,
      completed: false,
      assignees: [], // Start with no assignees
      tags: extractedTask.tags || [],
      subtasks: [],
      attachments: [],
      comments: []
    }

    // Use cache system for instant UI updates
    return await this.cache.addTask(taskData)
  }
}

/**
 * Factory function to create AI task service instance
 */
export function createAITaskService(userId: string): AITaskService {
  return new AITaskService(userId)
}

/**
 * Utility function to process AI response for task creation
 * This is the main entry point for the AI chat integration
 * Enhanced with real-time context for better date handling
 */
export async function processAIForTasks(
  userId: string,
  userMessage: string,
  aiResponse: string,
  realTimeContext?: AIRealTimeContext
): Promise<TaskCreationResult> {
  const service = createAITaskService(userId)
  return await service.processAIResponse(userMessage, aiResponse, realTimeContext)
}
