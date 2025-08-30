-- Minimal test to verify basic Supabase setup
-- Run this first to check if the issue is with the complex schema

-- First, let's check if we can access auth.users
SELECT 'Auth system working' as status, count(*) as user_count FROM auth.users;

-- Check current user
SELECT 'Current user' as info, auth.uid() as user_id;

-- Try to create a simple test table
DROP TABLE IF EXISTS test_tasks;

CREATE TABLE test_tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    title TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE test_tasks ENABLE ROW LEVEL SECURITY;

-- Simple RLS policy
CREATE POLICY "Users see own test tasks" ON test_tasks
    FOR ALL USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON test_tasks TO authenticated;

-- Test insert (only works if you're authenticated)
-- INSERT INTO test_tasks (user_id, title) VALUES (auth.uid(), 'Test task');

-- Test select
-- SELECT * FROM test_tasks;

SELECT 'Test table created successfully' as result;


