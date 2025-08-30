'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import { useAuth, createUserData } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'

// Define the available plans
const plans = [
  {
    name: 'Starter Plan',
    price: '$11.99',
    period: '/month',
    description: 'Access to fundamental task management features.',
    features: [
      'Access to fundamental task management features',
      'Calendar overview for basic scheduling',
      'Up to 20 AI-generated suggestions per month',
      'Standard email support'
    ],
    cta: 'Start Free Trial',
    popular: true
  },
  {
    name: 'Pro Plan',
    price: '$29.99',
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
    popular: false
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
    popular: false
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
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 overflow-x-hidden">
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
            Choose the plan that fits your workflow.
          </p>
        </motion.div>

        {/* Pricing Plans Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="mb-12"
        >
          <div className="grid lg:grid-cols-3 gap-6 lg:gap-8 max-w-full mx-auto mt-6">
            {plans.map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`relative bg-white border-2 rounded-xl p-8 transition-all duration-300 hover:scale-105 hover:shadow-xl flex flex-col h-full mt-6 ${
                  plan.popular 
                    ? 'border-[#111C59] ring-2 ring-[#111C59] shadow-xl' 
                    : 'border-[#ADB3BD]'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="text-white px-4 py-2 rounded-full text-sm font-semibold" style={{backgroundColor: 'rgb(17 28 89 / var(--tw-bg-opacity, 1))'}}>
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
                      plan.popular
                        ? 'bg-[#111C59] text-white hover:bg-[#0F1626]'
                        : 'bg-[#4F5F73] text-white hover:bg-[#111C59]'
                    }`}
                  >
                    {plan.cta}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

      </div>
    </Layout>
  )
}
