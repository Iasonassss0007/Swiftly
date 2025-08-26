# Stripe Subscription Integration for Swiftly App

This guide covers the complete integration of Stripe subscription payments with your Supabase + Next.js Swiftly application.

## 🚀 What's Been Implemented

### ✅ Backend Infrastructure
- **Stripe Client Setup** (`lib/stripe.ts`) - Initializes Stripe with proper configuration
- **Checkout API** (`app/api/checkout/route.ts`) - Creates Stripe checkout sessions
- **Webhook Handler** (`app/api/stripe-webhook/route.ts`) - Processes Stripe events
- **Database Schema** - Added subscription columns to profiles table

### ✅ Frontend Integration
- **Updated Billing Page** - Now integrates with Stripe checkout
- **Subscription Buttons** - "Start Free Trial" buttons for Starter and Pro plans
- **Loading States** - Proper UX during subscription processing

### ✅ Security Features
- **Webhook Signature Verification** - Ensures webhook authenticity
- **Service Role Authentication** - Secure database updates
- **Environment Variable Validation** - Prevents misconfiguration

## 📋 Prerequisites

Before starting, ensure you have:

1. **Stripe Account** - [Sign up at stripe.com](https://stripe.com)
2. **Supabase Project** - With `stripe` extension enabled
3. **Next.js App** - Version 14+ with App Router
4. **Node.js** - Version 18+ recommended

## 🔧 Step-by-Step Setup

### 1. Install Dependencies

```bash
npm install stripe
# or
yarn add stripe
# or
pnpm add stripe
```

### 2. Stripe Dashboard Setup

#### Create Products and Prices
1. Go to [Stripe Dashboard > Products](https://dashboard.stripe.com/products)
2. Create two products:
   - **Starter Plan** ($5/month)
   - **Pro Plan** ($15/month)
3. For each product, create a recurring price:
   - Billing model: **Standard pricing**
   - Price: **$5.00** and **$15.00**
   - Billing period: **Monthly**
   - **Copy the Price IDs** (start with `price_`)

#### Get API Keys
1. Go to [Stripe Dashboard > Developers > API keys](https://dashboard.stripe.com/apikeys)
2. Copy your **Publishable key** and **Secret key**
3. Use **Test keys** for development, **Live keys** for production

#### Set Up Webhook Endpoint
1. Go to [Stripe Dashboard > Developers > Webhooks](https://dashboard.stripe.com/webhooks)
2. Click **Add endpoint**
3. Set endpoint URL: `https://yourdomain.com/api/stripe-webhook`
4. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
5. **Copy the webhook signing secret** (starts with `whsec_`)

### 3. Environment Variables

Create or update your `.env.local` file:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLIC_KEY=pk_test_your_stripe_public_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Stripe Price IDs (get these from your Stripe Dashboard)
STRIPE_PRICE_STARTER=price_your_starter_plan_price_id_here
STRIPE_PRICE_PRO=price_your_pro_plan_price_id_here

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Database Schema Update

Run this SQL in your Supabase SQL editor:

```sql
-- Stripe Subscription Migration for Swiftly App
-- Run this in your Supabase SQL editor

-- Add subscription columns to profiles table
ALTER TABLE api.profiles 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS subscription_id TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ DEFAULT NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id ON api.profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status ON api.profiles(subscription_status);

-- Add comments for documentation
COMMENT ON COLUMN api.profiles.stripe_customer_id IS 'Stripe customer ID for subscription management';
COMMENT ON COLUMN api.profiles.subscription_status IS 'Current subscription status: active, canceled, trialing, past_due, unpaid, or null';
COMMENT ON COLUMN api.profiles.subscription_tier IS 'Current subscription tier: starter, pro, or null';
COMMENT ON COLUMN api.profiles.subscription_id IS 'Stripe subscription ID for webhook processing';
COMMENT ON COLUMN api.profiles.current_period_end IS 'When the current billing period ends';

-- Grant necessary permissions (adjust based on your RLS policies)
-- This ensures the webhook can update profiles
GRANT UPDATE ON api.profiles TO authenticated;
GRANT UPDATE ON api.profiles TO service_role;
```

### 5. Enable Stripe Extension

Ensure the Stripe extension is enabled in your Supabase project:

1. Go to [Supabase Dashboard > Extensions](https://supabase.com/dashboard/project/_/extensions)
2. Find **Stripe** extension
3. Click **Enable** if not already enabled

## 🧪 Testing the Integration

### 1. Test Checkout Flow
1. Start your development server: `npm run dev`
2. Navigate to `/dashboard/billing`
3. Click "Start Free Trial" on any plan
4. You should be redirected to Stripe Checkout
5. Use Stripe test card: `4242 4242 4242 4242`
6. Complete the checkout process

### 2. Test Webhook
1. Use [Stripe CLI](https://stripe.com/docs/stripe-cli) to test webhooks locally:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe-webhook
   ```
2. Complete a test checkout
3. Check your database - profile should be updated with subscription data

### 3. Verify Database Updates
Check your `api.profiles` table for:
- `stripe_customer_id` - Should be populated
- `subscription_status` - Should be "active"
- `subscription_tier` - Should be "starter" or "pro"
- `subscription_id` - Should be populated

## 🔒 Security Considerations

### Webhook Security
- **Always verify webhook signatures** using `STRIPE_WEBHOOK_SECRET`
- **Use HTTPS** in production for webhook endpoints
- **Validate webhook events** before processing

### Database Security
- **Use service role key** only in webhook handlers
- **Implement RLS policies** to protect user data
- **Never expose service role key** to the frontend

### Environment Variables
- **Keep secrets secure** - never commit `.env.local` to version control
- **Use different keys** for development and production
- **Rotate keys regularly** for production environments

## 🚨 Common Issues & Solutions

### Issue: "Missing required Stripe environment variables"
**Solution**: Ensure all environment variables are set in `.env.local`

### Issue: "Webhook signature verification failed"
**Solution**: Check that `STRIPE_WEBHOOK_SECRET` matches your webhook endpoint

### Issue: "User profile not found"
**Solution**: Ensure the user exists in the `api.profiles` table

### Issue: "Invalid plan configuration"
**Solution**: Verify `STRIPE_PRICE_STARTER` and `STRIPE_PRICE_PRO` are correct

### Issue: "Checkout session creation failed"
**Solution**: Check Stripe dashboard for any account restrictions or configuration issues

## 📱 Frontend Customization

### Adding Subscription Status Display
You can enhance the billing page to show current subscription status:

```tsx
// Add this to your billing page
const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null)

useEffect(() => {
  if (profile?.subscription_status) {
    setSubscriptionStatus(profile.subscription_status)
  }
}, [profile])

// Display current subscription
{subscriptionStatus && (
  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
    <p className="text-green-800">
      Current Plan: {profile?.subscription_tier} ({subscriptionStatus})
    </p>
  </div>
)}
```

### Adding Plan Upgrade/Downgrade
Implement customer portal integration for existing subscribers:

```tsx
const handleManageSubscription = async () => {
  const response = await fetch('/api/create-portal-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: userData.id }),
  })
  
  const { url } = await response.json()
  window.location.href = url
}
```

## 🚀 Production Deployment

### 1. Environment Variables
- Update all Stripe keys to **live keys**
- Set `NEXT_PUBLIC_APP_URL` to your production domain
- Ensure `STRIPE_WEBHOOK_SECRET` is for production webhook

### 2. Webhook Endpoint
- Update webhook URL to your production domain
- Test webhook delivery in Stripe dashboard
- Monitor webhook failures and retries

### 3. Database
- Run the schema migration on production database
- Test subscription flow with real payment methods
- Monitor database performance with new columns

### 4. Monitoring
- Set up Stripe dashboard alerts for failed payments
- Monitor webhook delivery and processing
- Track subscription metrics and revenue

## 📚 Additional Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Supabase Stripe Extension](https://supabase.com/docs/guides/extensions/stripe)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)

## 🤝 Support

If you encounter issues:

1. **Check Stripe Dashboard** for error logs
2. **Verify environment variables** are correctly set
3. **Test with Stripe CLI** for local development
4. **Check browser console** for frontend errors
5. **Review server logs** for backend issues

## 📝 Changelog

- **v1.0.0** - Initial Stripe integration with subscription support
- Added checkout API route
- Added webhook handler
- Updated billing page with Stripe integration
- Added database schema for subscriptions

---

**Happy coding! 🎉** Your Swiftly app now has professional subscription billing powered by Stripe.
