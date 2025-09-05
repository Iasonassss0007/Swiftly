// Re-export from the new client structure
export { supabase, chatService } from './supabaseClient'

export type Database = {
  api: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          email: string
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          email: string
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          email?: string
          avatar_url?: string | null
          created_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          status: 'todo' | 'in_progress' | 'done'
          priority: 'low' | 'medium' | 'high'
          due_date: string | null
          completed: boolean
          tags: string[] | null
          assignees: any[] | null
          subtasks: any[] | null
          attachments: any[] | null
          comments: any[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          status?: 'todo' | 'in_progress' | 'done'
          priority?: 'low' | 'medium' | 'high'
          due_date?: string | null
          completed?: boolean
          tags?: string[] | null
          assignees?: string[] | null
          subtasks?: string[] | null
          attachments?: string[] | null
          comments?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          status?: 'todo' | 'in_progress' | 'done'
          priority?: 'low' | 'medium' | 'high'
          due_date?: string | null
          completed?: boolean
          tags?: string[] | null
          assignees?: string[] | null
          subtasks?: string[] | null
          attachments?: string[] | null
          comments?: string[] | null
          created_at?: string
          updated_at?: string
        }
      }
      user_sessions: {
        Row: {
          id: string
          user_id: string
          created_at: string
          ip_address: string | null
          user_agent: string | null
          expires_at: string | null
          metadata: any
          session_type: string | null
        }
        Insert: {
          id?: string
          user_id: string
          created_at?: string
          ip_address?: string | null
          user_agent?: string | null
          expires_at?: string | null
          metadata?: any
          session_type?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          created_at?: string
          ip_address?: string | null
          user_agent?: string | null
          expires_at?: string | null
          metadata?: any
          session_type?: string | null
        }
      }
      chat_messages: {
        Row: {
          id: string
          user_id: string
          sender: 'user' | 'ai'
          message_text: string
          created_at: string
          session_id: string
          metadata: any
        }
        Insert: {
          id?: string
          user_id: string
          sender: 'user' | 'ai'
          message_text: string
          created_at?: string
          session_id?: string
          metadata?: any
        }
        Update: {
          id?: string
          user_id?: string
          sender?: 'user' | 'ai'
          message_text?: string
          created_at?: string
          session_id?: string
          metadata?: any
        }
      }
    }
  }
}
