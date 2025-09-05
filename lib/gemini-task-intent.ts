/**
 * Gemini Task Intent Detection Service
 * 
 * This service uses Gemini AI to detect when a user wants to create a task
 * and extract the exact task name they intend, then creates the task directly
 * using the existing task cache system for immediate visibility.
 */

import { getTaskCache, Task } from './task-cache'

export interface TaskIntentResult {
  hasTaskIntent: boolean
  taskName: string | null
  description?: string | null
  dueDate?: string | null
  priority?: 'low' | 'medium' | 'high' | null
  tags?: string[]
  assignees?: string[]
  needsClarity: boolean
  clarificationMessage?: string
  taskCreated?: boolean
  taskId?: string
}

export interface GeminiTaskIntentService {
  analyzeUserIntent(userMessage: string): Promise<TaskIntentResult>
  createTaskFromIntent(userMessage: string, userId: string): Promise<TaskIntentResult>
}

/**
 * Gemini-powered task intent detection
 */
export class GeminiTaskIntentDetector implements GeminiTaskIntentService {
  private apiEndpoint: string

  constructor() {
    // Use the existing Gemini API endpoint
    this.apiEndpoint = '/api/ai/gemini-parse-task'
  }

  /**
   * Analyze user message to detect task creation intent and extract exact task name
   */
  async analyzeUserIntent(userMessage: string): Promise<TaskIntentResult> {
    console.log('🔍 [GEMINI INTENT] Analyzing message with Gemini:', userMessage)
    
    try {
      // Call Gemini API for intent analysis
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          mode: 'intent'
        })
      })

      if (!response.ok) {
        console.error('❌ [GEMINI INTENT] API error:', response.status)
        throw new Error(`Gemini API error: ${response.status}`)
      }

      const result = await response.json()
      console.log('🤖 [GEMINI INTENT] Response:', result)

      return {
        hasTaskIntent: result.hasTaskIntent || false,
        taskName: result.taskName || null,
        description: result.description || null,
        dueDate: result.dueDate || null,
        priority: result.priority || null,
        tags: result.tags || [],
        assignees: result.assignees || [],
        needsClarity: result.needsClarity || false,
        clarificationMessage: result.clarificationMessage
      }

    } catch (error) {
      console.error('❌ [GEMINI INTENT] Error calling Gemini:', error)
      
      // Return no intent if Gemini is unavailable
      return {
        hasTaskIntent: false,
        taskName: null,
        description: null,
        dueDate: null,
        priority: null,
        tags: [],
        assignees: [],
        needsClarity: false
      }
    }
  }



  /**
   * Analyze user intent and create task directly if intent is clear
   */
  async createTaskFromIntent(userMessage: string, userId: string): Promise<TaskIntentResult> {
    try {
      console.log('🎯 [GEMINI INTENT] Analyzing intent and creating task for user:', userId)

      // First analyze the intent
      const intentResult = await this.analyzeUserIntent(userMessage)
      
      if (!intentResult.hasTaskIntent) {
        return intentResult
      }

      if (intentResult.needsClarity || !intentResult.taskName) {
        return intentResult
      }

      // Create the task with all extracted information
      const taskCache = getTaskCache(userId)
      
      // Parse due date if provided
      let parsedDueDate = null
      if (intentResult.dueDate) {
        try {
          parsedDueDate = new Date(intentResult.dueDate)
          if (isNaN(parsedDueDate.getTime())) {
            parsedDueDate = null
          }
        } catch {
          parsedDueDate = null
        }
      }
      
      const newTask: Omit<Task, 'id'> = {
        title: intentResult.taskName,
        description: intentResult.description || undefined,
        priority: intentResult.priority || 'medium',
        status: 'todo',
        dueDate: parsedDueDate,
        completed: false,
        assignees: intentResult.assignees || [],
        tags: intentResult.tags || [],
        subtasks: [],
        attachments: [],
        comments: []
      }

      const createdTask = await taskCache.addTask(newTask)
      console.log('✅ [GEMINI INTENT] Task created successfully:', createdTask.id)

      return {
        ...intentResult,
        taskCreated: true,
        taskId: createdTask.id
      }

    } catch (error) {
      console.error('❌ [GEMINI INTENT] Error creating task from intent:', error)
      return {
        hasTaskIntent: true,
        taskName: null,
        description: null,
        dueDate: null,
        priority: null,
        tags: [],
        assignees: [],
        needsClarity: true,
        clarificationMessage: 'I had some trouble with that. Could you tell me what to call this task?',
        taskCreated: false
      }
    }
  }


}

/**
 * Factory function to create intent detector
 */
export function createTaskIntentDetector(): GeminiTaskIntentService {
  return new GeminiTaskIntentDetector()
}

/**
 * Convenience function for intent analysis
 */
export async function analyzeTaskIntent(userMessage: string): Promise<TaskIntentResult> {
  const detector = createTaskIntentDetector()
  return await detector.analyzeUserIntent(userMessage)
}

/**
 * Convenience function for intent analysis and direct task creation
 */
export async function analyzeAndCreateTask(userMessage: string, userId: string): Promise<TaskIntentResult> {
  const detector = createTaskIntentDetector()
  return await detector.createTaskFromIntent(userMessage, userId)
}

