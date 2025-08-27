import { createClient } from '@supabase/supabase-js'
import type { Database } from './supabase'

// Server-side admin client - uses service role key
// This should ONLY be used in API routes, getServerSideProps, or other server-side code
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase service role environment variables')
}

export const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'api'
  }
})

// Export types for use in server-side code
export type { Database }
export type Profile = Database['api']['Tables']['profiles']['Row']
export type UserSession = Database['api']['Tables']['user_sessions']['Row']

// ⚠️ SECURITY WARNING: This client has full database access
// Only use in server-side code, never expose to the browser
