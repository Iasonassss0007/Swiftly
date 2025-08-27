'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import { useAuth, createUserData } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'

export default function BillingPage() {
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
          <p className="text-[#4F5F73]">Loading your billing information...</p>
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-[#111C59] to-[#4F5F73] bg-clip-text text-transparent mb-6">
            Billing & Plans
          </h1>
          <p className="text-xl text-[#4F5F73] max-w-3xl mx-auto">
            Your current plan and billing information.
          </p>
        </motion.div>

        {/* Current Plan Information */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto mb-8"
        >
          <div className="bg-white border-2 border-[#ADB3BD] rounded-xl p-8 shadow-lg">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-[#0F1626] mb-2">
                Current Plan: Free
              </h2>
              <p className="text-[#4F5F73]">
                You&apos;re currently on the free plan
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-[#F8FAFC] rounded-lg p-4">
                <h3 className="font-semibold text-[#0F1626] mb-2">Plan Features</h3>
                <ul className="space-y-2 text-[#4F5F73]">
                  <li className="flex items-center">
                    <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Basic task management
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Calendar integration
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    AI assistance
                  </li>
                </ul>
              </div>
              
              <div className="bg-[#F8FAFC] rounded-lg p-4">
                <h3 className="font-semibold text-[#0F1626] mb-2">Account Details</h3>
                <div className="space-y-2 text-[#4F5F73]">
                  <p><span className="font-medium">Email:</span> {userData.email}</p>
                  <p><span className="font-medium">Member since:</span> {userData.memberSince || 'Recently'}</p>
                  <p><span className="font-medium">Status:</span> Active</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Coming Soon Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-center"
        >
          <div className="bg-gradient-to-r from-[#111C59] to-[#4F5F73] rounded-xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">
              Premium Plans Coming Soon
            </h3>
            <p className="text-lg mb-6 opacity-90">
              We&apos;re working on premium features including advanced analytics, team collaboration, and priority support.
            </p>
            <div className="bg-white/10 rounded-lg p-4 inline-block">
              <p className="text-sm opacity-90">
                Stay tuned for updates on our premium offerings!
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  )
}
