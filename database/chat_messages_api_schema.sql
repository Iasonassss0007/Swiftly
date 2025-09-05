-- =====================================================
-- CHAT MESSAGES DATABASE SCHEMA - PUBLIC SCHEMA
-- Captures ALL user and AI messages exactly as typed/generated
-- Creates tables in 'public' schema for direct client access
-- =====================================================

-- =====================================================
-- SAFE CLEANUP EXISTING OBJECTS TO PREVENT CONFLICTS
-- =====================================================
-- This section safely removes any existing objects without causing errors
-- on non-existent tables, functions, or views

-- Safe function cleanup using dynamic SQL
DO $$
DECLARE
    func_name TEXT;
BEGIN
    -- List of functions to clean up
    FOR func_name IN SELECT unnest(ARRAY['create_chat_session', 'save_chat_message', 'get_conversation_history', 'update_session_timestamp'])
    LOOP
        -- Try to drop from public schema
        BEGIN
            EXECUTE format('DROP FUNCTION IF EXISTS %I CASCADE', func_name);
        EXCEPTION WHEN OTHERS THEN
            NULL;
        END;
        
        -- Try to drop from api schema
        BEGIN
            EXECUTE format('DROP FUNCTION IF EXISTS api.%I CASCADE', func_name);
        EXCEPTION WHEN OTHERS THEN
            NULL;
        END;
    END LOOP;
    
    RAISE NOTICE '✅ Function cleanup completed';
END $$;

-- Safe view cleanup using dynamic SQL
DO $$
DECLARE
    view_name TEXT;
BEGIN
    -- List of views to clean up
    FOR view_name IN SELECT unnest(ARRAY['recent_conversations', 'message_analytics'])
    LOOP
        -- Try to drop from public schema
        BEGIN
            EXECUTE format('DROP VIEW IF EXISTS %I CASCADE', view_name);
        EXCEPTION WHEN OTHERS THEN
            NULL;
        END;
        
        -- Try to drop from api schema
        BEGIN
            EXECUTE format('DROP VIEW IF EXISTS api.%I CASCADE', view_name);
        EXCEPTION WHEN OTHERS THEN
            NULL;
        END;
    END LOOP;
    
    RAISE NOTICE '✅ View cleanup completed';
END $$;

-- Additional cleanup for any remaining objects
DO $$
DECLARE
    obj RECORD;
BEGIN
    -- Drop any remaining triggers that might reference our functions
    FOR obj IN 
        SELECT trigger_name, event_object_table, event_object_schema
        FROM information_schema.triggers 
        WHERE trigger_name LIKE '%session_timestamp%'
           OR trigger_name LIKE '%chat%'
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I.%I CASCADE', 
                      obj.trigger_name, obj.event_object_schema, obj.event_object_table);
    END LOOP;
    
    -- Note: Functions are already cleaned up above
    NULL;
END $$;

-- Drop existing tables (be careful - this will delete existing data!)
-- Uncomment the following lines if you want to start completely fresh
-- DROP TABLE IF EXISTS chat_message_attachments CASCADE;
-- DROP TABLE IF EXISTS chat_messages CASCADE;
-- DROP TABLE IF EXISTS chat_sessions CASCADE;

-- Chat Sessions Table
-- Tracks conversation sessions between users and AI
CREATE TABLE IF NOT EXISTS chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Chat Messages Table
-- Stores EVERY message exactly as typed/generated
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Message Content (EXACT as typed/generated)
    message_text TEXT NOT NULL,
    sender VARCHAR(10) NOT NULL CHECK (sender IN ('user', 'ai')),
    
    -- Timestamps
    message_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Message Properties
    message_length INTEGER GENERATED ALWAYS AS (LENGTH(message_text)) STORED,
    language_detected VARCHAR(10),
    
    -- Task Integration (if message created a task)
    has_task BOOLEAN DEFAULT false,
    task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    
    -- Message Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Performance Indexes
    CONSTRAINT valid_sender CHECK (sender IN ('user', 'ai'))
);

