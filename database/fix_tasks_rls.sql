-- =====================================================
-- 🔐 TASKS TABLE ROW LEVEL SECURITY (RLS) SETUP
-- =====================================================
-- This script ensures proper RLS policies for the tasks table
-- to allow authenticated users to manage their own tasks
-- =====================================================

-- Check if RLS is enabled on tasks table
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'api' AND tablename = 'tasks';

-- Enable RLS on tasks table if not already enabled
ALTER TABLE api.tasks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to recreate them properly)
DROP POLICY IF EXISTS "Users can view their own tasks" ON api.tasks;
DROP POLICY IF EXISTS "Users can insert their own tasks" ON api.tasks;
DROP POLICY IF EXISTS "Users can update their own tasks" ON api.tasks;
DROP POLICY IF EXISTS "Users can delete their own tasks" ON api.tasks;

-- Create comprehensive RLS policies for tasks table

-- 1. SELECT Policy - Users can view their own tasks
CREATE POLICY "Users can view their own tasks" ON api.tasks
    FOR SELECT USING (auth.uid() = user_id);

-- 2. INSERT Policy - Users can insert tasks for themselves
CREATE POLICY "Users can insert their own tasks" ON api.tasks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. UPDATE Policy - Users can update their own tasks
CREATE POLICY "Users can update their own tasks" ON api.tasks
    FOR UPDATE USING (auth.uid() = user_id);

-- 4. DELETE Policy - Users can delete their own tasks
CREATE POLICY "Users can delete their own tasks" ON api.tasks
    FOR DELETE USING (auth.uid() = user_id);

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON api.tasks TO authenticated;
GRANT USAGE ON SEQUENCE api.tasks_id_seq TO authenticated;

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE schemaname = 'api' AND tablename = 'tasks'
ORDER BY policyname;

-- Test query to check if current user can access tasks
-- (This will only work when run by an authenticated user)
-- SELECT COUNT(*) as task_count FROM api.tasks;




