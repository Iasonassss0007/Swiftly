-- =====================================================
-- AUTO PROFILE CREATION FOR SUPABASE AUTH USERS
-- =====================================================
-- This script automatically creates a profile in api.profiles
-- whenever a new user is created in auth.users
-- =====================================================

-- Step 1: Drop existing function and trigger to ensure clean setup
-- This prevents conflicts if the script is run multiple times
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS api.handle_new_user();

-- Step 2: Create the function that will handle profile creation
-- This function runs AFTER INSERT on auth.users table
CREATE OR REPLACE FUNCTION api.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Log the profile creation attempt for debugging
    RAISE NOTICE 'Creating profile for new user: % with email: %', NEW.id, NEW.email;
    
    -- Insert new profile into api.profiles table
    -- Use COALESCE to handle null full_name (defaults to empty string)
    INSERT INTO api.profiles (
        id,                    -- Maps to user_id from auth.users
        full_name,            -- From user metadata, defaults to empty string if null
        email,                -- User's email address
        created_at,           -- Current timestamp
        updated_at            -- Current timestamp (same as created_at initially)
    ) VALUES (
        NEW.id,                                              -- User ID from auth.users
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''), -- Full name from metadata or empty string
        NEW.email,                                           -- Email from auth.users
        NOW(),                                               -- Current timestamp
        NOW()                                                -- Current timestamp
    );
    
    -- Log successful profile creation
    RAISE NOTICE 'Profile created successfully for user: %', NEW.id;
    
    -- Return the NEW record to continue the trigger
    RETURN NEW;
    
EXCEPTION
    -- Handle any errors that occur during profile creation
    WHEN OTHERS THEN
        -- Log the error for debugging
        RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
        -- Return NEW to allow the user creation to continue even if profile creation fails
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Grant necessary permissions on the function
-- This allows the function to be executed by the trigger
GRANT EXECUTE ON FUNCTION api.handle_new_user() TO postgres;

-- Step 4: Create the trigger that calls our function
-- This trigger fires AFTER INSERT on auth.users table
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION api.handle_new_user();

-- Step 5: Verify the setup by checking what was created
-- This helps confirm everything is working correctly

-- Check if the function exists
SELECT 
    'Function Status' as check_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user') 
        THEN '✅ Function created successfully' 
        ELSE '❌ Function creation failed' 
    END as status;

-- Check if the trigger exists
SELECT 
    'Trigger Status' as check_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') 
        THEN '✅ Trigger created successfully' 
        ELSE '❌ Trigger creation failed' 
    END as status;

-- Check the trigger details
SELECT 
    'Trigger Details' as check_type,
    tgname as trigger_name,
    tgrelid::regclass as table_name,
    tgfoid::regproc as function_name,
    tgtype as trigger_type
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- =====================================================
-- TESTING THE SETUP
-- =====================================================
-- To test this setup, you can:
-- 1. Create a new user through Supabase Auth
-- 2. Check if a profile was automatically created in api.profiles
-- 3. Verify the profile has the correct user_id, full_name, and email

-- Test query to see recent profiles (uncomment to run):
-- SELECT 
--     p.id,
--     p.full_name,
--     p.email,
--     p.created_at,
--     u.created_at as user_created_at
-- FROM api.profiles p
-- JOIN auth.users u ON p.id = u.id
-- ORDER BY p.created_at DESC
-- LIMIT 5;

-- =====================================================
-- TROUBLESHOOTING
-- =====================================================
-- If profiles are not being created automatically:

-- 1. Check if the trigger exists:
-- SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- 2. Check if the function exists:
-- SELECT * FROM pg_proc WHERE proname = 'handle_new_user';

-- 3. Check trigger function permissions:
-- SELECT 
--     p.proname as function_name,
--     p.proacl as permissions
-- FROM pg_proc p 
-- WHERE p.proname = 'handle_new_user';

-- 4. Test the function manually (replace with actual user ID):
-- SELECT api.handle_new_user();

-- =====================================================
-- MANUAL PROFILE CREATION (for existing users)
-- =====================================================
-- If you need to create profiles for existing users who don't have them:

-- Create a function for manual profile creation
CREATE OR REPLACE FUNCTION api.create_missing_profiles()
RETURNS INTEGER AS $$
DECLARE
    user_record RECORD;
    profiles_created INTEGER := 0;
BEGIN
    -- Loop through all users who don't have profiles
    FOR user_record IN 
        SELECT 
            u.id,
            u.email,
            COALESCE(u.raw_user_meta_data->>'full_name', '') as full_name
        FROM auth.users u
        LEFT JOIN api.profiles p ON u.id = p.id
        WHERE p.id IS NULL
    LOOP
        BEGIN
            -- Insert profile for this user
            INSERT INTO api.profiles (id, full_name, email, created_at, updated_at)
            VALUES (
                user_record.id,
                user_record.full_name,
                user_record.email,
                NOW(),
                NOW()
            );
            
            profiles_created := profiles_created + 1;
            RAISE NOTICE 'Created profile for user: %', user_record.id;
            
        EXCEPTION
            WHEN OTHERS THEN
                RAISE WARNING 'Failed to create profile for user %: %', user_record.id, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE 'Total profiles created: %', profiles_created;
    RETURN profiles_created;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions on the manual profile creation function
GRANT EXECUTE ON FUNCTION api.create_missing_profiles() TO postgres;

-- =====================================================
-- SUMMARY
-- =====================================================
-- This script provides:
-- ✅ Automatic profile creation for new users
-- ✅ Error handling to prevent user creation failures
-- ✅ Manual profile creation for existing users
-- ✅ Comprehensive testing and verification
-- ✅ Detailed troubleshooting guidance
-- ✅ Safe to run multiple times

-- After running this script:
-- 1. All new users will automatically get profiles
-- 2. Your dashboard queries will work correctly
-- 3. Users will see their actual names instead of "User"
-- 4. The system is robust and handles errors gracefully
