'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import CleanAIChat from '@/components/CleanAIChat'
import { useAuth, createUserData } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'

export default function AIPage() {
  const { user, profile, loading } = useAuth()
  const [sessionLoading, setSessionLoading] = useState(true)
  const router = useRouter()

  // Session guard - check for valid session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          router.push('/auth')
          return
        }
        setSessionLoading(false)
      } catch (error) {
        console.error('Error checking session:', error)
        router.push('/auth')
      }
    }

    checkSession()
  }, [router])

  // Auth context loading check
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth')
    }
  }, [user, loading, router])

  // Show loading state while checking session or auth context
  if (loading || sessionLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#111C59]/20 border-t-[#111C59] rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-[#4F5F73] text-sm">Loading Swiftly AI...</p>
        </div>
      </div>
    )
  }

  // Show loading while redirecting
  if (!user) {
    return null
  }

  // Use real user data from auth context with proper fallbacks
  const userData = createUserData(user, profile)

  // Create enhanced user context for AI with preferences
  const userContext = {
    user_id: userData.id,
    preferences: {
      name: userData.name,
      email: userData.email,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    },
    tasks: [], // Will be populated by AI context provider
    reminders: [] // Will be populated by AI context provider
  }

  return (
    <Layout user={userData}>
      <div className="h-full flex flex-col bg-[#F8FAFC]">
        {/* Simple Header */}
        <div className="border-b border-gray-100 px-6 py-4 flex-shrink-0">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-900">Swiftly AI</h1>
            <span className="ml-2 text-sm text-gray-500">Your Admin Life Concierge</span>
          </div>
        </div>

        {/* Chat Container */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Clean Minimal Chat Interface */}
          <CleanAIChat 
            userContext={userContext} 
            className="h-full"
          />
        </div>
      </div>
    </Layout>
  )
}
