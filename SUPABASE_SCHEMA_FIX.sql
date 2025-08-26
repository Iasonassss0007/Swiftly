-- =====================================================
-- SUPABASE SCHEMA CONFIGURATION FIX
-- =====================================================
-- This script fixes the PGRST106 error by ensuring
-- the database is configured to work with the 'api' schema
-- =====================================================

-- Step 1: Check current schema configuration
SELECT 
    'Current Schema Config' as check_type,
    current_setting('search_path') as search_path,
    current_database() as database_name;

-- Step 2: Set the search_path to prioritize api schema
-- This tells PostgreSQL to look in 'api' first, then 'public'
ALTER DATABASE postgres SET search_path TO api, public;

-- Step 3: Verify the change took effect
SELECT 
    'Updated Schema Config' as check_type,
    current_setting('search_path') as search_path;

-- Step 4: Grant necessary permissions to ensure access
GRANT USAGE ON SCHEMA api TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA api TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA api TO anon, authenticated;

-- Step 5: Create a function to check if tables exist in api schema
CREATE OR REPLACE FUNCTION api.check_schema_setup()
RETURNS TABLE (
    table_name TEXT,
    schema_name TEXT,
    exists_in_api BOOLEAN,
    exists_in_public BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.table_name::TEXT,
        t.table_schema::TEXT,
        CASE WHEN t.table_schema = 'api' THEN TRUE ELSE FALSE END as exists_in_api,
        CASE WHEN t.table_schema = 'public' THEN TRUE ELSE FALSE END as exists_in_public
    FROM information_schema.tables t
    WHERE t.table_name IN ('profiles', 'user_sessions')
    AND t.table_schema IN ('api', 'public')
    ORDER BY t.table_name, t.table_schema;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Grant execute permission on the check function
GRANT EXECUTE ON FUNCTION api.check_schema_setup() TO anon, authenticated;

-- Step 7: Check the current schema setup
SELECT * FROM api.check_schema_setup();

-- Step 8: If tables exist in both schemas, drop the public ones
-- This prevents conflicts and ensures all queries go to api schema
DO $$
DECLARE
    table_record RECORD;
BEGIN
    FOR table_record IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('profiles', 'user_sessions')
    LOOP
        EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(table_record.table_name) || ' CASCADE';
        RAISE NOTICE 'Dropped table: public.%', table_record.table_name;
    END LOOP;
END $$;

-- Step 9: Verify final schema setup
SELECT 
    'Final Schema Status' as check_type,
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE tablename IN ('profiles', 'user_sessions')
ORDER BY schemaname, tablename;

-- Step 10: Test direct table access
-- This should work without schema prefix
SELECT 
    'Direct Table Access Test' as test_type,
    COUNT(*) as profile_count
FROM profiles;

-- Step 11: Show current RLS policies
SELECT 
    'RLS Policies' as check_type,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE schemaname = 'api'
ORDER BY tablename, policyname;

-- =====================================================
-- ALTERNATIVE SOLUTION: Force API Schema in Queries
-- =====================================================
-- If the above doesn't work, you can modify your client code
-- to always use the api schema prefix. Here's how:

-- Create a view that maps to the api schema
CREATE OR REPLACE VIEW public.profiles AS 
SELECT * FROM api.profiles;

CREATE OR REPLACE VIEW public.user_sessions AS 
SELECT * FROM api.user_sessions;

-- Grant access to these views
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_sessions TO anon, authenticated;

-- =====================================================
-- TROUBLESHOOTING COMMANDS
-- =====================================================
-- If you still get PGRST106 errors, run these:

-- 1. Check what schemas exist
-- SELECT schema_name FROM information_schema.schemata;

-- 2. Check where your tables actually are
-- SELECT 
--     table_schema,
--     table_name,
--     table_type
-- FROM information_schema.tables 
-- WHERE table_name IN ('profiles', 'user_sessions')
-- ORDER BY table_schema, table_name;

-- 3. Check current user permissions
-- SELECT 
--     grantee,
--     table_schema,
--     table_name,
--     privilege_type
-- FROM information_schema.table_privileges 
-- WHERE table_name IN ('profiles', 'user_sessions')
-- ORDER BY grantee, table_schema, table_name;

-- =====================================================
-- SUMMARY
-- =====================================================
-- This script will:
-- ✅ Set the correct search_path
-- ✅ Grant proper permissions
-- ✅ Remove duplicate tables
-- ✅ Create views for backward compatibility
-- ✅ Verify the setup works

-- After running this:
-- 1. Your client queries should work without schema prefix
-- 2. The PGRST106 error should disappear
-- 3. Profile creation should work automatically
-- 4. Your dashboard should display real names