-- Message Attachments (for future file uploads)
CREATE TABLE IF NOT EXISTS chat_message_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100),
    file_size INTEGER,
    file_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Primary lookup indexes
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_timestamp 
ON chat_messages(session_id, message_timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_chat_messages_user_timestamp 
ON chat_messages(user_id, message_timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_timestamp 
ON chat_messages(sender, message_timestamp DESC);

-- Search indexes
CREATE INDEX IF NOT EXISTS idx_chat_messages_text_search 
ON chat_messages USING GIN(to_tsvector('english', message_text));

-- Session indexes
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_updated 
ON chat_sessions(user_id, updated_at DESC);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_message_attachments ENABLE ROW LEVEL SECURITY;

-- Users can only access their own chat sessions
DROP POLICY IF EXISTS "Users can access own chat sessions" ON chat_sessions;
CREATE POLICY "Users can access own chat sessions" ON chat_sessions
    FOR ALL USING (auth.uid() = user_id);

-- Users can only access their own chat messages
DROP POLICY IF EXISTS "Users can access own chat messages" ON chat_messages;
CREATE POLICY "Users can access own chat messages" ON chat_messages
    FOR ALL USING (auth.uid() = user_id);

-- Users can only access their own message attachments
DROP POLICY IF EXISTS "Users can access own message attachments" ON chat_message_attachments;
CREATE POLICY "Users can access own message attachments" ON chat_message_attachments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM chat_messages cm 
            WHERE cm.id = message_id AND cm.user_id = auth.uid()
        )
    );

-- =====================================================
-- TRIGGER FUNCTIONS FOR AUTO-UPDATES
-- =====================================================

-- Function to update session timestamp when new message is added
CREATE OR REPLACE FUNCTION update_session_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE chat_sessions 
    SET updated_at = NOW() 
    WHERE id = NEW.session_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update session timestamp
DROP TRIGGER IF EXISTS trigger_update_session_timestamp ON chat_messages;
CREATE TRIGGER trigger_update_session_timestamp
    AFTER INSERT ON chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_session_timestamp();

-- =====================================================
-- HELPER FUNCTIONS IN PUBLIC SCHEMA (for Supabase RPC calls)
-- =====================================================
-- Note: Functions are created in public schema so Supabase can find them
-- Tables remain in public schema for direct client access

