-- Complete Tasks Table Schema for Supabase
-- This will force schema cache refresh and ensure proper table creation

-- First, clean up any existing objects
DROP TABLE IF EXISTS tasks CASCADE;
DROP TYPE IF EXISTS task_status CASCADE;
DROP TYPE IF EXISTS task_priority CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Create custom types
CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'done');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high');

-- Create tasks table in api schema (where Supabase expects it)
CREATE SCHEMA IF NOT EXISTS api;
CREATE TABLE api.tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL CHECK (char_length(title) >= 1 AND char_length(title) <= 500),
    description TEXT CHECK (description IS NULL OR char_length(description) <= 2000),
    status task_status NOT NULL DEFAULT 'todo',
    priority task_priority NOT NULL DEFAULT 'medium',
    due_date TIMESTAMPTZ,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    assignees JSONB DEFAULT '[]'::JSONB,
    subtasks JSONB DEFAULT '[]'::JSONB,
    attachments JSONB DEFAULT '[]'::JSONB,
    comments JSONB DEFAULT '[]'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_tasks_user_id ON api.tasks(user_id);
CREATE INDEX idx_tasks_status ON api.tasks(status);
CREATE INDEX idx_tasks_due_date ON api.tasks(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX idx_tasks_created_at ON api.tasks(created_at);
CREATE INDEX idx_tasks_user_status ON api.tasks(user_id, status);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Create trigger to automatically update updated_at on row changes
CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON api.tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE api.tasks ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to avoid conflicts
DROP POLICY IF EXISTS "tasks_select_policy" ON api.tasks;
DROP POLICY IF EXISTS "tasks_insert_policy" ON api.tasks;
DROP POLICY IF EXISTS "tasks_update_policy" ON api.tasks;
DROP POLICY IF EXISTS "tasks_delete_policy" ON api.tasks;

-- Create RLS policies with proper names
CREATE POLICY "Enable read access for users based on user_id" ON api.tasks
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Enable insert for authenticated users only" ON api.tasks
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for users based on user_id" ON api.tasks
    FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable delete for users based on user_id" ON api.tasks
    FOR DELETE 
    USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON api.tasks TO authenticated;
GRANT ALL ON api.tasks TO service_role;

-- Force schema refresh by updating table comment
COMMENT ON TABLE api.tasks IS 'User tasks table - Created at setup';

-- Verify the table is properly created and accessible
DO $$
DECLARE
    table_exists BOOLEAN;
    rls_enabled BOOLEAN;
    policy_count INTEGER;
BEGIN
    -- Check if table exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'api' 
        AND table_name = 'tasks'
    ) INTO table_exists;
    
    -- Check if RLS is enabled
    SELECT rowsecurity FROM pg_tables 
    WHERE schemaname = 'api' AND tablename = 'tasks' 
    INTO rls_enabled;
    
    -- Count policies
    SELECT count(*) FROM pg_policies 
    WHERE schemaname = 'api' AND tablename = 'tasks' 
    INTO policy_count;
    
    -- Report results
    RAISE NOTICE '=== SETUP VERIFICATION ===';
    RAISE NOTICE 'Table exists: %', table_exists;
    RAISE NOTICE 'RLS enabled: %', rls_enabled;
    RAISE NOTICE 'Policies created: %', policy_count;
    
    IF table_exists AND rls_enabled AND policy_count = 4 THEN
        RAISE NOTICE '✅ SUCCESS: Tasks table is properly configured!';
    ELSE
        RAISE NOTICE '❌ ERROR: Setup incomplete. Please check the results above.';
    END IF;
END $$;

-- Test query to verify API access (this will help cache the schema)
SELECT 'Schema cache refreshed' as status, count(*) as initial_count FROM api.tasks;
