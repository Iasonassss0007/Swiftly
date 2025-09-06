-- =====================================================
-- 🔄 RECREATE TASKS TABLE ONLY
-- =====================================================
-- This script drops and recreates ONLY the tasks table
-- with proper structure, constraints, indexes, and RLS policies
-- =====================================================

-- 1. Drop existing tasks table and related objects
DROP TABLE IF EXISTS api.tasks CASCADE;

-- 2. Create the tasks table with proper structure
CREATE TABLE api.tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text NULL,
  status text NOT NULL DEFAULT 'todo'::text,
  priority text NOT NULL DEFAULT 'medium'::text,
  due_date timestamp with time zone NULL,
  completed boolean NOT NULL DEFAULT false,
  tags text[] NULL,
  assignees text[] NULL,
  subtasks jsonb NULL DEFAULT '[]'::jsonb,
  attachments jsonb NULL DEFAULT '[]'::jsonb,
  comments jsonb NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  -- Primary key
  CONSTRAINT tasks_pkey PRIMARY KEY (id),
  
  -- Foreign key to auth.users
  CONSTRAINT tasks_user_id_fkey FOREIGN KEY (user_id) 
    REFERENCES auth.users (id) ON DELETE CASCADE,
  
  -- Check constraints
  CONSTRAINT tasks_priority_check CHECK (
    priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text])
  ),
  CONSTRAINT tasks_status_check CHECK (
    status = ANY (ARRAY['todo'::text, 'in_progress'::text, 'done'::text])
  )
);

-- 3. Create indexes for performance
CREATE INDEX idx_tasks_user_id ON api.tasks USING btree (user_id);
CREATE INDEX idx_tasks_status ON api.tasks USING btree (status);
CREATE INDEX idx_tasks_priority ON api.tasks USING btree (priority);
CREATE INDEX idx_tasks_completed ON api.tasks USING btree (completed);
CREATE INDEX idx_tasks_due_date ON api.tasks USING btree (due_date);
CREATE INDEX idx_tasks_created_at ON api.tasks USING btree (created_at DESC);
CREATE INDEX idx_tasks_user_status ON api.tasks USING btree (user_id, status);
CREATE INDEX idx_tasks_user_priority ON api.tasks USING btree (user_id, priority);
CREATE INDEX idx_tasks_user_completed ON api.tasks USING btree (user_id, completed);

-- 4. Create update timestamp function if it doesn't exist
CREATE OR REPLACE FUNCTION api.update_task_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Create trigger for automatic timestamp updates
CREATE TRIGGER trigger_update_task_timestamp
    BEFORE UPDATE ON api.tasks
    FOR EACH ROW
    EXECUTE FUNCTION api.update_task_timestamp();

-- 6. Enable Row Level Security
ALTER TABLE api.tasks ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies
CREATE POLICY "Users can view their own tasks" ON api.tasks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tasks" ON api.tasks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks" ON api.tasks
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks" ON api.tasks
    FOR DELETE USING (auth.uid() = user_id);

-- 8. Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON api.tasks TO authenticated;
GRANT USAGE ON SCHEMA api TO authenticated;

-- 9. Verify the table was created successfully
SELECT 
    'Tasks table created successfully!' as status,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'api' AND tablename = 'tasks';

-- Show table structure
\d api.tasks;








