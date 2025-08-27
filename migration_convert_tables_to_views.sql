-- Migration: Convert recent_user_sessions and user_profile_summary tables to views
-- This migration preserves existing data in profiles and user_sessions tables
-- while converting the other two tables to views for better performance and data consistency

-- Step 1: Drop the existing tables/views if they exist
-- This ensures we can recreate them as views without conflicts
-- Handle both cases: if they exist as tables OR as views
-- Drop views first, then tables to avoid conflicts
DROP VIEW IF EXISTS api.recent_user_sessions CASCADE;
DROP VIEW IF EXISTS api.user_profile_summary CASCADE;
DROP TABLE IF EXISTS api.recent_user_sessions CASCADE;
DROP TABLE IF EXISTS api.user_profile_summary CASCADE;

-- Step 2: Create view for recent_user_sessions
-- This view returns the most recent session per user using DISTINCT ON
-- DISTINCT ON (user_id) ensures we get only one row per user (the most recent)
CREATE VIEW api.recent_user_sessions AS
SELECT DISTINCT ON (user_id) 
    user_id,
    id as session_id,
    session_data,
    created_at,
    updated_at
FROM api.user_sessions
ORDER BY user_id, created_at DESC;

-- Add comment to the view for documentation
COMMENT ON VIEW api.recent_user_sessions IS 'View showing the most recent session for each user, derived from user_sessions table using DISTINCT ON';

-- Step 3: Create view for user_profile_summary
-- This view aggregates data from both profiles and user_sessions tables
-- It shows user information along with session statistics
CREATE VIEW api.user_profile_summary AS
SELECT 
    p.id as user_id,
    p.email,
    p.full_name,
    p.avatar_url,
    -- Count total sessions for each user
    COUNT(us.id) AS total_sessions,
    -- Get the latest session timestamp (NULL if no sessions)
    MAX(us.created_at) AS latest_session_timestamp,
    -- Get the earliest session timestamp (NULL if no sessions)
    MIN(us.created_at) AS first_session_timestamp,
    -- Add any other profile columns that exist
    -- Modify this list based on your actual profiles table structure
    p.created_at AS profile_created_at,
    p.updated_at AS profile_updated_at
FROM api.profiles p
LEFT JOIN api.user_sessions us ON p.id = us.user_id
GROUP BY 
    p.id, 
    p.email, 
    p.full_name, 
    p.avatar_url, 
    p.created_at, 
    p.updated_at;

-- Add comment to the view for documentation
COMMENT ON VIEW api.user_profile_summary IS 'View showing user profiles with aggregated session statistics including total sessions and latest session timestamp';

-- Step 4: Verify the migration
-- These queries can be run to verify the views are working correctly
-- Uncomment and run these after the migration if you want to test:

/*
-- Test recent_user_sessions view
SELECT * FROM api.recent_user_sessions LIMIT 5;

-- Test user_profile_summary view  
SELECT * FROM api.user_profile_summary LIMIT 5;

-- Verify view definitions
SELECT schemaname, viewname, definition 
FROM pg_views 
WHERE viewname IN ('recent_user_sessions', 'user_profile_summary')
AND schemaname = 'api';
*/
