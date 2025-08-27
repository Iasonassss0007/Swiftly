'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import { useAuth, createUserData } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'

// Define the same plans as shown on the homepage
const plans = [
  {
    name: 'Starter Plan',
    price: '$5',
    period: '/month',
    description: 'Access to fundamental task management features.',
    features: [
      'Access to fundamental task management features',
      'Calendar overview for basic scheduling',
      'Up to 20 AI-generated suggestions per month',
      'Standard email support'
    ],
    cta: 'Start Free Trial',
    popular: true,
    current: true // Mark as current plan for demo
  },
  {
    name: 'Pro Plan',
    price: '$15',
    period: '/month',
    description: 'Unlimited tasks and project management capabilities.',
    features: [
      'Unlimited tasks and project management capabilities',
      'Comprehensive calendar integration',
      'Up to 200 AI-generated suggestions per month',
      'Priority email support',
      'Custom reminders and notifications'
    ],
    cta: 'Upgrade to Pro',
    popular: false,
    current: false
  },
  {
    name: 'Enterprise Plan',
    price: 'Custom',
    period: '',
    description: 'Contact the sales team to obtain a tailored solution.',
    features: [
      'Includes all features of the Pro Plan',
      'Advanced team collaboration tools',
      'Unlimited AI-generated suggestions',
      'Dedicated account manager for account support',
      'Priority assistance'
    ],
    cta: 'Contact Sales',
    popular: false,
    current: false
  }
]

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
            Choose the plan that fits your workflow. Start free and scale as you grow.
          </p>
        </motion.div>

        {/* Current Plan Information */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto mb-12"
        >
          <div className="bg-white border-2 border-[#111C59] rounded-xl p-8 shadow-lg">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-[#0F1626] mb-2">
                Current Plan: Starter Plan
              </h2>
              <p className="text-[#4F5F73]">
                You&apos;re currently on the Starter Plan
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
                    Access to fundamental task management features
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Calendar overview for basic scheduling
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Up to 20 AI-generated suggestions per month
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Standard email support
                  </li>
                </ul>
              </div>
              
              <div className="bg-[#F8FAFC] rounded-lg p-4">
                <h3 className="font-semibold text-[#0F1626] mb-2">Account Details</h3>
                <div className="space-y-2 text-[#4F5F73]">
                  <p><span className="font-medium">Email:</span> {userData.email}</p>
                  <p><span className="font-medium">Member since:</span> {userData.memberSince || 'Recently'}</p>
                  <p><span className="font-medium">Status:</span> Active</p>
                  <p><span className="font-medium">Plan:</span> Starter Plan</p>
                  <p><span className="font-medium">Next billing:</span> January 2025</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Available Plans Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="mb-12"
        >
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-[#0F1626] mb-4">
              Available Plans
            </h2>
            <p className="text-lg text-[#4F5F73]">
              All plans include a 14-day free trial • No credit card required
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`relative bg-white border-2 rounded-xl p-8 transition-all duration-300 hover:scale-105 hover:shadow-xl flex flex-col h-full ${
                  plan.current 
                    ? 'border-[#111C59] ring-2 ring-[#111C59] shadow-xl' 
                    : plan.popular 
                    ? 'border-[#111C59] ring-2 ring-[#111C59] shadow-xl' 
                    : 'border-[#ADB3BD]'
                }`}
              >
                {plan.current && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-[#111C59] text-white px-4 py-2 rounded-full text-sm font-semibold">
                      Current Plan
                    </span>
                  </div>
                )}
                {plan.popular && !plan.current && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-[#4F5F73] text-white px-4 py-2 rounded-full text-sm font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-[#0F1626] mb-4">
                    {plan.name}
                  </h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-[#0F1626]">
                      {plan.price}
                    </span>
                    <span className="text-lg text-[#4F5F73]">
                      {plan.period}
                    </span>
                  </div>
                  <p className="text-[#4F5F73]">
                    {plan.description}
                  </p>
                </div>
                
                <ul className="space-y-3 mb-8 flex-grow">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center text-[#0F1626]">
                      <svg className="w-5 h-5 text-[#4F5F73] mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
                
                <div className="mt-auto">
                  <button 
                    className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-300 ${
                      plan.current
                        ? 'bg-[#4F5F73] text-white cursor-not-allowed'
                        : plan.popular
                        ? 'bg-[#111C59] text-white hover:bg-[#0F1626]'
                        : 'bg-[#4F5F73] text-white hover:bg-[#111C59]'
                    }`}
                    disabled={plan.current}
                  >
                    {plan.current ? 'Current Plan' : plan.cta}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Additional Information */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <div className="bg-gradient-to-r from-[#111C59] to-[#4F5F73] rounded-xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">
              Need Help with Billing?
            </h3>
            <p className="text-lg mb-6 opacity-90">
              Our support team is here to help with any billing questions or plan changes.
            </p>
            <div className="space-y-4">
              <div className="bg-white/10 rounded-lg p-4 inline-block">
                <p className="text-sm opacity-90">
                  📧 Email: support@swiftly.com
                </p>
              </div>
              <div className="bg-white/10 rounded-lg p-4 inline-block">
                <p className="text-sm opacity-90">
                  💬 Live Chat: Available 24/7
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  )
}
