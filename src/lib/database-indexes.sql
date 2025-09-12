-- Database indexes for performance optimization
-- These should be applied to your Supabase database

-- Index for tasks by list_id (most common query)
CREATE INDEX IF NOT EXISTS idx_tasks_list_id ON tasks(list_id);

-- Index for tasks by user_id (for user-wide queries)
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);

-- Index for tasks by completion status
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed);

-- Index for tasks by priority
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);

-- Index for tasks by due_date (for overdue queries)
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);

-- Index for tasks by created_at (for sorting)
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);

-- Index for tasks by updated_at (for sorting)
CREATE INDEX IF NOT EXISTS idx_tasks_updated_at ON tasks(updated_at);

-- Composite index for common filter combinations
CREATE INDEX IF NOT EXISTS idx_tasks_list_completed ON tasks(list_id, completed);
CREATE INDEX IF NOT EXISTS idx_tasks_list_priority ON tasks(list_id, priority);
CREATE INDEX IF NOT EXISTS idx_tasks_list_due_date ON tasks(list_id, due_date);

-- Composite index for overdue tasks
CREATE INDEX IF NOT EXISTS idx_tasks_overdue ON tasks(due_date, completed) WHERE due_date IS NOT NULL;

-- Index for user tasks with filters
CREATE INDEX IF NOT EXISTS idx_tasks_user_completed ON tasks(user_id, completed);
CREATE INDEX IF NOT EXISTS idx_tasks_user_priority ON tasks(user_id, priority);

-- Index for lists by user_id
CREATE INDEX IF NOT EXISTS idx_lists_user_id ON lists(user_id);

-- Index for lists by created_at (for sorting)
CREATE INDEX IF NOT EXISTS idx_lists_created_at ON lists(created_at);

-- Index for lists by updated_at (for sorting)
CREATE INDEX IF NOT EXISTS idx_lists_updated_at ON lists(updated_at);

-- Partial indexes for better performance on specific queries
CREATE INDEX IF NOT EXISTS idx_tasks_incomplete ON tasks(list_id, created_at) WHERE completed = false;
CREATE INDEX IF NOT EXISTS idx_tasks_completed_recent ON tasks(list_id, updated_at) WHERE completed = true;

-- Full-text search index for task titles and descriptions
CREATE INDEX IF NOT EXISTS idx_tasks_search ON tasks USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));

-- Index for real-time subscriptions
CREATE INDEX IF NOT EXISTS idx_tasks_realtime ON tasks(list_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_lists_realtime ON lists(user_id, updated_at);