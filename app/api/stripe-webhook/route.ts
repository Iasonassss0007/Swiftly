import { NextRequest, NextResponse } from 'next/server'
import { stripe, validateStripeConfig } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

// Initialize Supabase client with service role key for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Configure raw body parsing for webhook signature verification
export const config = {
  api: {
    bodyParser: false,
  },
}

async function buffer(request: NextRequest): Promise<Buffer> {
  const chunks = []
  for await (const chunk of request.body as any) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }
  return Buffer.concat(chunks)
}

export async function POST(request: NextRequest) {
  try {
    // Validate Stripe configuration
    validateStripeConfig()

    const body = await buffer(request)
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe signature' },
        { status: 400 }
      )
    }

    // Verify webhook signature
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      )
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    console.log('Processing webhook event:', event.type)

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session)
        break

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  try {
    if (session.mode !== 'subscription') return

    const userId = session.metadata?.userId
    const plan = session.metadata?.plan

    if (!userId || !plan) {
      console.error('Missing metadata in checkout session:', session.id)
      return
    }

    // Get subscription details
    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string
    )

    // Update profile with subscription information
    const { error } = await supabase
      .from('profiles')
      .update({
        subscription_status: subscription.status,
        subscription_tier: plan,
        subscription_id: subscription.id,
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      })
      .eq('id', userId)

    if (error) {
      console.error('Error updating profile after checkout:', error)
    } else {
      console.log(`Profile updated for user ${userId} with ${plan} subscription`)
    }

  } catch (error) {
    console.error('Error handling checkout session completed:', error)
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  try {
    const userId = subscription.metadata?.userId
    const plan = subscription.metadata?.plan

    if (!userId || !plan) {
      console.error('Missing metadata in subscription:', subscription.id)
      return
    }

    // Update profile with new subscription status
    const { error } = await supabase
      .from('profiles')
      .update({
        subscription_status: subscription.status,
        subscription_tier: plan,
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      })
      .eq('id', userId)

    if (error) {
      console.error('Error updating profile after subscription update:', error)
    } else {
      console.log(`Profile updated for user ${userId} with ${plan} subscription status: ${subscription.status}`)
    }

  } catch (error) {
    console.error('Error handling subscription updated:', error)
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    const userId = subscription.metadata?.userId

    if (!userId) {
      console.error('Missing userId metadata in deleted subscription:', subscription.id)
      return
    }

    // Clear subscription information from profile
    const { error } = await supabase
      .from('profiles')
      .update({
        subscription_status: null,
        subscription_tier: null,
        subscription_id: null,
        current_period_end: null,
      })
      .eq('id', userId)

    if (error) {
      console.error('Error clearing profile subscription data:', error)
    } else {
      console.log(`Subscription data cleared for user ${userId}`)
    }

  } catch (error) {
    console.error('Error handling subscription deleted:', error)
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  try {
    if (!invoice.subscription) return

    const subscription = await stripe.subscriptions.retrieve(
      invoice.subscription as string
    )

    const userId = subscription.metadata?.userId
    if (!userId) return

    // Update profile with failed payment status
    const { error } = await supabase
      .from('profiles')
      .update({
        subscription_status: subscription.status,
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      })
      .eq('id', userId)

    if (error) {
      console.error('Error updating profile after payment failed:', error)
    } else {
      console.log(`Profile updated for user ${userId} after payment failed`)
    }

  } catch (error) {
    console.error('Error handling payment failed:', error)
  }
}
