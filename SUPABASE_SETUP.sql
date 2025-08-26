-- Supabase Setup Script for Swiftly App
-- This script creates all necessary tables in the 'api' schema
-- Run this in your Supabase SQL Editor

-- 1. Create the api schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS api;

-- 2. Create profiles table in api schema
CREATE TABLE IF NOT EXISTS api.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create user_sessions table in api schema (optional, for session tracking)
CREATE TABLE IF NOT EXISTS api.user_sessions (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON api.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON api.profiles(created_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON api.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON api.user_sessions(expires_at);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE api.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE api.user_sessions ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies for profiles table
-- Users can only see and modify their own profile
CREATE POLICY "Users can view own profile" ON api.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON api.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON api.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can delete own profile" ON api.profiles
    FOR DELETE USING (auth.uid() = id);

-- 7. Create RLS policies for user_sessions table
-- Users can only see and modify their own sessions
CREATE POLICY "Users can view own sessions" ON api.user_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions" ON api.user_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON api.user_sessions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions" ON api.user_sessions
    FOR DELETE USING (auth.uid() = user_id);

-- 8. Create function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION api.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if profile already exists to avoid duplicates
    IF NOT EXISTS (SELECT 1 FROM api.profiles WHERE id = NEW.id) THEN
        INSERT INTO api.profiles (id, full_name, email)
        VALUES (
            NEW.id,
            COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
            NEW.email
        );
        RAISE NOTICE 'Profile created for user % with name %', NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Create trigger to call the function when a new user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION api.handle_new_user();

-- 10. Set the search_path to prioritize api schema
ALTER DATABASE postgres SET search_path TO api, public;

-- 11. Grant necessary permissions
GRANT USAGE ON SCHEMA api TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA api TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA api TO anon, authenticated;

-- 12. Create a function to get user profile with auth check
CREATE OR REPLACE FUNCTION api.get_user_profile(user_uuid UUID)
RETURNS TABLE (
    id UUID,
    full_name TEXT,
    email TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    -- Check if the requesting user is authenticated and requesting their own profile
    IF auth.uid() = user_uuid THEN
        RETURN QUERY
        SELECT p.id, p.full_name, p.email, p.avatar_url, p.created_at, p.updated_at
        FROM api.profiles p
        WHERE p.id = user_uuid;
    ELSE
        -- Return empty result if not authorized
        RETURN;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. Grant execute permission on the function
GRANT EXECUTE ON FUNCTION api.get_user_profile(UUID) TO anon, authenticated;

-- 14. Create a function to update user profile
CREATE OR REPLACE FUNCTION api.update_user_profile(
    user_uuid UUID,
    new_full_name TEXT DEFAULT NULL,
    new_avatar_url TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if the requesting user is authenticated and updating their own profile
    IF auth.uid() = user_uuid THEN
        UPDATE api.profiles
        SET 
            full_name = COALESCE(new_full_name, full_name),
            avatar_url = COALESCE(new_avatar_url, avatar_url),
            updated_at = NOW()
        WHERE id = user_uuid;
        
        RETURN FOUND;
    ELSE
        RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 15. Grant execute permission on the update function
GRANT EXECUTE ON FUNCTION api.update_user_profile(UUID, TEXT, TEXT) TO anon, authenticated;

-- 16. Create a function to manually create profile for existing users
CREATE OR REPLACE FUNCTION api.create_profile_manually(user_uuid UUID, full_name TEXT, user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if profile already exists
    IF EXISTS (SELECT 1 FROM api.profiles WHERE id = user_uuid) THEN
        RAISE NOTICE 'Profile already exists for user %', user_uuid;
        RETURN FALSE;
    END IF;
    
    -- Create profile
    INSERT INTO api.profiles (id, full_name, email)
    VALUES (user_uuid, full_name, user_email);
    
    RAISE NOTICE 'Profile created manually for user % with name %', user_uuid, full_name;
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 17. Grant execute permission on the manual profile creation function
GRANT EXECUTE ON FUNCTION api.create_profile_manually(UUID, TEXT, TEXT) TO anon, authenticated;

-- 18. Insert sample data (optional - for testing)
-- INSERT INTO api.profiles (id, full_name, email) VALUES 
-- ('00000000-0000-0000-0000-000000000000', 'Demo User', 'demo@example.com');

-- 19. Verify the setup
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'api'
ORDER BY tablename;

-- 20. Show RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'api'
ORDER BY tablename, policyname;
