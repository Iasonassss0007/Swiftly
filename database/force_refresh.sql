-- Force Supabase API schema refresh
-- Run this AFTER creating the tasks table

-- Method 1: Send reload signal to PostgREST
NOTIFY pgrst, 'reload schema';

-- Method 2: Update table to force cache invalidation
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS temp_refresh BOOLEAN DEFAULT FALSE;
ALTER TABLE tasks DROP COLUMN IF EXISTS temp_refresh;

-- Method 3: Force statistics update
ANALYZE tasks;

-- Method 4: Refresh materialized views (if any)
REFRESH MATERIALIZED VIEW CONCURRENTLY IF EXISTS api.tasks;

-- Verify table is accessible via API
SELECT 'Table verification' as status, 
       schemaname, 
       tablename, 
       rowsecurity as rls_enabled,
       tableowner
FROM pg_tables 
WHERE tablename = 'tasks';

-- Check API permissions
SELECT 'Permission check' as status,
       grantee,
       privilege_type,
       is_grantable
FROM information_schema.role_table_grants 
WHERE table_name = 'tasks' 
AND grantee IN ('authenticated', 'anon', 'service_role');

-- Final test query
SELECT 'API accessibility test' as test, count(*) as task_count FROM tasks;


