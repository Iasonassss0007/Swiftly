/**
 * Chat Cache Service
 * Basic structure without persistence functionality
 */

export interface CachedMessage {
  id: string
  content: string
  type: 'user' | 'ai' | 'error'
  timestamp: string // ISO string for serialization
  hasTask?: boolean
  taskId?: string
}

export interface CachedChatSession {
  sessionId: string
  userId: string
  messages: CachedMessage[]
  lastUpdated: string // ISO string
  messageCount: number
}

export class ChatCache {
  // Placeholder methods - no persistence functionality
  static getCachedMessages(): CachedMessage[] {
    return []
  }

  static cacheMessages(): void {
    // No persistence
  }

  static addMessageToCache(): void {
    // No persistence
  }

  static toCachedMessage(): CachedMessage {
    return {
      id: '',
      content: '',
      type: 'user',
      timestamp: new Date().toISOString()
    }
  }

  static fromCachedMessage(): any {
    return null
  }

  static clearCache(): void {
    // No persistence
  }

  static getCacheStats(): any {
    return { messageCount: 0, lastUpdated: null }
  }
}
