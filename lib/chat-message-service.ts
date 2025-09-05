/**
 * Chat Message Service
 * Basic chat functionality without persistence
 */

export interface ChatMessage {
  id?: string
  session_id: string
  user_id: string
  message_text: string
  sender: 'user' | 'ai'
  timestamp?: string
  has_task?: boolean
  task_id?: string | null
  language_detected?: string | null
  metadata?: Record<string, any>
}

export interface ChatSession {
  id?: string
  user_id: string
  session_name?: string
  created_at?: string
  updated_at?: string
  is_active?: boolean
  metadata?: Record<string, any>
}

export interface ConversationHistory {
  message_id: string
  message_text: string
  sender: 'user' | 'ai'
  message_timestamp: string
  has_task: boolean
  task_id: string | null
  language_detected: string | null
}

export class ChatMessageService {
  // Placeholder methods - no persistence functionality
  static async createSession(): Promise<{ session_id: string; error?: string }> {
    return { session_id: '', error: 'Persistence disabled' }
  }

  static async saveMessage(): Promise<{ message_id: string; success: boolean; error?: string }> {
    return { message_id: '', success: false, error: 'Persistence disabled' }
  }

  static async saveUserMessage(): Promise<{ message_id: string; success: boolean; error?: string }> {
    return { message_id: '', success: false, error: 'Persistence disabled' }
  }

  static async saveAIMessage(): Promise<{ message_id: string; success: boolean; error?: string }> {
    return { message_id: '', success: false, error: 'Persistence disabled' }
  }

  static async getConversationHistory(): Promise<{ messages: ConversationHistory[]; error?: string }> {
    return { messages: [], error: 'Persistence disabled' }
  }

  static async getOrCreateDefaultSession(): Promise<{ session_id: string; error?: string }> {
    return { session_id: '', error: 'Persistence disabled' }
  }

  static async testDatabaseConnection(): Promise<{ success: boolean; error?: string; details?: any }> {
    return { success: false, error: 'Persistence disabled' }
  }

  static convertToUIMessage(): any {
    return null
  }
}

// Language detection utility
export function detectLanguage(text: string): string | null {
  // Simple language detection logic
  if (!text) return null
  
  // Basic heuristics for common languages
  const patterns = {
    spanish: /[áéíóúñ¿¡]/i,
    french: /[àâäéèêëïîôöùûüÿç]/i,
    german: /[äöüß]/i,
    italian: /[àèéìíîòóù]/i,
    portuguese: /[ãâáàçéêíóôõú]/i,
    russian: /[а-яё]/i,
    chinese: /[\u4e00-\u9fff]/,
    japanese: /[\u3040-\u309f\u30a0-\u30ff]/,
    korean: /[\uac00-\ud7af]/,
    arabic: /[\u0600-\u06ff]/,
    hindi: /[\u0900-\u097f]/,
    thai: /[\u0e00-\u0e7f]/
  }
  
  for (const [lang, pattern] of Object.entries(patterns)) {
    if (pattern.test(text)) {
      return lang
    }
  }
  
  return null
}

/**
 * Usage Examples:
 * 
 * // Create session
 * const { session_id } = await ChatMessageService.createSession(userId, 'AI Chat Session')
 * 
 * // Save user message EXACTLY as typed
 * await ChatMessageService.saveUserMessage(session_id, userId, "create a task named job interview")
 * 
 * // Save AI response EXACTLY as generated
 * await ChatMessageService.saveAIMessage(session_id, userId, "I've created a task called 'job interview' for you.", {
 *   hasTask: true,
 *   taskId: createdTaskId
 * })
 * 
 * // Get conversation history
 * const { messages } = await ChatMessageService.getConversationHistory(session_id)
 */
