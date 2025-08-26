import { NextRequest, NextResponse } from 'next/server'
import { stripe, validateStripeConfig, getStripePriceId, type SubscriptionTier } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client with service role key for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    // Validate Stripe configuration
    validateStripeConfig()

    // Parse request body
    const { userId, plan } = await request.json()

    // Validate input
    if (!userId || !plan) {
      return NextResponse.json(
        { error: 'Missing required fields: userId and plan' },
        { status: 400 }
      )
    }

    if (!['starter', 'pro'].includes(plan)) {
      return NextResponse.json(
        { error: 'Invalid plan. Must be "starter" or "pro"' },
        { status: 400 }
      )
    }

    // Get Stripe price ID for the selected plan
    const priceId = getStripePriceId(plan as SubscriptionTier)
    if (!priceId) {
      return NextResponse.json(
        { error: 'Invalid plan configuration' },
        { status: 500 }
      )
    }

    // Get user profile from Supabase
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      console.error('Error fetching profile:', profileError)
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    let customerId = profile.stripe_customer_id

    // Create Stripe customer if one doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile.email,
        metadata: {
          supabase_user_id: userId,
        },
      })

      customerId = customer.id

      // Update profile with Stripe customer ID
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId)

      if (updateError) {
        console.error('Error updating profile with customer ID:', updateError)
        // Continue anyway - customer was created in Stripe
      }
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?canceled=true`,
      metadata: {
        userId,
        plan,
        supabase_user_id: userId,
      },
      subscription_data: {
        metadata: {
          userId,
          plan,
          supabase_user_id: userId,
        },
      },
    })

    return NextResponse.json({ sessionId: session.id, url: session.url })

  } catch (error) {
    console.error('Checkout error:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
