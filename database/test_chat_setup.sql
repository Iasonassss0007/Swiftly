-- =====================================================
-- CHAT DATABASE SETUP TEST SCRIPT
-- Run this after running chat_messages_api_schema.sql
-- =====================================================

-- Test 1: Verify tables exist in public schema
SELECT 'Testing table existence...' as test_step;

SELECT 
    table_name, 
    table_schema,
    CASE 
        WHEN table_schema = 'public' THEN '✅ OK'
        ELSE '❌ WRONG SCHEMA'
    END as status
FROM information_schema.tables 
WHERE table_name IN ('chat_sessions', 'chat_messages', 'chat_message_attachments')
ORDER BY table_name;

-- Test 2: Verify functions exist in public schema
SELECT 'Testing function existence...' as test_step;

SELECT 
    routine_name, 
    routine_schema,
    CASE 
        WHEN routine_schema = 'public' THEN '✅ OK'
        ELSE '❌ WRONG SCHEMA'
    END as status
FROM information_schema.routines 
WHERE routine_name IN ('create_chat_session', 'save_chat_message', 'get_conversation_history')
ORDER BY routine_name;

-- Test 3: Verify views exist in public schema
SELECT 'Testing view existence...' as test_step;

SELECT 
    table_name, 
    table_schema,
    CASE 
        WHEN table_schema = 'public' THEN '✅ OK'
        ELSE '❌ WRONG SCHEMA'
    END as status
FROM information_schema.tables 
WHERE table_name IN ('recent_conversations', 'message_analytics')
AND table_type = 'VIEW'
ORDER BY table_name;

-- Test 4: Test function calls (if user is authenticated)
DO $$
DECLARE
    test_user_id UUID := auth.uid();
    test_session_id UUID;
    test_message_id UUID;
BEGIN
    IF test_user_id IS NOT NULL THEN
        RAISE NOTICE 'Testing function calls with authenticated user: %', test_user_id;
        
        -- Test session creation
        SELECT create_chat_session(test_user_id, 'Test Session') INTO test_session_id;
        RAISE NOTICE '✅ create_chat_session: Created session %', test_session_id;
        
        -- Test message saving
        SELECT save_chat_message(
            test_session_id,
            test_user_id,
            'Hello, this is a test message!',
            'user'
        ) INTO test_message_id;
        RAISE NOTICE '✅ save_chat_message: Saved message %', test_message_id;
        
        -- Test conversation history
        PERFORM get_conversation_history(test_session_id, 10);
        RAISE NOTICE '✅ get_conversation_history: Function executed successfully';
        
        -- Clean up test data
        DELETE FROM chat_messages WHERE session_id = test_session_id;
        DELETE FROM chat_sessions WHERE id = test_session_id;
        RAISE NOTICE '✅ Test cleanup completed';
        
    ELSE
        RAISE NOTICE '⚠️ User not authenticated - skipping function tests';
    END IF;
END $$;

-- Test 5: Verify RLS policies
SELECT 'Testing RLS policies...' as test_step;

SELECT 
    schemaname,
    tablename,
    policyname,
    CASE 
        WHEN policyname IS NOT NULL THEN '✅ ENABLED'
        ELSE '❌ MISSING'
    END as rls_status
FROM pg_tables 
WHERE tablename IN ('chat_sessions', 'chat_messages', 'chat_message_attachments')
AND schemaname = 'public';

-- Test 6: Verify permissions
SELECT 'Testing permissions...' as test_step;

SELECT 
    table_name,
    privilege_type,
    grantee,
    CASE 
        WHEN grantee IN ('authenticated', 'service_role') THEN '✅ OK'
        ELSE '❌ WRONG GRANTEE'
    END as permission_status
FROM information_schema.role_table_grants 
WHERE table_name IN ('chat_sessions', 'chat_messages', 'chat_message_attachments')
AND table_schema = 'public'
ORDER BY table_name, privilege_type;

-- Final status
SELECT 
    CASE 
        WHEN COUNT(*) = 3 THEN '✅ ALL TABLES EXIST IN PUBLIC SCHEMA'
        ELSE '❌ SOME TABLES MISSING OR IN WRONG SCHEMA'
    END as final_status,
    COUNT(*) as tables_found
FROM information_schema.tables 
WHERE table_name IN ('chat_sessions', 'chat_messages', 'chat_message_attachments')
AND table_schema = 'public';

