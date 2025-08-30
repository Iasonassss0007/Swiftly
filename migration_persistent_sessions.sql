-- Migration: Add persistent session support with JWT refresh tokens
-- This migration adds tables for managing refresh tokens and auth logs
-- Run this after your existing migrations

-- Create refresh_tokens table for managing JWT refresh tokens
CREATE TABLE IF NOT EXISTS api.refresh_tokens (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_revoked BOOLEAN DEFAULT FALSE,
    revoked_at TIMESTAMP WITH TIME ZONE,
    revoked_reason TEXT,
    replaces TEXT REFERENCES api.refresh_tokens(id),
    replaced_by TEXT REFERENCES api.refresh_tokens(id),
    ip_address TEXT,
    user_agent TEXT,
    session_type TEXT DEFAULT 'login',
    usage_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON api.refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON api.refresh_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_is_revoked ON api.refresh_tokens(is_revoked);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_created_at ON api.refresh_tokens(created_at);

-- Create auth_logs table for tracking authentication activities
CREATE TABLE IF NOT EXISTS api.auth_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for auth logs
CREATE INDEX IF NOT EXISTS idx_auth_logs_user_id ON api.auth_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_logs_action ON api.auth_logs(action);
CREATE INDEX IF NOT EXISTS idx_auth_logs_created_at ON api.auth_logs(created_at);

-- Create RLS policies for refresh_tokens table
ALTER TABLE api.refresh_tokens ENABLE ROW LEVEL SECURITY;

-- Users can only see their own refresh tokens
CREATE POLICY "Users can view own refresh tokens" ON api.refresh_tokens
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own refresh tokens
CREATE POLICY "Users can insert own refresh tokens" ON api.refresh_tokens
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own refresh tokens
CREATE POLICY "Users can update own refresh tokens" ON api.refresh_tokens
    FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for auth_logs table
ALTER TABLE api.auth_logs ENABLE ROW LEVEL SECURITY;

-- Users can only see their own auth logs
CREATE POLICY "Users can view own auth logs" ON api.auth_logs
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own auth logs
CREATE POLICY "Users can insert own auth logs" ON api.auth_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create function to clean up expired tokens (runs daily)
CREATE OR REPLACE FUNCTION api.cleanup_expired_tokens()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Mark expired tokens as revoked
    UPDATE api.refresh_tokens 
    SET 
        is_revoked = TRUE,
        revoked_at = NOW(),
        revoked_reason = 'expired_cleanup'
    WHERE 
        expires_at < NOW() 
        AND is_revoked = FALSE;
    
    -- Log the cleanup
    INSERT INTO api.auth_logs (action, metadata)
    VALUES ('cleanup_expired_tokens', jsonb_build_object('tokens_cleaned', 'expired'));
END;
$$;

-- Create a cron job to run cleanup daily (requires pg_cron extension)
-- Uncomment if you have pg_cron installed:
-- SELECT cron.schedule('cleanup-expired-tokens', '0 2 * * *', 'SELECT api.cleanup_expired_tokens();');

-- Create function to get user session count
CREATE OR REPLACE FUNCTION api.get_user_session_count(user_uuid UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    session_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO session_count
    FROM api.refresh_tokens
    WHERE user_id = user_uuid AND is_revoked = FALSE;
    
    RETURN session_count;
END;
$$;

-- Create function to revoke all user sessions
CREATE OR REPLACE FUNCTION api.revoke_all_user_sessions(user_uuid UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    revoked_count INTEGER;
BEGIN
    UPDATE api.refresh_tokens 
    SET 
        is_revoked = TRUE,
        revoked_at = NOW(),
        revoked_reason = 'bulk_revoke'
    WHERE user_id = user_uuid AND is_revoked = FALSE;
    
    GET DIAGNOSTICS revoked_count = ROW_COUNT;
    
    -- Log the bulk revocation
    INSERT INTO api.auth_logs (user_id, action, metadata)
    VALUES (user_uuid, 'bulk_revoke_sessions', jsonb_build_object('sessions_revoked', revoked_count));
    
    RETURN revoked_count;
END;
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA api TO authenticated;
GRANT ALL ON api.refresh_tokens TO authenticated;
GRANT ALL ON api.auth_logs TO authenticated;
GRANT EXECUTE ON FUNCTION api.cleanup_expired_tokens() TO authenticated;
GRANT EXECUTE ON FUNCTION api.get_user_session_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION api.revoke_all_user_sessions(UUID) TO authenticated;

-- Insert initial auth log entry
INSERT INTO api.auth_logs (action, metadata)
VALUES ('migration_completed', jsonb_build_object('version', 'persistent_sessions_v1', 'timestamp', NOW()));

-- Add comments for documentation
COMMENT ON TABLE api.refresh_tokens IS 'Stores JWT refresh tokens for persistent user sessions';
COMMENT ON TABLE api.auth_logs IS 'Logs authentication activities for audit and security purposes';
COMMENT ON FUNCTION api.cleanup_expired_tokens() IS 'Automatically cleans up expired refresh tokens';
COMMENT ON FUNCTION api.get_user_session_count(UUID) IS 'Returns the number of active sessions for a user';
COMMENT ON FUNCTION api.revoke_all_user_sessions(UUID) IS 'Revokes all active sessions for a user';