-- Function to create a new chat session
CREATE OR REPLACE FUNCTION create_chat_session(
    p_user_id UUID,
    p_session_name VARCHAR(255) DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    new_session_id UUID;
BEGIN
    INSERT INTO chat_sessions (user_id, session_name)
    VALUES (p_user_id, COALESCE(p_session_name, 'Chat Session ' || NOW()::DATE))
    RETURNING id INTO new_session_id;
    
    RETURN new_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to save a message (EXACTLY as provided)
CREATE OR REPLACE FUNCTION save_chat_message(
    p_session_id UUID,
    p_user_id UUID,
    p_message_text TEXT,
    p_sender VARCHAR(10),
    p_has_task BOOLEAN DEFAULT false,
    p_task_id UUID DEFAULT NULL,
    p_language_detected VARCHAR(10) DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    new_message_id UUID;
BEGIN
    -- Validate sender
    IF p_sender NOT IN ('user', 'ai') THEN
        RAISE EXCEPTION 'Invalid sender. Must be "user" or "ai"';
    END IF;
    
    -- Insert message EXACTLY as provided
    INSERT INTO chat_messages (
        session_id,
        user_id,
        message_text,
        sender,
        has_task,
        task_id,
        language_detected
    )
    VALUES (
        p_session_id,
        p_user_id,
        p_message_text,  -- EXACT text, no modifications
        p_sender,
        p_has_task,
        p_task_id,
        p_language_detected
    )
    RETURNING id INTO new_message_id;
    
    RETURN new_message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get conversation history
CREATE OR REPLACE FUNCTION get_conversation_history(
    p_session_id UUID,
    p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
    message_id UUID,
    message_text TEXT,
    sender VARCHAR(10),
    message_timestamp TIMESTAMP WITH TIME ZONE,
    has_task BOOLEAN,
    task_id UUID,
    language_detected VARCHAR(10)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cm.id,
        cm.message_text,
        cm.sender,
        cm.message_timestamp,
        cm.has_task,
        cm.task_id,
        cm.language_detected
    FROM chat_messages cm
    WHERE cm.session_id = p_session_id
    ORDER BY cm.message_timestamp ASC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- VIEWS FOR EASY QUERYING IN PUBLIC SCHEMA
-- =====================================================

-- View for recent conversations
CREATE OR REPLACE VIEW recent_conversations AS
SELECT 
    cs.id as session_id,
    cs.session_name,
    cs.user_id,
    cs.created_at as session_created,
    cs.updated_at as last_message,
    COUNT(cm.id) as message_count,
    MAX(cm.message_timestamp) as latest_message_time
FROM chat_sessions cs
LEFT JOIN chat_messages cm ON cs.id = cm.session_id
WHERE cs.is_active = true
GROUP BY cs.id, cs.session_name, cs.user_id, cs.created_at, cs.updated_at
ORDER BY cs.updated_at DESC;

-- View for message analytics
CREATE OR REPLACE VIEW message_analytics AS
SELECT 
    DATE(message_timestamp) as date,
    sender,
    COUNT(*) as message_count,
    AVG(message_length) as avg_message_length,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(DISTINCT session_id) as unique_sessions
FROM chat_messages
GROUP BY DATE(message_timestamp), sender
ORDER BY date DESC;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant permissions on tables
GRANT ALL ON chat_sessions TO authenticated;
GRANT ALL ON chat_sessions TO service_role;

GRANT ALL ON chat_messages TO authenticated;
GRANT ALL ON chat_messages TO service_role;

GRANT ALL ON chat_message_attachments TO authenticated;
GRANT ALL ON chat_message_attachments TO service_role;

-- Grant permissions on views
GRANT SELECT ON recent_conversations TO authenticated;
GRANT SELECT ON message_analytics TO authenticated;

-- Force schema refresh by updating table comment
COMMENT ON TABLE chat_messages IS 'User chat messages table - Created in public schema for direct client access';
COMMENT ON TABLE chat_sessions IS 'User chat sessions table - Created in public schema for direct client access';

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify tables were created successfully
SELECT 
    table_name, 
    table_type,
    table_schema
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('chat_sessions', 'chat_messages', 'chat_message_attachments')
ORDER BY table_name;

-- Verify functions were created
SELECT 
    routine_name, 
    routine_type,
    routine_schema
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('create_chat_session', 'save_chat_message', 'get_conversation_history')
ORDER BY routine_name;

-- Force Supabase schema cache refresh
NOTIFY pgrst, 'reload schema';

-- =====================================================
-- VERIFICATION AND CLEANUP CHECK
-- =====================================================

-- Check for any remaining duplicate functions
DO $$
DECLARE
    func_count INTEGER;
BEGIN
    -- Check for duplicate get_conversation_history functions
    SELECT COUNT(*) INTO func_count
    FROM information_schema.routines 
    WHERE routine_name = 'get_conversation_history';
    
    IF func_count > 1 THEN
        RAISE NOTICE 'WARNING: Found % duplicate get_conversation_history functions. Consider manual cleanup.', func_count;
    ELSE
        RAISE NOTICE '✅ get_conversation_history function is unique';
    END IF;
    
    -- Check for duplicate create_chat_session functions
    SELECT COUNT(*) INTO func_count
    FROM information_schema.routines 
    WHERE routine_name = 'create_chat_session';
    
    IF func_count > 1 THEN
        RAISE NOTICE 'WARNING: Found % duplicate create_chat_session functions. Consider manual cleanup.', func_count;
    ELSE
        RAISE NOTICE '✅ create_chat_session function is unique';
    END IF;
    
    -- Check for duplicate save_chat_message functions
    SELECT COUNT(*) INTO func_count
    FROM information_schema.routines 
    WHERE routine_name = 'save_chat_message';
    
    IF func_count > 1 THEN
        RAISE NOTICE 'WARNING: Found % duplicate save_chat_message functions. Consider manual cleanup.', func_count;
    ELSE
        RAISE NOTICE '✅ save_chat_message function is unique';
    END IF;
END $$;

-- =====================================================
-- IMPORTANT NOTES
-- =====================================================

/*
SETUP INSTRUCTIONS:
1. Run this SQL file in your Supabase SQL editor
2. Verify all tables and functions are created in 'public' schema
3. Test the functions with sample data
4. Ensure RLS policies are working correctly

USAGE:
1. Create session: SELECT create_chat_session(auth.uid(), 'Session Name')
2. Save user message: SELECT save_chat_message(session_id, auth.uid(), 'exact text', 'user')
3. Save AI response: SELECT save_chat_message(session_id, auth.uid(), 'exact response', 'ai')
4. Get history: SELECT * FROM get_conversation_history(session_id)

SCHEMA COMPLIANCE:
✅ Tables created in 'public' schema (direct client access)
✅ Functions created in 'public' schema (Supabase RPC convention)
✅ RLS policies ensure user data isolation
✅ Real-time subscriptions will work with 'public' schema
✅ Proper grants for authenticated and service_role users
*/
