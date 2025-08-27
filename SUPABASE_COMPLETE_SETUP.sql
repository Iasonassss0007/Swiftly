-- =====================================================
-- Swiftly App - Complete Supabase Database Setup
-- =====================================================
-- This single file contains everything needed to set up
-- your Swiftly application database in Supabase.
-- 
-- Instructions:
-- 1. Copy this entire file
-- 2. Go to Supabase Dashboard → SQL Editor
-- 3. Paste and click Run
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. CREATE PROFILES TABLE
-- =====================================================

-- Drop table if exists (for development/testing)
DROP TABLE IF EXISTS api.profiles CASCADE;

-- Create profiles table
CREATE TABLE api.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON api.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON api.profiles(created_at);

-- =====================================================
-- 2. CREATE USER_SESSIONS TABLE
-- =====================================================

-- Drop table if exists (for development/testing)
DROP TABLE IF EXISTS api.user_sessions CASCADE;

-- Create user_sessions table
CREATE TABLE api.user_sessions (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_data JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON api.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_created_at ON api.user_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_data ON api.user_sessions USING GIN(session_data);

-- =====================================================
-- 3. ENABLE ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on profiles table
ALTER TABLE api.profiles ENABLE ROW LEVEL SECURITY;

-- Enable RLS on user_sessions table
ALTER TABLE api.user_sessions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 4. CREATE RLS POLICIES FOR PROFILES TABLE
-- =====================================================

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile" ON api.profiles
    FOR SELECT USING (auth.uid() = id);

-- Policy: Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON api.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile" ON api.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Policy: Users can delete their own profile
CREATE POLICY "Users can delete own profile" ON api.profiles
    FOR DELETE USING (auth.uid() = id);

-- =====================================================
-- 5. CREATE RLS POLICIES FOR USER_SESSIONS TABLE
-- =====================================================

-- Policy: Users can view their own sessions
CREATE POLICY "Users can view own sessions" ON api.user_sessions
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own sessions
CREATE POLICY "Users can insert own sessions" ON api.user_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own sessions
CREATE POLICY "Users can update own sessions" ON api.user_sessions
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own sessions
CREATE POLICY "Users can delete own sessions" ON api.user_sessions
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 6. CREATE TRIGGERS FOR UPDATED_AT TIMESTAMPS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION api.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for profiles table
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON api.profiles
    FOR EACH ROW
    EXECUTE FUNCTION api.update_updated_at_column();

-- Trigger for user_sessions table
CREATE TRIGGER update_user_sessions_updated_at
    BEFORE UPDATE ON api.user_sessions
    FOR EACH ROW
    EXECUTE FUNCTION api.update_updated_at_column();

-- =====================================================
-- 7. CREATE HELPER FUNCTIONS
-- =====================================================

-- Function to get user profile with error handling
CREATE OR REPLACE FUNCTION api.get_user_profile(user_uuid UUID)
RETURNS TABLE (
    id UUID,
    full_name TEXT,
    email TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.full_name,
        p.email,
        p.avatar_url,
        p.created_at,
        p.updated_at
    FROM api.profiles p
    WHERE p.id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create user profile if it doesn't exist
CREATE OR REPLACE FUNCTION api.ensure_user_profile(
    user_uuid UUID,
    user_full_name TEXT,
    user_email TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    profile_exists BOOLEAN;
BEGIN
    -- Check if profile exists
    SELECT EXISTS(SELECT 1 FROM api.profiles WHERE id = user_uuid) INTO profile_exists;
    
    -- If profile doesn't exist, create it
    IF NOT profile_exists THEN
        INSERT INTO api.profiles (id, full_name, email)
        VALUES (user_uuid, user_full_name, user_email);
        RETURN TRUE;
    END IF;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log user session activity
CREATE OR REPLACE FUNCTION api.log_user_session(
    user_uuid UUID,
    session_event TEXT,
    session_data JSONB DEFAULT '{}'
)
RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO api.user_sessions (user_id, session_data)
    VALUES (
        user_uuid,
        jsonb_build_object(
            'event', session_event,
            'timestamp', NOW(),
            'data', session_data
        )
    );
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 8. CREATE VIEWS FOR COMMON QUERIES
-- =====================================================

-- View for user profile with session count
CREATE OR REPLACE VIEW api.user_profile_summary AS
SELECT 
    p.id,
    p.full_name,
    p.email,
    p.avatar_url,
    p.created_at,
    p.updated_at,
    COUNT(us.id) as session_count,
    MAX(us.created_at) as last_session
FROM api.profiles p
LEFT JOIN api.user_sessions us ON p.id = us.user_id
GROUP BY p.id, p.full_name, p.email, p.avatar_url, p.created_at, p.updated_at;

-- View for recent user sessions
CREATE OR REPLACE VIEW api.recent_user_sessions AS
SELECT 
    us.id,
    us.user_id,
    p.full_name,
    us.session_data,
    us.created_at
FROM api.user_sessions us
JOIN api.profiles p ON us.user_id = p.id
ORDER BY us.created_at DESC;

-- =====================================================
-- 9. GRANT PERMISSIONS
-- =====================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA api TO authenticated;

-- Grant permissions on tables
GRANT ALL ON api.profiles TO authenticated;
GRANT ALL ON api.user_sessions TO authenticated;

-- Grant permissions on sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA api TO authenticated;

-- Grant permissions on functions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA api TO authenticated;

-- Grant permissions on views
GRANT SELECT ON api.user_profile_summary TO authenticated;
GRANT SELECT ON api.recent_user_sessions TO authenticated;

-- =====================================================
-- 10. VERIFICATION QUERIES
-- =====================================================

-- Verify tables were created
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'api' 
ORDER BY tablename;

-- Verify RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'api' 
ORDER BY tablename;

-- Verify policies were created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'api' 
ORDER BY tablename, policyname;

-- =====================================================
-- SETUP COMPLETE!
-- =====================================================
-- 
-- Your Supabase database is now configured with:
-- ✅ profiles table with RLS policies
-- ✅ user_sessions table with RLS policies  
-- ✅ Automatic timestamp updates
-- ✅ Helper functions for common operations
-- ✅ Views for data analysis
-- ✅ Proper permissions for authenticated users
--
-- Next steps:
-- 1. Test the authentication flow
-- 2. Verify RLS policies are working
-- 3. Check that profiles are created automatically
-- 4. Monitor user_sessions for activity logging
--
-- =====================================================
