-- =====================================================
-- 🚀 COMPLETE SWIFTLY WEBAPP DATABASE RESTORATION
-- =====================================================
-- This script recreates ALL necessary database objects in the 'api' schema
-- to restore full functionality of your Swiftly webapp
-- =====================================================

-- =====================================================
-- 1. SCHEMA CREATION
-- =====================================================
-- Drop and recreate the api schema to start fresh
DROP SCHEMA IF EXISTS api CASCADE;
CREATE SCHEMA api;

-- Grant usage on the api schema
GRANT USAGE ON SCHEMA api TO authenticated;
GRANT USAGE ON SCHEMA api TO anon;

-- =====================================================
-- 2. USER PROFILES TABLE
-- =====================================================
-- Stores user profile information (full_name, email, avatar)
CREATE TABLE IF NOT EXISTS api.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON api.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_full_name ON api.profiles(full_name);

-- Enable Row Level Security
ALTER TABLE api.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON api.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON api.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON api.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Grant permissions
GRANT ALL ON api.profiles TO authenticated;

-- =====================================================
-- 3. TASKS TABLE (INSTANT LOADING)
-- =====================================================
-- Stores user tasks with all necessary fields for instant loading
CREATE TABLE IF NOT EXISTS api.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    due_date TIMESTAMP WITH TIME ZONE,
    completed BOOLEAN DEFAULT FALSE,
    tags TEXT[],
    assignees TEXT[],
    subtasks TEXT[],
    attachments TEXT[],
    comments TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create comprehensive indexes for instant loading
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON api.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON api.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON api.tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON api.tasks(completed);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON api.tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON api.tasks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_user_status ON api.tasks(user_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_user_priority ON api.tasks(user_id, priority);
CREATE INDEX IF NOT EXISTS idx_tasks_user_completed ON api.tasks(user_id, completed);

-- Enable Row Level Security
ALTER TABLE api.tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tasks
CREATE POLICY "Users can view own tasks" ON api.tasks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks" ON api.tasks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks" ON api.tasks
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks" ON api.tasks
    FOR DELETE USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON api.tasks TO authenticated;

-- =====================================================
-- 4. CHAT MESSAGES TABLE (AI CHAT PERSISTENCE)
-- =====================================================
-- Stores persistent chat messages between users and AI
CREATE TABLE IF NOT EXISTS api.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sender VARCHAR(10) NOT NULL CHECK (sender IN ('user', 'ai')),
    message_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    session_id UUID DEFAULT gen_random_uuid(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON api.chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON api.chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON api.chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_session ON api.chat_messages(user_id, session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON api.chat_messages(sender);

-- Enable Row Level Security
ALTER TABLE api.chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chat messages
CREATE POLICY "Users can view own messages" ON api.chat_messages
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own messages" ON api.chat_messages
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own messages" ON api.chat_messages
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own messages" ON api.chat_messages
    FOR DELETE USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON api.chat_messages TO authenticated;

-- =====================================================
-- 5. USER SESSIONS TABLE
-- =====================================================
-- Tracks user sessions for analytics and management
CREATE TABLE IF NOT EXISTS api.user_sessions (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON api.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_created_at ON api.user_sessions(created_at DESC);

-- Enable Row Level Security
ALTER TABLE api.user_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user sessions
CREATE POLICY "Users can view own sessions" ON api.user_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions" ON api.user_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON api.user_sessions TO authenticated;

-- =====================================================
-- 6. HELPER VIEWS
-- =====================================================
-- Recent conversations view for chat
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

-- User dashboard summary view
CREATE OR REPLACE VIEW api.user_dashboard_summary AS
SELECT 
    p.id as user_id,
    p.full_name,
    p.email,
    p.avatar_url,
    p.created_at as member_since,
    COUNT(t.id) as total_tasks,
    COUNT(t.id) FILTER (WHERE t.status = 'todo') as todo_tasks,
    COUNT(t.id) FILTER (WHERE t.status = 'in_progress') as in_progress_tasks,
    COUNT(t.id) FILTER (WHERE t.status = 'done') as completed_tasks,
    COUNT(t.id) FILTER (WHERE t.completed = true) as completed_tasks_count,
    COUNT(cm.id) as total_chat_messages,
    MAX(t.updated_at) as last_task_activity,
    MAX(cm.created_at) as last_chat_activity
FROM api.profiles p
LEFT JOIN api.tasks t ON p.id = t.user_id
LEFT JOIN api.chat_messages cm ON p.id = cm.user_id
GROUP BY p.id, p.full_name, p.email, p.avatar_url, p.created_at;

-- Grant access to views
GRANT SELECT ON api.recent_conversations TO authenticated;
GRANT SELECT ON api.user_dashboard_summary TO authenticated;

-- =====================================================
-- 7. RPC FUNCTIONS
-- =====================================================
-- Function to get conversation history
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

-- Function to save chat message
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
    IF auth.uid() != p_user_id THEN
        RAISE EXCEPTION 'Access denied';
    END IF;
    
    IF p_sender NOT IN ('user', 'ai') THEN
        RAISE EXCEPTION 'Invalid sender. Must be "user" or "ai"';
    END IF;
    
    v_session_id := COALESCE(p_session_id, gen_random_uuid());
    
    INSERT INTO api.chat_messages (user_id, sender, message_text, session_id)
    VALUES (p_user_id, p_sender, p_message_text, v_session_id)
    RETURNING id INTO v_message_id;
    
    RETURN v_message_id;
END;
$$;

-- Function to get user sessions
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

-- Function to get user tasks with instant loading support
CREATE OR REPLACE FUNCTION api.get_user_tasks(
    p_user_id UUID,
    p_status TEXT DEFAULT NULL,
    p_priority TEXT DEFAULT NULL,
    p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    description TEXT,
    status TEXT,
    priority TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    completed BOOLEAN,
    tags TEXT[],
    assignees TEXT[],
    subtasks TEXT[],
    attachments TEXT[],
    comments TEXT[],
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF auth.uid() != p_user_id THEN
        RAISE EXCEPTION 'Access denied';
    END IF;
    
    RETURN QUERY
    SELECT 
        t.id,
        t.title,
        t.description,
        t.status,
        t.priority,
        t.due_date,
        t.completed,
        t.tags,
        t.assignees,
        t.subtasks,
        t.attachments,
        t.comments,
        t.created_at,
        t.updated_at
    FROM api.tasks t
    WHERE t.user_id = p_user_id
        AND (p_status IS NULL OR t.status = p_status)
        AND (p_priority IS NULL OR t.priority = p_priority)
    ORDER BY 
        CASE 
            WHEN t.priority = 'high' THEN 1
            WHEN t.priority = 'medium' THEN 2
            WHEN t.priority = 'low' THEN 3
            ELSE 4
        END,
        t.due_date ASC NULLS LAST,
        t.created_at DESC
    LIMIT p_limit;
END;
$$;

-- Function to create or update user profile
CREATE OR REPLACE FUNCTION api.upsert_user_profile(
    p_user_id UUID,
    p_full_name TEXT,
    p_email TEXT,
    p_avatar_url TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF auth.uid() != p_user_id THEN
        RAISE EXCEPTION 'Access denied';
    END IF;
    
    INSERT INTO api.profiles (id, full_name, email, avatar_url)
    VALUES (p_user_id, p_full_name, p_email, p_avatar_url)
    ON CONFLICT (id) 
    DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        avatar_url = EXCLUDED.avatar_url,
        updated_at = NOW()
    RETURNING id;
    
    RETURN p_user_id;
END;
$$;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION api.get_conversation_history(UUID, UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION api.save_chat_message(UUID, VARCHAR, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION api.get_user_sessions(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION api.get_user_tasks(UUID, TEXT, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION api.upsert_user_profile(UUID, TEXT, TEXT, TEXT) TO authenticated;

-- =====================================================
-- 8. TRIGGERS
-- =====================================================
-- Update timestamp trigger for profiles
CREATE OR REPLACE FUNCTION api.update_profile_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_profile_timestamp
    BEFORE UPDATE ON api.profiles
    FOR EACH ROW
    EXECUTE FUNCTION api.update_profile_timestamp();

-- Update timestamp trigger for tasks
CREATE OR REPLACE FUNCTION api.update_task_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_task_timestamp
    BEFORE UPDATE ON api.tasks
    FOR EACH ROW
    EXECUTE FUNCTION api.update_task_timestamp();

-- =====================================================
-- 9. REAL-TIME SUBSCRIPTIONS
-- =====================================================
-- Enable real-time for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE api.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE api.tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE api.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE api.user_sessions;

-- =====================================================
-- 10. VERIFICATION QUERIES
-- =====================================================
-- Check that all tables were created
SELECT 'Tables created' as status, COUNT(*) as table_count 
FROM information_schema.tables 
WHERE table_schema = 'api';

-- Check RLS policies
SELECT 'RLS policies' as status, COUNT(*) as policy_count 
FROM pg_policies 
WHERE schemaname = 'api';

-- Check functions
SELECT 'Functions created' as status, COUNT(*) as function_count 
FROM pg_proc 
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'api');

-- Check indexes
SELECT 'Indexes created' as status, COUNT(*) as index_count 
FROM pg_indexes 
WHERE schemaname = 'api';

-- Check real-time subscriptions
SELECT 'Real-time enabled' as status, COUNT(*) as realtime_count 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' AND schemaname = 'api';

-- =====================================================
-- 11. SAMPLE DATA (OPTIONAL)
-- =====================================================
-- Uncomment the following lines if you want to add sample data for testing

-- Sample profile (replace with actual user ID)
-- INSERT INTO api.profiles (id, full_name, email) VALUES 
-- ('your-user-id-here', 'John Doe', 'john@example.com');

-- Sample tasks (replace with actual user ID)
-- INSERT INTO api.tasks (user_id, title, description, priority, status) VALUES 
-- ('your-user-id-here', 'Welcome to Swiftly!', 'This is your first task. You can edit, delete, or mark it as complete.', 'high', 'todo');

-- =====================================================
-- ✅ RESTORATION COMPLETE
-- =====================================================
-- Your Swiftly webapp database has been fully restored!
-- 
-- What's now available:
-- ✅ User authentication and profiles
-- ✅ Task management with instant loading
-- ✅ AI chat persistence
-- ✅ Real-time updates
-- ✅ Row Level Security
-- ✅ All tables in 'api' schema
-- 
-- Next steps:
-- 1. Test user authentication
-- 2. Create a user profile
-- 3. Test task creation and instant loading
-- 4. Test AI chat persistence
-- =====================================================
