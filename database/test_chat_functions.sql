-- =====================================================
-- TEST CHAT FUNCTIONS
-- Run this to verify the chat system is working
-- =====================================================

-- Check if the api schema exists
SELECT 'Schema check' as test, 
       CASE WHEN schema_name = 'api' THEN '✅ api schema exists' 
            ELSE '❌ api schema missing' END as result
FROM information_schema.schemata 
WHERE schema_name = 'api';

-- Check if the chat_messages table exists
SELECT 'Table check' as test,
       CASE WHEN table_name = 'chat_messages' THEN '✅ chat_messages table exists'
            ELSE '❌ chat_messages table missing' END as result
FROM information_schema.tables 
WHERE table_schema = 'api' AND table_name = 'chat_messages';

-- Check if the functions exist
SELECT 'Function check' as test,
       routine_name,
       CASE WHEN routine_name IS NOT NULL THEN '✅ Function exists'
            ELSE '❌ Function missing' END as result
FROM information_schema.routines 
WHERE routine_schema = 'api' 
  AND routine_name IN ('get_conversation_history', 'save_chat_message', 'get_user_sessions')
ORDER BY routine_name;

-- Check RLS policies
SELECT 'RLS check' as test,
       CASE WHEN row_security = true THEN '✅ RLS enabled'
            ELSE '❌ RLS disabled' END as result
FROM pg_tables 
WHERE schemaname = 'api' AND tablename = 'chat_messages';

-- Check policies
SELECT 'Policy check' as test,
       COUNT(*) as policy_count,
       CASE WHEN COUNT(*) >= 4 THEN '✅ Policies exist'
            ELSE '❌ Missing policies' END as result
FROM pg_policies 
WHERE schemaname = 'api' AND tablename = 'chat_messages';

-- Test function execution (this will fail if not authenticated, but should show function exists)
DO $$
BEGIN
    RAISE NOTICE 'Testing function existence...';
    
    -- Check if function can be found
    IF EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'api' AND p.proname = 'get_conversation_history'
    ) THEN
        RAISE NOTICE '✅ get_conversation_history function found';
    ELSE
        RAISE NOTICE '❌ get_conversation_history function NOT found';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'api' AND p.proname = 'save_chat_message'
    ) THEN
        RAISE NOTICE '✅ save_chat_message function found';
    ELSE
        RAISE NOTICE '❌ save_chat_message function NOT found';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'api' AND p.proname = 'get_user_sessions'
    ) THEN
        RAISE NOTICE '✅ get_user_sessions function found';
    ELSE
        RAISE NOTICE '❌ get_user_sessions function NOT found';
    END IF;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error during function check: %', SQLERRM;
END $$;

-- Check recent_conversations view
SELECT 'View check' as test,
       CASE WHEN table_name = 'recent_conversations' THEN '✅ recent_conversations view exists'
            ELSE '❌ recent_conversations view missing' END as result
FROM information_schema.views 
WHERE table_schema = 'api' AND table_name = 'recent_conversations';

-- Summary
SELECT 'SUMMARY' as section,
       'Run this SQL file in your Supabase SQL editor to verify the chat system setup' as instruction;
