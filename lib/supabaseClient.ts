import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  db: {
    schema: 'api'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  global: {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  }
})

// Chat-specific helper functions
export const chatService = {
  // Save a message to the database
  async saveMessage(userId: string, sender: 'user' | 'ai', messageText: string, sessionId?: string | null) {
    try {
      const { data, error } = await supabase.rpc('save_chat_message', {
        p_user_id: userId,
        p_sender: sender,
        p_message_text: messageText,
        p_session_id: sessionId
      })

      if (error) {
        console.error('Error saving message:', error)
        throw error
      }

      return { success: true, messageId: data, sessionId: sessionId }
    } catch (error) {
      console.error('Failed to save message:', error)
      return { success: false, error: (error as Error).message }
    }
  },

  // Get conversation history
  async getConversationHistory(userId: string, sessionId?: string | null, limit: number = 50) {
    try {
      console.log('🔍 Fetching conversation history:', { userId, sessionId, limit })
      
      const { data, error } = await supabase.rpc('get_conversation_history', {
        p_user_id: userId,
        p_session_id: sessionId,
        p_limit: limit
      })

      if (error) {
        console.error('❌ Supabase RPC error:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        throw error
      }

      console.log('✅ Conversation history fetched:', { messageCount: data?.length || 0 })
      return { success: true, messages: data || [] }
    } catch (error) {
      console.error('❌ Failed to fetch conversation history:', {
        error: error,
        message: (error as Error).message,
        stack: (error as Error).stack
      })
      return { success: false, error: (error as Error).message, messages: [] }
    }
  },

  // Get user sessions
  async getUserSessions(userId: string) {
    try {
      const { data, error } = await supabase.rpc('get_user_sessions', {
        p_user_id: userId
      })

      if (error) {
        console.error('Error fetching user sessions:', error)
        throw error
      }

      return { success: true, sessions: data || [] }
    } catch (error) {
      console.error('Failed to fetch user sessions:', error)
      return { success: false, error: (error as Error).message, sessions: [] }
    }
  },

  // Subscribe to real-time updates
  subscribeToMessages(userId: string, sessionId: string | null, callback: (message: any) => void) {
    const channel = supabase
      .channel(`chat_messages:${sessionId || 'all'}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'api',
          table: 'chat_messages',
          filter: `user_id=eq.${userId}${sessionId ? ` AND session_id=eq.${sessionId}` : ''}`
        },
        (payload) => {
          callback(payload.new)
        }
      )
      .subscribe()

    return channel
  },

  // Unsubscribe from real-time updates
  unsubscribeFromMessages(channel: any) {
    if (channel) {
      supabase.removeChannel(channel)
    }
  }
}

export default supabase
