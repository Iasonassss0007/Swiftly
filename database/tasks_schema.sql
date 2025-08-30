-- Tasks Table Schema for Supabase
-- This schema follows Supabase best practices with RLS, triggers, and proper indexing

-- Drop existing objects if they exist to avoid conflicts
DROP TABLE IF EXISTS tasks CASCADE;
DROP TYPE IF EXISTS task_status CASCADE;
DROP TYPE IF EXISTS task_priority CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Create custom types
CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'done');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high');

-- Create tasks table
CREATE TABLE tasks (
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
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX idx_tasks_created_at ON tasks(created_at);
CREATE INDEX idx_tasks_user_status ON tasks(user_id, status);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Create trigger to automatically update updated_at on row changes
CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "tasks_select_policy" ON tasks
    FOR SELECT 
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "tasks_insert_policy" ON tasks
    FOR INSERT 
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "tasks_update_policy" ON tasks
    FOR UPDATE 
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "tasks_delete_policy" ON tasks
    FOR DELETE 
    TO authenticated
    USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT ALL ON tasks TO authenticated;
GRANT ALL ON tasks TO service_role;

-- Verify the setup
DO $$
BEGIN
    RAISE NOTICE 'Tasks table created successfully with % columns', 
        (SELECT count(*) FROM information_schema.columns WHERE table_name = 'tasks');
    RAISE NOTICE 'RLS is enabled: %', 
        (SELECT rowsecurity FROM pg_tables WHERE tablename = 'tasks');
    RAISE NOTICE 'Number of policies created: %', 
        (SELECT count(*) FROM pg_policies WHERE tablename = 'tasks');
END $$;
