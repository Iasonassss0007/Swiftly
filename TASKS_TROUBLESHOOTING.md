# Tasks Page Troubleshooting Guide

This guide helps diagnose and fix issues with task persistence and loading in the Swiftly application.

## Quick Fix Summary

The tasks page has been updated with the following improvements:

### 1. Fixed Database Type Definitions
- Added complete `tasks` table type definition in `lib/supabase.ts`
- Removed type casting `(supabase as any)` for proper TypeScript support
- Ensured all database operations are properly typed

### 2. Enhanced Task Fetching
- Improved `fetchTasks` function with better error handling and logging
- Added automatic retries and comprehensive error reporting
- Enabled `revalidateOnMount: true` for fresh data on page load

### 3. Real-time Updates
- Implemented Supabase real-time subscriptions for live task updates
- Tasks now sync automatically across browser tabs
- Changes appear immediately with optimistic updates

### 4. Debug Tools
- Added development-mode debug panel showing current state
- Comprehensive console logging for troubleshooting
- Test API endpoint at `/api/tasks/test?userId=YOUR_USER_ID`

## Common Issues and Solutions

### Issue: Tasks disappear after page refresh

**Symptoms:**
- Tasks save correctly but don't appear after refresh
- Debug panel shows "Tasks Count: 0"
- No error messages in console

**Solutions:**

1. **Check Authentication:**
   ```typescript
   // Verify user ID is available
   console.log('User ID:', user?.id)
   ```

2. **Test Database Connection:**
   ```
   GET /api/tasks/test?userId=YOUR_USER_ID
   ```

3. **Check RLS Policies:**
   ```sql
   -- Run in Supabase SQL editor
   SELECT * FROM api.tasks WHERE user_id = 'YOUR_USER_ID';
   ```

### Issue: Database connection errors

**Symptoms:**
- Error messages about table not found
- RLS policy violations
- Permission denied errors

**Solutions:**

1. **Verify Database Schema:**
   ```sql
   -- Check if tasks table exists
   SELECT * FROM information_schema.tables 
   WHERE table_schema = 'api' AND table_name = 'tasks';
   ```

2. **Re-run Schema Setup:**
   ```sql
   -- Execute the complete schema from database/tasks_schema_final.sql
   ```

3. **Check Environment Variables:**
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```

### Issue: Real-time updates not working

**Symptoms:**
- Tasks don't sync between browser tabs
- Changes made in one session don't appear in others
- No real-time subscription logs in console

**Solutions:**

1. **Enable Real-time in Supabase:**
   - Go to Database > Replication in Supabase dashboard
   - Enable replication for the `tasks` table

2. **Check Subscription Status:**
   ```typescript
   // Look for these logs in console:
   // "Setting up real-time subscription for user: USER_ID"
   // "Real-time subscription status: SUBSCRIBED"
   ```

### Issue: Performance problems

**Symptoms:**
- Slow task loading
- UI freezing during operations
- High memory usage

**Solutions:**

1. **Optimize Cache Settings:**
   ```typescript
   // Adjust in lib/cache-provider.tsx
   dedupingInterval: 5 * 60 * 1000, // 5 minutes
   refreshInterval: 5 * 60 * 1000,   // 5 minutes
   ```

2. **Check Network Tab:**
   - Look for duplicate API calls
   - Verify caching is working
   - Check for memory leaks

## Diagnostic Commands

### Check Current State
```javascript
// Run in browser console on tasks page
console.log('Tasks loaded:', window.__swrState?.cache?.size)
console.log('User ID:', document.querySelector('[data-user-id]')?.dataset.userId)
```

### Test Database Access
```bash
# Replace YOUR_USER_ID with actual user ID
curl "http://localhost:3000/api/tasks/test?userId=YOUR_USER_ID"
```

### Verify Schema
```sql
-- Run in Supabase SQL editor
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'api' AND table_name = 'tasks'
ORDER BY ordinal_position;
```

## Debug Panel Usage

In development mode, a debug panel appears at the top of the tasks page showing:

- **User ID**: Current authenticated user
- **Tasks Count**: Number of tasks loaded
- **Is Loading**: Whether data is currently being fetched
- **Has Error**: Whether there's an error state
- **Error Message**: Specific error details if any

Use the "Manual Refresh" button to force a data reload.

## File Changes Made

### Updated Files:
1. `lib/supabase.ts` - Added tasks table type definitions
2. `lib/use-cached-data.tsx` - Enhanced fetching, real-time updates, error handling
3. `lib/cache-provider.tsx` - Improved cache configuration
4. `app/dashboard/tasks/page.tsx` - Added debug panel and comprehensive comments

### New Files:
1. `app/api/tasks/test/route.ts` - Database testing endpoint
2. `TASKS_TROUBLESHOOTING.md` - This troubleshooting guide

## Prevention Tips

1. **Always test with real user data** after authentication
2. **Monitor console logs** for real-time subscription status
3. **Use debug panel** in development to verify state
4. **Test across browser tabs** to verify real-time sync
5. **Check Supabase dashboard** for RLS policy issues

## Getting Help

If issues persist:

1. **Enable debug panel** by setting `NODE_ENV=development`
2. **Check browser console** for detailed error logs
3. **Use test endpoint** to verify database connectivity
4. **Verify Supabase configuration** in dashboard
5. **Check network tab** for failed API calls

The implementation now includes comprehensive error handling, logging, and debugging tools to prevent and diagnose future issues.
