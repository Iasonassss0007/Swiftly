-- =====================================================
-- CHAT MESSAGES PERSISTENT STORAGE SETUP
-- Creates chat_messages table with RLS and real-time
-- All objects created in 'api' schema
-- =====================================================

-- Create the api schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS api;

-- Create chat_messages table in api schema
CREATE TABLE IF NOT EXISTS api.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sender VARCHAR(10) NOT NULL CHECK (sender IN ('user', 'ai')),
    message_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    session_id UUID DEFAULT gen_random_uuid(), -- For grouping conversations
    metadata JSONB DEFAULT '{}'::jsonb -- For future extensibility
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON api.chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON api.chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON api.chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_session ON api.chat_messages(user_id, session_id);

-- Enable Row Level Security
ALTER TABLE api.chat_messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see their own messages
CREATE POLICY "Users can view own messages" ON api.chat_messages
    FOR SELECT USING (auth.uid() = user_id);

-- Users can only insert their own messages
CREATE POLICY "Users can insert own messages" ON api.chat_messages
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only update their own messages
CREATE POLICY "Users can update own messages" ON api.chat_messages
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can only delete their own messages
CREATE POLICY "Users can delete own messages" ON api.chat_messages
    FOR DELETE USING (auth.uid() = user_id);

-- Enable real-time subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE api.chat_messages;

-- Grant necessary permissions
GRANT ALL ON api.chat_messages TO authenticated;
GRANT USAGE ON SCHEMA api TO authenticated;

-- Create a view for recent conversations in api schema
CREATE OR REPLACE VIEW api.recent_conversations AS
SELECT 
    session_id,
    user_id,
    MAX(created_at) as last_message_at,
    COUNT(*) as message_count,
    STRING_AGG(
        CASE 
            WHEN sender = 'user' THEN message_text 
            ELSE NULL 
        END, 
        ' ' ORDER BY created_at DESC
    ) FILTER (WHERE sender = 'user') as last_user_message
FROM api.chat_messages 
GROUP BY session_id, user_id
ORDER BY last_message_at DESC;

-- Grant access to the view
GRANT SELECT ON api.recent_conversations TO authenticated;

-- Create RPC function to get conversation history
CREATE OR REPLACE FUNCTION api.get_conversation_history(
    p_user_id UUID,
    p_session_id UUID DEFAULT NULL,
    p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
    id UUID,
    sender VARCHAR(10),
    message_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    session_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if user is authenticated and requesting their own data
    IF auth.uid() != p_user_id THEN
        RAISE EXCEPTION 'Access denied';
    END IF;
    
    RETURN QUERY
    SELECT 
        cm.id,
        cm.sender,
        cm.message_text,
        cm.created_at,
        cm.session_id
    FROM api.chat_messages cm
    WHERE cm.user_id = p_user_id
        AND (p_session_id IS NULL OR cm.session_id = p_session_id)
    ORDER BY cm.created_at ASC
    LIMIT p_limit;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION api.get_conversation_history(UUID, UUID, INTEGER) TO authenticated;

-- Create RPC function to save a message
CREATE OR REPLACE FUNCTION api.save_chat_message(
    p_user_id UUID,
    p_sender VARCHAR(10),
    p_message_text TEXT,
    p_session_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_message_id UUID;
    v_session_id UUID;
BEGIN
    -- Check if user is authenticated and inserting their own data
    IF auth.uid() != p_user_id THEN
        RAISE EXCEPTION 'Access denied';
    END IF;
    
    -- Validate sender
    IF p_sender NOT IN ('user', 'ai') THEN
        RAISE EXCEPTION 'Invalid sender. Must be "user" or "ai"';
    END IF;
    
    -- Use provided session_id or generate new one
    v_session_id := COALESCE(p_session_id, gen_random_uuid());
    
    -- Insert the message
    INSERT INTO api.chat_messages (user_id, sender, message_text, session_id)
    VALUES (p_user_id, p_sender, p_message_text, v_session_id)
    RETURNING id INTO v_message_id;
    
    RETURN v_message_id;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION api.save_chat_message(UUID, VARCHAR, TEXT, UUID) TO authenticated;

-- Create RPC function to get user sessions
CREATE OR REPLACE FUNCTION api.get_user_sessions(p_user_id UUID)
RETURNS TABLE (
    session_id UUID,
    last_message_at TIMESTAMP WITH TIME ZONE,
    message_count BIGINT,
    last_user_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if user is authenticated and requesting their own data
    IF auth.uid() != p_user_id THEN
        RAISE EXCEPTION 'Access denied';
    END IF;
    
    RETURN QUERY
    SELECT 
        rc.session_id,
        rc.last_message_at,
        rc.message_count,
        rc.last_user_message
    FROM api.recent_conversations rc
    WHERE rc.user_id = p_user_id
    ORDER BY rc.last_message_at DESC;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION api.get_user_sessions(UUID) TO authenticated;

-- Insert sample data for testing (optional - remove in production)
-- INSERT INTO api.chat_messages (user_id, sender, message_text) VALUES 
-- ('00000000-0000-0000-0000-000000000000', 'user', 'Hello, how can you help me?'),
-- ('00000000-0000-0000-0000-000000000000', 'ai', 'Hello! I can help you with task management and various questions. What would you like to know?');

-- Verify the setup
SELECT 
    'Table created' as status,
    COUNT(*) as message_count
FROM api.chat_messages;

SELECT 
    'RLS enabled' as status,
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'chat_messages' AND schemaname = 'api';

SELECT 
    'Policies created' as status,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename = 'chat_messages' AND schemaname = 'api';

SELECT 
    'Functions created' as status,
    COUNT(*) as function_count
FROM pg_proc 
WHERE proname IN ('get_conversation_history', 'save_chat_message', 'get_user_sessions') 
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'api');
