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
