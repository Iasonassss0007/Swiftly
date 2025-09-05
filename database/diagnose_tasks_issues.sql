-- =====================================================
-- 🔍 TASKS TABLE DIAGNOSTIC SCRIPT
-- =====================================================
-- This script helps diagnose issues with the tasks table
-- Run this to understand the current database state
-- =====================================================

-- 1. Check if the tasks table exists and its structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_schema = 'api' AND table_name = 'tasks'
ORDER BY ordinal_position;

-- 2. Check table constraints
SELECT 
    constraint_name, 
    constraint_type, 
    table_name
FROM information_schema.table_constraints 
WHERE table_schema = 'api' AND table_name = 'tasks';

-- 3. Check foreign key constraints specifically
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'api' 
    AND tc.table_name = 'tasks';

-- 4. Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity, hasrls 
FROM pg_tables 
WHERE schemaname = 'api' AND tablename = 'tasks';

-- 5. Check existing RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE schemaname = 'api' AND tablename = 'tasks'
ORDER BY policyname;

-- 6. Check table permissions
SELECT 
    grantee, 
    privilege_type, 
    is_grantable
FROM information_schema.role_table_grants 
WHERE table_schema = 'api' AND table_name = 'tasks'
ORDER BY grantee, privilege_type;

-- 7. Check if there are any existing tasks (count)
SELECT COUNT(*) as total_tasks FROM api.tasks;

-- 8. Check unique user_ids in tasks (to see if foreign key constraint is working)
SELECT DISTINCT user_id FROM api.tasks LIMIT 5;

-- 9. Check if auth.users table exists and has data
SELECT COUNT(*) as total_users FROM auth.users;

-- 10. Test insert permissions (this will fail if RLS is blocking)
-- Note: This is a test query - it won't actually insert data
EXPLAIN (FORMAT TEXT) INSERT INTO api.tasks (user_id, title, description, status, priority) 
VALUES ('00000000-0000-0000-0000-000000000000', 'Test Task', 'Test Description', 'todo', 'medium');




