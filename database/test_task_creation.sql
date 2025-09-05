-- =====================================================
-- 🧪 TEST TASK CREATION AND QUERYING
-- =====================================================
-- Run this script to test if the tasks table is working correctly
-- =====================================================

-- 1. Check if the api schema exists
SELECT 'Schema Check' as test, 
       CASE 
           WHEN EXISTS(SELECT 1 FROM information_schema.schemata WHERE schema_name = 'api') 
           THEN '✅ api schema exists' 
           ELSE '❌ api schema missing' 
       END as result;

-- 2. Check if the tasks table exists
SELECT 'Tasks Table Check' as test, 
       CASE 
           WHEN EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'api' AND table_name = 'tasks') 
           THEN '✅ api.tasks table exists' 
           ELSE '❌ api.tasks table missing' 
       END as result;

-- 3. Check table structure
SELECT 'Table Structure' as test, 
       column_name, 
       data_type, 
       is_nullable
FROM information_schema.columns 
WHERE table_schema = 'api' 
  AND table_name = 'tasks'
ORDER BY ordinal_position;

-- 4. Check RLS policies
SELECT 'RLS Policies' as test, 
       policyname, 
       cmd, 
       qual
FROM pg_policies 
WHERE schemaname = 'api' 
  AND tablename = 'tasks';

-- 5. Check permissions
SELECT 'Permissions' as test, 
       grantee, 
       privilege_type
FROM information_schema.role_table_grants 
WHERE table_schema = 'api' 
  AND table_name = 'tasks';

-- 6. Test basic query (should work even without auth)
SELECT 'Basic Query Test' as test, 
       CASE 
           WHEN EXISTS(SELECT 1 FROM api.tasks LIMIT 1) 
           THEN '✅ Can query api.tasks table' 
           ELSE '❌ Cannot query api.tasks table' 
       END as result;

-- 7. Check if real-time is enabled
SELECT 'Real-time Check' as test, 
       CASE 
           WHEN EXISTS(SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'api' AND tablename = 'tasks') 
           THEN '✅ Real-time enabled for api.tasks' 
           ELSE '❌ Real-time not enabled for api.tasks' 
       END as result;

-- 8. Summary
SELECT 
    '📊 TASK TABLE SUMMARY' as summary,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'api' AND table_name = 'tasks') as table_exists,
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'api' AND tablename = 'tasks') as rls_policies_count,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'api' AND table_name = 'tasks') as column_count,
    (SELECT COUNT(*) FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'api' AND tablename = 'tasks') as realtime_enabled;
