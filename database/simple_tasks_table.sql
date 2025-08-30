-- Absolutely minimal tasks table for Supabase
-- This should work without any cache issues

CREATE TABLE IF NOT EXISTS tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    due_date TIMESTAMPTZ,
    completed BOOLEAN DEFAULT FALSE,
    tags TEXT[],
    assignees JSONB DEFAULT '[]',
    subtasks JSONB DEFAULT '[]',
    attachments JSONB DEFAULT '[]',
    comments JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Simple RLS policies
CREATE POLICY "tasks_policy" ON tasks USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON tasks TO authenticated;

-- Insert a test record to verify it works
INSERT INTO tasks (user_id, title) 
SELECT auth.uid(), 'Test Task - Please Delete' 
WHERE auth.uid() IS NOT NULL;

-- Show success
SELECT 'SUCCESS: Simple tasks table created' as status, count(*) as records FROM tasks;


