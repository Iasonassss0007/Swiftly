-- =====================================================
-- FIX SERVICE ROLE ACCESS TO PROFILES TABLE
-- =====================================================
-- This adds a policy to allow service role access to profiles
-- for the Python API server to fetch user profiles

-- Add policy for service role access to profiles
CREATE POLICY "Service role can access all profiles" ON api.profiles
    FOR SELECT USING (true);

-- Grant additional permissions to service role
GRANT SELECT ON api.profiles TO service_role;

-- Verify the policy was created
SELECT schemaname, tablename, policyname, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'api' AND tablename = 'profiles';
