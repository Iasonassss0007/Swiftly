-- Debug script to check tasks table setup
-- Run these queries one by one to identify the issue

-- 1. Check if the table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'tasks'
);

-- 2. Check table structure
\d tasks

-- 3. Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'tasks';

-- 4. Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'tasks';

-- 5. Check current user ID (run when authenticated)
SELECT auth.uid() as current_user_id;

-- 6. Try to select from tasks (run when authenticated)
SELECT COUNT(*) FROM tasks;

-- 7. Check permissions
SELECT grantee, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name = 'tasks';

-- 8. If table doesn't exist, check if types exist
SELECT typname FROM pg_type WHERE typname IN ('task_status', 'task_priority');


