# 🗄️ Swiftly App - Supabase Database Setup Guide

This guide will help you set up the complete database structure for your Swiftly application in Supabase.

## 📋 What's Included

The database setup includes:

- **`profiles` table** - User profile information
- **`user_sessions` table** - User session tracking
- **Row Level Security (RLS)** - Data protection policies
- **Automatic timestamps** - Created/updated tracking
- **Helper functions** - Common database operations
- **Views** - Data analysis and reporting

## 🚀 Quick Setup (Recommended for First Time)

### Option 1: Quick Setup (Minimal)
Use `SUPABASE_QUICK_SETUP.sql` for a basic setup with just the essential tables and policies.

### Option 2: Full Setup (Complete)
Use `SUPABASE_SETUP.sql` for a complete setup with all features, functions, and views.

## 🔧 Step-by-Step Setup

### 1. Access Supabase SQL Editor
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**

### 2. Run the SQL Script
1. Copy the entire content of your chosen SQL file
2. Paste it into the SQL Editor
3. Click **Run** to execute the script

### 3. Verify Setup
After running the script, you should see:
- Tables created successfully
- RLS policies enabled
- Permissions granted
- Verification queries showing results

## 📊 Database Schema

### Profiles Table (`api.profiles`)
```sql
- id (UUID, Primary Key) - References auth.users(id)
- full_name (TEXT, Required) - User's full name
- email (TEXT, Required, Unique) - User's email
- avatar_url (TEXT, Optional) - Profile picture URL
- created_at (TIMESTAMP) - When profile was created
- updated_at (TIMESTAMP) - When profile was last updated
```

### User Sessions Table (`api.user_sessions`)
```sql
- id (BIGSERIAL, Primary Key) - Auto-incrementing ID
- user_id (UUID, Required) - References auth.users(id)
- session_data (JSONB) - Session information and metadata
- created_at (TIMESTAMP) - When session was logged
- updated_at (TIMESTAMP) - When session was last updated
```

## 🔒 Security Features

### Row Level Security (RLS)
- **Profiles**: Users can only access their own profile
- **User Sessions**: Users can only access their own sessions
- **Authentication Required**: All operations require valid user session

### RLS Policies
- **SELECT**: Users can view their own data
- **INSERT**: Users can create their own records
- **UPDATE**: Users can modify their own data
- **DELETE**: Users can delete their own records

## 🛠️ Helper Functions

### `api.get_user_profile(user_uuid)`
Returns a user's profile information with error handling.

### `api.ensure_user_profile(user_uuid, full_name, email)`
Creates a user profile if it doesn't exist.

### `api.log_user_session(user_uuid, event, data)`
Logs user session activity for tracking.

## 📈 Views for Analysis

### `api.user_profile_summary`
Shows user profiles with session counts and last activity.

### `api.recent_user_sessions`
Displays recent user sessions with profile information.

## 🔍 Testing Your Setup

### 1. Test Authentication Flow
1. Start your Swiftly app
2. Try to sign up with a new account
3. Verify profile is created automatically
4. Check sign in works correctly

### 2. Verify Database Tables
In Supabase Dashboard → Table Editor:
- Check `api.profiles` table exists
- Check `api.user_sessions` table exists
- Verify RLS is enabled on both tables

### 3. Test RLS Policies
1. Sign in with one account
2. Try to access data from another account
3. Verify access is properly restricted

## 🚨 Troubleshooting

### Common Issues

#### "Table doesn't exist" Error
- Make sure you ran the SQL script in the correct project
- Check that the `api` schema exists
- Verify the script executed without errors

#### "Permission denied" Error
- Ensure RLS policies are created correctly
- Check that the user is authenticated
- Verify the `api` schema permissions

#### "Foreign key constraint" Error
- Make sure Supabase Auth is enabled
- Check that the `auth.users` table exists
- Verify the user ID references are correct

### Debug Steps
1. Check Supabase logs for errors
2. Verify all SQL statements executed successfully
3. Test with a simple query first
4. Check browser console for client-side errors

## 📚 Advanced Usage

### Customizing the Schema
You can modify the tables to add additional fields:

```sql
-- Add a new field to profiles
ALTER TABLE api.profiles ADD COLUMN phone_number TEXT;

-- Add a new field to user_sessions
ALTER TABLE api.user_sessions ADD COLUMN ip_address INET;
```

### Adding New RLS Policies
```sql
-- Example: Allow admins to view all profiles
CREATE POLICY "Admins can view all profiles" ON api.profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM api.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
```

### Creating Custom Functions
```sql
-- Example: Function to get user statistics
CREATE OR REPLACE FUNCTION api.get_user_stats(user_uuid UUID)
RETURNS TABLE (
    profile_created TIMESTAMP WITH TIME ZONE,
    total_sessions BIGINT,
    last_activity TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.created_at,
        COUNT(us.id),
        MAX(us.created_at)
    FROM api.profiles p
    LEFT JOIN api.user_sessions us ON p.id = us.user_id
    WHERE p.id = user_uuid
    GROUP BY p.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## 🔄 Maintenance

### Regular Tasks
- Monitor user session logs for unusual activity
- Clean up old session data if needed
- Review RLS policies for security updates
- Backup important data regularly

### Performance Optimization
- The tables include indexes for common queries
- JSONB fields are optimized for querying
- Consider partitioning for large datasets

## 📞 Support

If you encounter issues:

1. **Check the troubleshooting section** above
2. **Verify your SQL script** executed completely
3. **Check Supabase logs** for server-side errors
4. **Review browser console** for client-side errors
5. **Ensure environment variables** are set correctly

## 🎉 Success Indicators

Your setup is working correctly when:

- ✅ Users can sign up and sign in
- ✅ Profiles are created automatically
- ✅ Dashboard displays user information
- ✅ Session activity is logged
- ✅ RLS policies restrict data access
- ✅ No permission errors in console

---

**Your Swiftly app database is now ready for production use! 🚀**
