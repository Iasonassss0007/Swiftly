-- =====================================================
-- Swiftly App - Quick Supabase Setup
-- =====================================================
-- Minimal setup for profiles and user_sessions tables
-- Run this in Supabase SQL Editor
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE IF NOT EXISTS api.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_sessions table
CREATE TABLE IF NOT EXISTS api.user_sessions (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_data JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE api.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE api.user_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view own profile" ON api.profiles
    FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON api.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON api.profiles
    FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can delete own profile" ON api.profiles
    FOR DELETE USING (auth.uid() = id);

-- Create RLS policies for user_sessions
CREATE POLICY "Users can view own sessions" ON api.user_sessions
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sessions" ON api.user_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sessions" ON api.user_sessions
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own sessions" ON api.user_sessions
    FOR DELETE USING (auth.uid() = user_id);

-- Grant permissions
GRANT USAGE ON SCHEMA api TO authenticated;
GRANT ALL ON api.profiles TO authenticated;
GRANT ALL ON api.user_sessions TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA api TO authenticated;

-- Setup complete! Your app should now work.
