import { createClient } from '@supabase/supabase-js'
import type { Database } from './supabase'

// Frontend client - uses only public keys
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  db: {
    schema: 'api'
  }
})

// Export types for use in components
export type { Database }
export type Profile = Database['api']['Tables']['profiles']['Row']
export type UserSession = Database['api']['Tables']['user_sessions']['Row']
