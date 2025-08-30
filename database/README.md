# Tasks Database Setup

This document explains how to set up the tasks database schema in Supabase and integrate it with the application.

## Database Schema

The tasks table includes the following features:

### Table Structure
- **Primary Key**: UUID with automatic generation
- **Foreign Key**: Links to Supabase auth.users table
- **Enums**: Custom types for status and priority
- **JSONB Fields**: Flexible storage for complex data (assignees, subtasks, etc.)
- **Timestamps**: Automatic creation and update tracking
- **Row Level Security**: Users can only access their own tasks

### Key Features
1. **RLS Policies**: Secure access control
2. **Automatic Triggers**: Auto-update timestamps
3. **Optimized Indexes**: Fast queries and filtering
4. **Data Validation**: Constraints for data integrity

## Setup Instructions

### 1. Run the SQL Schema

Execute the SQL in `tasks_schema.sql` in your Supabase SQL editor:

```sql
-- Copy and paste the entire contents of tasks_schema.sql
-- This will create the table, indexes, triggers, and RLS policies
```

### 2. Verify Setup

After running the schema, verify:

1. **Table exists**: Check the Tables section in Supabase dashboard
2. **RLS enabled**: Ensure Row Level Security is active
3. **Policies created**: Verify the 4 RLS policies are in place
4. **Indexes created**: Check that performance indexes exist

### 3. Test the Integration

1. **Authentication**: Ensure users can log in
2. **Create Task**: Test task creation from the UI
3. **View Tasks**: Verify tasks appear in the list
4. **Update Tasks**: Test editing and status changes
5. **Delete Tasks**: Confirm deletion works properly

## Database Operations

The application performs these database operations:

### CREATE
- Insert new tasks with all metadata
- Auto-generate UUID and timestamps
- Link to authenticated user

### READ
- Fetch all tasks for logged-in user
- Order by creation date (newest first)
- Filter by user ID through RLS

### UPDATE
- Modify task properties
- Auto-update timestamp
- Maintain user ownership

### DELETE
- Remove tasks permanently
- Respect user ownership through RLS
- Support bulk operations

## Security Features

### Row Level Security (RLS)
- **View Policy**: Users see only their tasks
- **Insert Policy**: Users create tasks for themselves
- **Update Policy**: Users modify only their tasks
- **Delete Policy**: Users delete only their tasks

### Data Validation
- **Title**: Required, 1-500 characters
- **Description**: Optional, max 2000 characters
- **Status**: Must be valid enum value
- **Priority**: Must be valid enum value

## Performance Optimizations

### Indexes
- `user_id`: Fast user-specific queries
- `status`: Quick filtering by task status
- `due_date`: Efficient date-based sorting
- `created_at`: Chronological ordering
- `user_id + status`: Compound index for common queries

### Data Types
- **UUID**: Primary keys for scalability
- **TIMESTAMPTZ**: Timezone-aware dates
- **JSONB**: Efficient JSON storage and queries
- **Arrays**: Native PostgreSQL array support

## Troubleshooting

### Common Issues

1. **RLS Errors**
   - Ensure user is authenticated
   - Check RLS policies are active
   - Verify user ID matches auth.uid()

2. **Permission Denied**
   - Confirm user has authenticated session
   - Check if RLS policies allow the operation
   - Verify user owns the task being accessed

3. **Data Validation Errors**
   - Check title is not empty
   - Ensure status/priority are valid enum values
   - Verify text fields don't exceed limits

### Debugging Queries

```sql
-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'tasks';

-- View RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'tasks';

-- Check user's tasks
SELECT * FROM tasks WHERE user_id = auth.uid();
```

## Migration Notes

When updating the schema:

1. **Backup Data**: Always backup before schema changes
2. **Test Migration**: Run on development first
3. **Update Indexes**: Ensure indexes match new queries
4. **Verify RLS**: Check policies still work correctly
5. **Update App Code**: Modify application to match schema changes

## Best Practices

1. **Always use RLS**: Never disable Row Level Security
2. **Validate Input**: Check data before database operations
3. **Handle Errors**: Provide user-friendly error messages
4. **Optimize Queries**: Use appropriate indexes and filters
5. **Monitor Performance**: Watch for slow queries and bottlenecks
