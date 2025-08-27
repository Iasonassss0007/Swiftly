-- Migration: Auto-log user sessions in Supabase (Alternative Approach)
-- This migration creates a system to capture user session data using a different method
-- since we cannot create triggers on auth.sessions due to permission restrictions

-- =====================================================
-- Step 1: Drop existing objects if they exist
-- =====================================================

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
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Session type to distinguish between different session events
    session_type TEXT DEFAULT 'login' CHECK (session_type IN ('login', 'refresh', 'logout', 'manual'))
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

-- Index on session_type for filtering
CREATE INDEX idx_user_sessions_type ON api.user_sessions(session_type);

-- =====================================================
-- Step 4: Create the session logging function
-- =====================================================

-- Function to manually log a user session (call this from your app)
CREATE OR REPLACE FUNCTION api.log_user_session_manual(
    p_user_id UUID DEFAULT auth.uid(),
    p_session_type TEXT DEFAULT 'login',
    p_user_agent TEXT DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
    session_uuid UUID;
    client_ip INET;
BEGIN
    -- Get the client IP address if not provided
    IF p_ip_address IS NULL THEN
        client_ip := inet_client_addr();
    ELSE
        client_ip := p_ip_address;
    END IF;
    
    -- Insert the session record into our user_sessions table
    INSERT INTO api.user_sessions (
        user_id,
        session_type,
        created_at,
        ip_address,
        user_agent,
        expires_at,
        metadata
    ) VALUES (
        p_user_id,                     -- User ID (defaults to current user)
        p_session_type,                -- Session type (login, refresh, logout, manual)
        NOW(),                         -- Current timestamp
        client_ip,                     -- Client IP address
        COALESCE(p_user_agent, current_setting('request.headers', true)::jsonb->>'user-agent'), -- User agent
        COALESCE(p_expires_at, NOW() + INTERVAL '24 hours'), -- Default 24 hour expiration
        p_metadata                     -- Additional metadata
    ) RETURNING id INTO session_uuid;
    
    RETURN session_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log session from client-side (simplified version)
CREATE OR REPLACE FUNCTION api.log_session_from_client(
    p_session_type TEXT DEFAULT 'login',
    p_user_agent TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
BEGIN
    -- This function can be called from client-side after successful authentication
    RETURN api.log_user_session_manual(
        auth.uid(),           -- Current authenticated user
        p_session_type,       -- Session type
        p_user_agent,         -- User agent from client
        NULL,                 -- IP will be captured server-side
        NULL,                 -- Default expiration
        p_metadata            -- Additional metadata
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log logout event
CREATE OR REPLACE FUNCTION api.log_user_logout(
    p_session_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Log a logout event
    INSERT INTO api.user_sessions (
        user_id,
        session_type,
        created_at,
        ip_address,
        user_agent,
        metadata
    ) VALUES (
        auth.uid(),                    -- Current user
        'logout',                      -- Logout event
        NOW(),                         -- Current timestamp
        inet_client_addr(),            -- Client IP
        current_setting('request.headers', true)::jsonb->>'user-agent', -- User agent
        jsonb_build_object(            -- Metadata
            'logout_time', NOW(),
            'related_session_id', p_session_id
        )
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments to functions
COMMENT ON FUNCTION api.log_user_session_manual(UUID, TEXT, TEXT, INET, TIMESTAMP WITH TIME ZONE, JSONB) IS 
'Manually logs a user session with full control over all parameters. Use this for server-side logging.';

COMMENT ON FUNCTION api.log_session_from_client(TEXT, TEXT, JSONB) IS 
'Simplified function for client-side session logging. Call this after successful authentication.';

COMMENT ON FUNCTION api.log_user_logout(UUID) IS 
'Logs a user logout event. Call this when user signs out.';

-- =====================================================
-- Step 5: Enable Row Level Security (RLS)
-- =====================================================

-- Enable RLS on the user_sessions table
ALTER TABLE api.user_sessions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- Step 6: Create RLS policies for security
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
-- Step 7: Grant necessary permissions
-- =====================================================

-- Grant usage on the api schema to authenticated users
GRANT USAGE ON SCHEMA api TO authenticated;

-- Grant all permissions on user_sessions table to authenticated users
GRANT ALL ON api.user_sessions TO authenticated;

-- Grant usage on sequences (if any) to authenticated users
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA api TO authenticated;

-- =====================================================
-- Step 8: Create helper functions for session management
-- =====================================================

-- Function to get user's session history
CREATE OR REPLACE FUNCTION api.get_user_sessions(
    user_uuid UUID DEFAULT auth.uid(),
    limit_count INTEGER DEFAULT 50,
    session_types TEXT[] DEFAULT NULL
)
RETURNS TABLE (
    session_id UUID,
    session_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB
) AS $$
BEGIN
    -- Return user's sessions ordered by most recent first
    -- Optionally filter by session types
    RETURN QUERY
    SELECT 
        us.id as session_id,
        us.session_type,
        us.created_at,
        us.ip_address,
        us.user_agent,
        us.expires_at,
        us.metadata
    FROM api.user_sessions us
    WHERE us.user_id = user_uuid
    AND (session_types IS NULL OR us.session_type = ANY(session_types))
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

-- Function to get active sessions count for a user
CREATE OR REPLACE FUNCTION api.get_active_sessions_count(
    user_uuid UUID DEFAULT auth.uid()
)
RETURNS INTEGER AS $$
DECLARE
    active_count INTEGER;
BEGIN
    -- Count active (non-expired) sessions
    SELECT COUNT(*) INTO active_count
    FROM api.user_sessions 
    WHERE user_id = user_uuid 
    AND session_type = 'login'
    AND (expires_at IS NULL OR expires_at > NOW());
    
    RETURN active_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments to helper functions
COMMENT ON FUNCTION api.get_user_sessions(UUID, INTEGER, TEXT[]) IS 
'Returns a user''s session history with optional filtering by session types.';

COMMENT ON FUNCTION api.cleanup_expired_sessions() IS 
'Removes expired sessions from the user_sessions table. Returns count of deleted sessions.';

COMMENT ON FUNCTION api.get_active_sessions_count(UUID) IS 
'Returns the count of active (non-expired) login sessions for a user.';

-- =====================================================
-- Step 9: Create a view for easy session analysis
-- =====================================================

-- View for user session summary
CREATE OR REPLACE VIEW api.user_session_summary AS
SELECT 
    p.id as user_id,
    p.email,
    p.full_name,
    COUNT(us.id) as total_sessions,
    COUNT(CASE WHEN us.session_type = 'login' THEN 1 END) as login_count,
    COUNT(CASE WHEN us.session_type = 'logout' THEN 1 END) as logout_count,
    MAX(us.created_at) as last_activity,
    MAX(CASE WHEN us.session_type = 'login' THEN us.created_at END) as last_login
FROM api.profiles p
LEFT JOIN api.user_sessions us ON p.id = us.user_id
GROUP BY p.id, p.email, p.full_name;

-- Add comment to view
COMMENT ON VIEW api.user_session_summary IS 
'Summary view showing user profiles with session statistics and activity metrics.';

-- =====================================================
-- Step 10: Usage instructions and verification queries
-- =====================================================

/*
-- USAGE INSTRUCTIONS:
-- Since we cannot create triggers on auth.sessions, you need to call these functions manually:

-- 1. After successful login in your app:
SELECT api.log_session_from_client('login', 'Mozilla/5.0...', '{"source": "web_app"}');

-- 2. After logout:
SELECT api.log_user_logout();

-- 3. Get user's session history:
SELECT * FROM api.get_user_sessions();

-- 4. Get session summary:
SELECT * FROM api.user_session_summary;

-- VERIFICATION QUERIES (uncomment to test):

-- Check if table was created:
SELECT * FROM api.user_sessions LIMIT 5;

-- Test the manual logging function:
SELECT api.log_session_from_client('login', 'Test User Agent', '{"test": true}');

-- Check recent sessions:
SELECT * FROM api.user_sessions ORDER BY created_at DESC LIMIT 5;

-- Test helper functions:
SELECT * FROM api.get_user_sessions();
SELECT api.get_active_sessions_count();
SELECT * FROM api.user_session_summary;

-- Check RLS policies:
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'user_sessions';
*/
