'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import { useAuth, createUserData } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { PLANS } from '@/lib/stripe'


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

  // Pricing plans data from Stripe configuration
  const pricingPlans = [
    {
      name: PLANS.starter.name,
      price: PLANS.starter.price,
      period: PLANS.starter.period,
      description: 'Access to fundamental task management features.',
      features: PLANS.starter.features,
      cta: 'Start Free Trial',
      popular: true,
      planId: 'starter'
    },
    {
      name: PLANS.pro.name,
      price: PLANS.pro.price,
      period: PLANS.pro.period,
      description: 'Unlimited tasks and project management capabilities.',
      features: PLANS.pro.features,
      cta: 'Start Free Trial',
      popular: false,
      planId: 'pro'
    }
  ]

  // Subscription handling
  const [isLoading, setIsLoading] = useState<string | null>(null)

  const handleSubscribe = async (planId: string) => {
    if (!userData.id) return

    setIsLoading(planId)
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userData.id,
          plan: planId,
        }),
      })

      const data = await response.json()

      if (data.error) {
        console.error('Checkout error:', data.error)
        alert('Failed to start checkout. Please try again.')
        return
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Subscription error:', error)
      alert('Failed to start subscription. Please try again.')
    } finally {
      setIsLoading(null)
    }
  }



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



        {/* Pricing Plans Grid */}
        <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto mb-12">
          {pricingPlans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className={`relative bg-white border-2 border-[#ADB3BD] rounded-xl p-8 transition-all duration-300 hover:scale-105 hover:shadow-xl flex flex-col h-full ${
                plan.popular ? 'ring-2 ring-[#111C59] shadow-xl border-[#111C59]' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                                  <span className="bg-[#111C59] text-white px-4 py-2 rounded-full text-sm font-semibold">
                  Most Popular
                </span>
                </div>
              )}
              
              {/* Plan Header */}
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
              
              {/* Features List */}
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
              
              {/* Action Button */}
              <div className="mt-auto">
                <button 
                  onClick={() => handleSubscribe(plan.planId)}
                  disabled={isLoading === plan.planId}
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-300 ${
                    plan.popular
                      ? 'bg-[#111C59] text-white hover:bg-[#0F1626]'
                      : 'bg-[#4F5F73] text-white hover:bg-[#111C59]'
                  } ${isLoading === plan.planId ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isLoading === plan.planId ? 'Processing...' : plan.cta}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
        

      </div>
    </Layout>
  )
}
