-- Migration: Auto-log user sessions in Supabase
-- This migration creates a system to automatically capture user session data
-- whenever a new session is created in Supabase auth.sessions table

-- =====================================================
-- Step 1: Drop existing objects if they exist
-- =====================================================

-- Drop the trigger first (if it exists) to avoid dependency issues
DROP TRIGGER IF EXISTS trigger_log_user_session ON auth.sessions;

-- Drop the function (if it exists)
DROP FUNCTION IF EXISTS api.log_user_session();

-- Drop the table (if it exists) to recreate with new structure
DROP TABLE IF EXISTS api.user_sessions CASCADE;

-- =====================================================
-- Step 2: Create/Update user_sessions table with best practices
-- =====================================================

CREATE TABLE api.user_sessions (
    -- Primary key using UUID for better distribution and security
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Reference to the authenticated user
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- When the session was created
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- IP address of the client (optional, for security monitoring)
    ip_address INET,
    
    -- User agent string (optional, for analytics and debugging)
    user_agent TEXT,
    
    -- When the session expires (optional, for session management)
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Additional metadata as JSONB for flexibility
    metadata JSONB DEFAULT '{}'::jsonb
);

-- =====================================================
-- Step 3: Create indexes for performance
-- =====================================================

-- Index on user_id for fast lookups by user
CREATE INDEX idx_user_sessions_user_id ON api.user_sessions(user_id);

-- Index on created_at for time-based queries
CREATE INDEX idx_user_sessions_created_at ON api.user_sessions(created_at);

-- Index on expires_at for session cleanup queries
CREATE INDEX idx_user_sessions_expires_at ON api.user_sessions(expires_at);

-- Composite index for user + time queries
CREATE INDEX idx_user_sessions_user_created ON api.user_sessions(user_id, created_at);

-- =====================================================
-- Step 4: Create the session logging function
-- =====================================================

CREATE OR REPLACE FUNCTION api.log_user_session()
RETURNS TRIGGER AS $$
DECLARE
    user_agent_text TEXT;
    client_ip INET;
BEGIN
    -- Get the client IP address
    -- inet_client_addr() returns the IP address of the client that initiated the connection
    client_ip := inet_client_addr();
    
    -- Try to extract user agent from request headers
    -- current_setting('request.headers') returns the headers as a JSON string
    -- We'll extract the user-agent header if it exists
    BEGIN
        user_agent_text := (
            SELECT value::text 
            FROM jsonb_each_text(current_setting('request.headers', true)::jsonb)
            WHERE key ILIKE '%user-agent%'
            LIMIT 1
        );
    EXCEPTION
        -- If headers are not available or malformed, set to NULL
        WHEN OTHERS THEN
            user_agent_text := NULL;
    END;
    
    -- Insert the session record into our user_sessions table
    INSERT INTO api.user_sessions (
        user_id,
        created_at,
        ip_address,
        user_agent,
        expires_at,
        metadata
    ) VALUES (
        NEW.user_id,                    -- User ID from the auth.sessions table
        NOW(),                          -- Current timestamp
        client_ip,                      -- Client IP address
        user_agent_text,                -- User agent string
        NEW.expires_at,                 -- Expiration from auth.sessions
        jsonb_build_object(             -- Additional metadata
            'session_id', NEW.id,
            'auth_session_created', NEW.created_at,
            'auth_session_updated', NEW.updated_at
        )
    );
    
    -- Return the NEW record to continue the trigger
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment to explain the function
COMMENT ON FUNCTION api.log_user_session() IS 
'Automatically logs user sessions when new auth sessions are created. 
Captures user_id, IP address, user agent, and session metadata.';

-- =====================================================
-- Step 5: Create the trigger on auth.sessions
-- =====================================================

-- Create trigger that fires AFTER INSERT on auth.sessions
-- This ensures the auth session is fully created before we log it
CREATE TRIGGER trigger_log_user_session
    AFTER INSERT ON auth.sessions
    FOR EACH ROW
    EXECUTE FUNCTION api.log_user_session();

-- Add comment to explain the trigger
COMMENT ON TRIGGER trigger_log_user_session ON auth.sessions IS 
'Automatically logs user session data whenever a new auth session is created.';

-- =====================================================
-- Step 6: Enable Row Level Security (RLS)
-- =====================================================

-- Enable RLS on the user_sessions table
ALTER TABLE api.user_sessions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- Step 7: Create RLS policies for security
-- =====================================================

-- Policy: Users can view their own sessions
CREATE POLICY "Users can view own sessions" ON api.user_sessions
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own sessions (for manual logging if needed)
CREATE POLICY "Users can insert own sessions" ON api.user_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own sessions
CREATE POLICY "Users can update own sessions" ON api.user_sessions
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own sessions
CREATE POLICY "Users can delete own sessions" ON api.user_sessions
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- Step 8: Grant necessary permissions
-- =====================================================

-- Grant usage on the api schema to authenticated users
GRANT USAGE ON SCHEMA api TO authenticated;

-- Grant all permissions on user_sessions table to authenticated users
GRANT ALL ON api.user_sessions TO authenticated;

-- Grant usage on sequences (if any) to authenticated users
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA api TO authenticated;

-- =====================================================
-- Step 9: Create helper functions for session management
-- =====================================================

-- Function to get user's session history
CREATE OR REPLACE FUNCTION api.get_user_sessions(
    user_uuid UUID DEFAULT auth.uid(),
    limit_count INTEGER DEFAULT 50
)
RETURNS TABLE (
    session_id UUID,
    created_at TIMESTAMP WITH TIME ZONE,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB
) AS $$
BEGIN
    -- Return user's sessions ordered by most recent first
    RETURN QUERY
    SELECT 
        us.id as session_id,
        us.created_at,
        us.ip_address,
        us.user_agent,
        us.expires_at,
        us.metadata
    FROM api.user_sessions us
    WHERE us.user_id = user_uuid
    ORDER BY us.created_at DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION api.cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete sessions that have expired
    DELETE FROM api.user_sessions 
    WHERE expires_at IS NOT NULL AND expires_at < NOW();
    
    -- Get the count of deleted rows
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments to helper functions
COMMENT ON FUNCTION api.get_user_sessions(UUID, INTEGER) IS 
'Returns a user''s session history with optional limit. Defaults to current user and 50 sessions.';

COMMENT ON FUNCTION api.cleanup_expired_sessions() IS 
'Removes expired sessions from the user_sessions table. Returns count of deleted sessions.';

-- =====================================================
-- Step 10: Verification queries (commented out)
-- =====================================================

/*
-- Test the automatic session logging:
-- 1. Sign in to your app (this will create a new auth session)
-- 2. Check if a record was automatically created in user_sessions

-- Verify the trigger was created:
SELECT 
    trigger_name, 
    event_manipulation, 
    action_statement 
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_log_user_session';

-- Check recent sessions:
SELECT * FROM api.user_sessions ORDER BY created_at DESC LIMIT 5;

-- Test the helper function:
SELECT * FROM api.get_user_sessions();

-- Check RLS policies:
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'user_sessions';
*/
