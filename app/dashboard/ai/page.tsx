'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
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
          <div className="w-16 h-16 border-4 border-[#111C59]/20 border-t-[#111C59] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#4F5F73]">Loading AI Chat...</p>
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

  return (
    <Layout user={userData}>
      <div className="max-w-7xl mx-auto">
        <div className="bg-white/95 backdrop-blur-sm rounded-xl border border-[#ADB3BD]/30 p-8 text-center shadow-lg">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-[#ADB3BD]/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-[#ADB3BD]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold text-[#0F1626] mb-2">AI Chat</h1>
            <p className="text-[#4F5F73] mb-4">
              Chat with Swiftly&apos;s AI assistant for help and insights.
            </p>
            <p className="text-sm text-[#4F5F73]/80">
              AI chat features coming soon.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  )
}
