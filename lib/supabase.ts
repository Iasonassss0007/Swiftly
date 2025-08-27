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
          id: number
          user_id: string
          session_data: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          user_id: string
          session_data: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          session_data?: any
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
