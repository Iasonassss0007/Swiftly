'use client'

import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { supabase } from './supabase'
import type { Profile } from './supabaseClient'
import { Database } from './supabase'

type Profile = Database['api']['Tables']['profiles']['Row']

interface AuthContextType {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  authLoading: boolean
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: any }>
  createProfile: (userId: string, fullName: string, email: string) => Promise<{ error: any }>
}

// Utility function to format date consistently across components
export const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'Unknown'
  
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'Unknown'
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  } catch {
    return 'Unknown'
  }
}

// Utility function to create user data object from auth context
export const createUserData = (user: User, profile: Profile | null) => ({
  id: user.id,
  name: profile?.full_name ?? 'User',
  email: profile?.email ?? 'user@example.com',
  avatarUrl: profile?.avatar_url || undefined,
  roles: ['user'],
  memberSince: formatDate(profile?.created_at)
})

// Global flags to prevent duplicate setup across Fast Refresh cycles
let globalListenerSetup = false
let globalInitialSessionFetched = false
let globalSignInProcessed = false

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [authLoading, setAuthLoading] = useState(false)
  const router = useRouter()
  const listenerSetupRef = useRef(false)
  const initialSessionRef = useRef(false)

  // Fetch user profile from profiles table - memoized to prevent recreation
  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    try {
      console.log('Fetching profile for user:', userId)
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      // console.log('Profile fetch response:', { data, error })

      if (error) {
        console.error('Profile fetch error:', error)
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        })
        return null
      }

      // console.log('Profile fetched successfully:', data)
      return data
    } catch (error) {
      console.error('Unexpected error fetching profile:', error)
      return null
    }
  }, [])

  // Create user profile in profiles table - memoized to prevent recreation
  const createProfile = useCallback(async (userId: string, fullName: string, email: string): Promise<{ error: any }> => {
    try {
      // console.log('Creating profile for user:', userId, 'with name:', fullName, 'email:', email)
      
      // First check if profile already exists
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single()
      
      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error checking existing profile:', checkError)
        return { error: checkError }
      }
      
      if (existingProfile) {
        // console.log('Profile already exists for user:', userId)
        return { error: null }
      }
      
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          full_name: fullName,
          email: email,
          avatar_url: null
        })
        .select()
        .single() as { data: Profile | null, error: any }

      if (error) {
        console.error('Profile creation error:', error)
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        })
        return { error }
      }

      // Update the profile state immediately
      setProfile(data)
      // console.log('Profile created successfully:', data)
      return { error: null }
    } catch (error) {
      console.error('Unexpected error creating profile:', error)
      return { error }
    }
  }, [])

  // Ensure profile exists and is loaded
  const ensureProfile = useCallback(async (userId: string, fullName: string, email: string): Promise<Profile | null> => {
    // console.log('ensureProfile called with:', { userId, fullName, email })
    
    // First try to fetch existing profile
    let profileData = await fetchProfile(userId)
          // console.log('Initial profile fetch result:', profileData)
    
    if (!profileData) {
      // Profile doesn't exist, create it
              // console.log('Profile not found, creating new profile...')
      const createResult = await createProfile(userId, fullName, email)
              // console.log('Profile creation result:', createResult)
      
      if (createResult.error) {
        console.error('Failed to create profile:', createResult.error)
        return null
      }
      
      // Fetch the newly created profile
              // console.log('Fetching newly created profile...')
      profileData = await fetchProfile(userId)
              // console.log('New profile fetch result:', profileData)
    }
    
          // console.log('ensureProfile returning:', profileData)
    return profileData
  }, [fetchProfile, createProfile])

  // Wait for session to be established before redirecting
  const waitForSession = useCallback(async (): Promise<Session | null> => {
    let attempts = 0
    const maxAttempts = 30 // Increased to handle cases where cookies are cleared
    
    while (attempts < maxAttempts) {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error)
          return null
        }
        
        if (session) {
          console.log('Session established successfully after', attempts + 1, 'attempts')
          return session
        }
        
        // Progressive waiting: longer waits for first attempts, then shorter
        let waitTime: number
        if (attempts < 3) {
          waitTime = 2000 // 2 seconds for first 3 attempts
        } else if (attempts < 10) {
          waitTime = 1000 // 1 second for next 7 attempts
        } else {
          waitTime = 500 // 500ms for remaining attempts
        }
        
        console.log(`Waiting ${waitTime}ms for session establishment (attempt ${attempts + 1}/${maxAttempts})`)
        await new Promise(resolve => setTimeout(resolve, waitTime))
        attempts++
      } catch (error) {
        console.error('Unexpected error in waitForSession:', error)
        return null
      }
    }
    
    console.warn('Session not established after maximum attempts')
    return null
  }, [])

  // Sign up function with proper loading and redirect
  const signUp = async (email: string, password: string, fullName: string): Promise<{ error: any }> => {
    setAuthLoading(true)
    try {
      console.log('Starting sign up process for:', email)
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          }
        }
      })

      if (error) {
        console.error('Sign up error:', error)
        return { error }
      }

      if (data?.user) {
        // console.log('User created, ensuring profile exists...', data.user.id)
        
        // Get the current session immediately
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session) {
          // console.log('Session available, ensuring profile exists...')
          // Ensure profile exists and is loaded
          const profileData = await ensureProfile(data.user.id, fullName, email)
          
          if (profileData) {
            // console.log('Profile ready, redirecting to dashboard...')
            // Set the user and profile state before redirecting
            setUser(data.user)
            setProfile(profileData)
            setSession(session)
            router.push('/dashboard')
          } else {
            console.error('Failed to create profile during signup')
            return { error: 'Failed to create user profile' }
          }
        } else {
          console.log('No session available, waiting for session establishment...')
          // Wait a bit for session to be established
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          const { data: { session: retrySession } } = await supabase.auth.getSession()
                  if (retrySession) {
          // console.log('Session established on retry, ensuring profile...')
          const profileData = await ensureProfile(data.user.id, fullName, email)
            
            if (profileData) {
              // console.log('Profile ready on retry, redirecting to dashboard...')
              setUser(data.user)
              setProfile(profileData)
              setSession(retrySession)
              router.push('/dashboard')
            } else {
              console.error('Failed to create profile during signup')
              return { error: 'Failed to create user profile' }
            }
          } else {
            console.error('Session still not available after retry')
            return { error: 'Failed to establish session after signup' }
          }
        }
      }

      return { error: null }
    } catch (error) {
      console.error('Unexpected sign up error:', error)
      return { error }
    } finally {
      setAuthLoading(false)
    }
  }

  // Sign in function with proper loading and redirect
  const signIn = async (email: string, password: string): Promise<{ error: any }> => {
    setAuthLoading(true)
    try {
      console.log('Starting sign in process for:', email)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        console.error('Sign in error:', error)
        return { error }
      }

      if (data?.user) {
        console.log('User signed in, ensuring profile exists...', data.user.id)
        
        // Get the current session immediately
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session) {
          // console.log('Session available, ensuring profile exists...')
          // Ensure profile exists and is loaded
          const fullName = data.user.user_metadata?.full_name || 'User'
          const profileData = await ensureProfile(data.user.id, fullName, data.user.email || email)
          
          if (profileData) {
            // console.log('Profile ready, redirecting to dashboard...')
            // Set the user and profile state before redirecting
            setUser(data.user)
            setProfile(profileData)
            setSession(session)
            router.push('/dashboard')
          } else {
            console.error('Failed to ensure profile during signin')
            return { error: 'Failed to load user profile' }
          }
        } else {
          console.log('No session available, waiting for session establishment...')
          // Wait a bit for session to be established
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          const { data: { session: retrySession } } = await supabase.auth.getSession()
          if (retrySession) {
            console.log('Session established on retry, ensuring profile...')
            const fullName = data.user.user_metadata?.full_name || 'User'
            const profileData = await ensureProfile(data.user.id, fullName, data.user.email || email)
            
            if (profileData) {
              // console.log('Profile ready on retry, redirecting to dashboard...')
              setUser(data.user)
              setProfile(profileData)
              setSession(retrySession)
              router.push('/dashboard')
            } else {
              return { error: 'Failed to load user profile' }
            }
          } else {
            console.error('Session still not available after retry')
            return { error: 'Failed to establish session after sign in' }
          }
        }
      }

      return { error: null }
    } catch (error) {
      console.error('Unexpected sign in error:', error)
      return { error }
    } finally {
      setAuthLoading(false)
    }
  }

  // Reset password function
  const resetPassword = async (email: string): Promise<{ error: any }> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })

      if (error) {
        return { error }
      }

      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  // Sign out function
  const signOut = async (): Promise<void> => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setProfile(null)
      setSession(null)
      router.push('/auth')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  // Get initial session and profile - only called once on mount
  const getInitialSession = useCallback(async () => {
    // Prevent duplicate calls using global flag
    if (globalInitialSessionFetched) {
      console.log('Initial session already fetched globally, skipping...')
      return
    }
    
    try {
      console.log('Getting initial session...')
      globalInitialSessionFetched = true
      initialSessionRef.current = true
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Error getting initial session:', error)
        // Clear any stale state on error
        setSession(null)
        setUser(null)
        setProfile(null)
        setLoading(false)
        return
      }
      
      // Validate session before proceeding
      if (session && session.user) {
        // Check if session is not expired
        const now = Math.floor(Date.now() / 1000)
        if (session.expires_at && session.expires_at < now) {
          console.log('Session expired, clearing stale auth state')
          setSession(null)
          setUser(null)
          setProfile(null)
          // Force clear expired session
          try {
            await supabase.auth.signOut()
          } catch (error) {
            console.error('Error clearing expired session:', error)
          }
          setLoading(false)
          return
        }
        
        console.log('Valid session found, setting session state only')
        setSession(session)
        setUser(session.user)
        // Do NOT fetch profile here - let SIGNED_IN handle it
      } else {
        console.log('No valid session found on mount')
        setSession(null)
        setUser(null)
        setProfile(null)
      }
    } catch (error) {
      console.error('Unexpected error getting initial session:', error)
      // Clear state on any unexpected error
      setSession(null)
      setUser(null)
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }, [])

  // Listen for auth changes - optimized to prevent infinite loops and handle stale sessions
  useEffect(() => {
    // Prevent duplicate listener setup using global flag
    if (globalListenerSetup) {
      console.log('Auth state change listener already set up globally, skipping...')
      return
    }
    
    console.log('Setting up auth state change listener...')
    globalListenerSetup = true
    listenerSetupRef.current = true
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.id)
        
        // Handle INITIAL_SESSION event to clear stale sessions
        if (event === 'INITIAL_SESSION') {
          if (!session) {
            console.log('INITIAL_SESSION: No valid session found, clearing stale auth state')
            // Clear any stale state and ensure user is signed out
            setSession(null)
            setUser(null)
            setProfile(null)
            // Force clear any stale cookies/localStorage by calling signOut
            try {
              await supabase.auth.signOut()
              console.log('Stale session cleared successfully')
            } catch (error) {
              console.error('Error clearing stale session:', error)
            }
            return
          } else {
            console.log('INITIAL_SESSION: Valid session found, proceeding normally')
          }
        }
        
        // Handle SIGNED_IN event with profile fetch and redirect
        if (event === 'SIGNED_IN' && session?.user) {
          // Prevent duplicate SIGNED_IN processing
          if (globalSignInProcessed) {
            console.log('SIGNED_IN already processed globally, skipping...')
            return
          }
          
          globalSignInProcessed = true
          console.log('Processing SIGNED_IN event...')
          
          // Log session activity to user_sessions table
          try {
            await supabase.from('user_sessions').insert({
              user_id: session.user.id,
              session_data: {
                event: 'SIGNED_IN',
                device: 'web',
                user_agent: navigator.userAgent
              }
            })
            console.log('Session SIGNED_IN logged to user_sessions table')
          } catch (error) {
            console.error('Failed to log session activity to user_sessions table:', error)
            // Continue execution even if logging fails
          }
          
          // Set session state
          setSession(session)
          setUser(session.user)
          
          // Always call ensureProfile with timeout fallback
          try {
            // console.log('SIGNED_IN: Ensuring profile exists...')
            const fullName = session.user.user_metadata?.full_name || 'User'
            
            // Create a timeout promise for profile fetch
            const profilePromise = ensureProfile(session.user.id, fullName, session.user.email || '')
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Profile fetch timeout')), 5000)
            )
            
            // Race between profile fetch and timeout
            const profileData = await Promise.race([profilePromise, timeoutPromise]) as Profile | null
            
            if (profileData) {
              setProfile(profileData)
              // console.log('Profile ready, redirecting to dashboard...')
              router.push('/dashboard')
            } else {
              console.error('Failed to ensure profile during SIGNED_IN')
              // Still redirect even if profile fails
              // console.log('Profile failed, redirecting to dashboard anyway...')
              router.push('/dashboard')
            }
          } catch (error: any) {
            if (error?.message === 'Profile fetch timeout') {
              // console.log('Profile fetch timeout, forcing redirect')
            } else {
              console.error('Error ensuring profile during SIGNED_IN:', error)
            }
            // Always redirect to dashboard, even on error
            router.push('/dashboard')
          }
          
          return // Exit early to prevent duplicate processing
        }
        
        // Handle SIGNED_OUT event
        if (event === 'SIGNED_OUT' && session?.user) {
          // Log session activity to user_sessions table
          try {
            await supabase.from('user_sessions').insert({
              user_id: session.user.id,
              session_data: {
                event: 'SIGNED_OUT',
                device: 'web'
              }
            })
            console.log('Session SIGNED_OUT logged to user_sessions table')
          } catch (error) {
            console.error('Failed to log session activity to user_sessions table:', error)
            // Continue execution even if logging fails
          }
          
          // Clear state
          setSession(null)
          setUser(null)
          setProfile(null)
          
          // Reset global flags for new sign-ins
          globalSignInProcessed = false
          globalInitialSessionFetched = false
          
          return // Exit early to prevent duplicate processing
        }
        
        // Handle other session state updates (non-auth events)
        if (session?.user?.id !== user?.id) {
          setSession(session)
          setUser(session?.user ?? null)
          
          if (!session?.user) {
            setProfile(null)
          }
        }
      }
    )

    return () => {
      subscription.unsubscribe()
      listenerSetupRef.current = false
      // Don't reset global flag on cleanup to handle Fast Refresh
    }
  }, [ensureProfile, router, user?.id]) // Add missing dependencies for proper hook behavior

  // Get initial session only once on mount
  useEffect(() => {
    if (!initialSessionRef.current) {
      getInitialSession()
    }
  }, [getInitialSession]) // Add getInitialSession dependency for proper hook behavior

  const value = {
    user,
    profile,
    session,
    loading,
    authLoading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    createProfile
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
