import { useState, useEffect } from 'react'
import { useAuth } from './auth-context'
import { supabase } from './supabase'

export function useProfile() {
  const { user, profile } = useAuth()
  const [userFullName, setUserFullName] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.id) {
        setIsLoading(false)
        return
      }

      // If we already have profile data, use it immediately
      if (profile?.full_name) {
        setUserFullName(profile.full_name)
        setIsLoading(false)
        return
      }

      // Otherwise, fetch the profile
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single()

        if (error) {
          console.error('Error fetching profile:', error)
          // Fallback to user metadata or default
          setUserFullName(user.user_metadata?.full_name || 'User')
        } else if (data?.full_name) {
          setUserFullName(data.full_name)
        } else {
          // Fallback to user metadata or default
          setUserFullName(user.user_metadata?.full_name || 'User')
        }
      } catch (error) {
        console.error('Unexpected error fetching profile:', error)
        // Fallback to user metadata or default
        setUserFullName(user.user_metadata?.full_name || 'User')
      } finally {
        setIsLoading(false)
      }
    }

    loadProfile()
  }, [user, profile])

  return {
    userFullName,
    isLoading,
    profile
  }
}
