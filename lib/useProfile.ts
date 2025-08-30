import { useState, useEffect } from 'react'
import { useAuth } from './auth-context'

export function useProfile() {
  const { user, profile } = useAuth()
  const [userFullName, setUserFullName] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false) // Changed to false since we're not loading

  useEffect(() => {
    if (!user?.id) {
      return
    }

    // Use profile data from auth context immediately if available
    if (profile?.full_name) {
      setUserFullName(profile.full_name)
      return
    }

    // Fallback to user metadata if profile is not available
    if (user.user_metadata?.full_name) {
      setUserFullName(user.user_metadata.full_name)
      return
    }

    // Final fallback
    setUserFullName('User')
  }, [user, profile])

  return {
    userFullName,
    isLoading,
    profile
  }
}
