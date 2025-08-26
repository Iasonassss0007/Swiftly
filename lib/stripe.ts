import Stripe from 'stripe'

// Initialize Stripe with secret key for server-side operations
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16', // Use latest stable API version
  typescript: true,
})

// Stripe price IDs from environment variables
export const STRIPE_PRICES = {
  starter: process.env.STRIPE_PRICE_STARTER!,
  pro: process.env.STRIPE_PRICE_PRO!,
} as const

// Subscription tier types
export type SubscriptionTier = 'starter' | 'pro' | null

// Subscription status types
export type SubscriptionStatus = 'active' | 'canceled' | 'trialing' | 'past_due' | 'unpaid' | null

// Plan configuration
export const PLANS = {
  starter: {
    name: 'Starter Plan',
    price: '$5',
    period: '/month',
    stripePriceId: STRIPE_PRICES.starter,
    features: [
      'Access to fundamental task management features',
      'Calendar overview for basic scheduling',
      'Up to 20 AI-generated suggestions per month',
      'Standard email support'
    ]
  },
  pro: {
    name: 'Pro Plan',
    price: '$15',
    period: '/month',
    stripePriceId: STRIPE_PRICES.pro,
    features: [
      'Unlimited tasks and project management capabilities',
      'Comprehensive calendar integration',
      'Up to 200 AI-generated suggestions per month',
      'Priority email support',
      'Custom reminders and notifications'
    ]
  }
} as const

// Validate that all required environment variables are set
export function validateStripeConfig() {
  const requiredVars = [
    'STRIPE_SECRET_KEY',
    'STRIPE_PUBLIC_KEY',
    'STRIPE_PRICE_STARTER',
    'STRIPE_PRICE_PRO',
    'STRIPE_WEBHOOK_SECRET'
  ]

  const missing = requiredVars.filter(varName => !process.env[varName])
  
  if (missing.length > 0) {
    throw new Error(`Missing required Stripe environment variables: ${missing.join(', ')}`)
  }
}

// Helper function to get plan details by tier
export function getPlanDetails(tier: SubscriptionTier) {
  if (!tier) return null
  return PLANS[tier]
}

// Helper function to get Stripe price ID by tier
export function getStripePriceId(tier: SubscriptionTier) {
  if (!tier) return null
  return PLANS[tier].stripePriceId
}
