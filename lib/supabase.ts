// Re-export from the new client structure
export { supabaseClient as supabase } from './supabaseClient'

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
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          email?: string
          avatar_url?: string | null
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
    }
  }
}
