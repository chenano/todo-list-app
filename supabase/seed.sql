-- This file is used to seed the database with initial data for development/testing
-- Note: This will only run in local development, not in production

-- Insert test users (these would normally be created through Supabase Auth)
-- For local testing, we can insert directly into auth.users if needed

-- Example seed data (commented out as it requires actual user IDs from auth)
-- INSERT INTO lists (user_id, name, description) VALUES 
--   ('user-uuid-1', 'Personal Tasks', 'My personal to-do items'),
--   ('user-uuid-1', 'Work Projects', 'Tasks related to work'),
--   ('user-uuid-2', 'Shopping List', 'Items to buy');

-- INSERT INTO tasks (list_id, user_id, title, description, priority, due_date) VALUES
--   ('list-uuid-1', 'user-uuid-1', 'Complete project proposal', 'Write and submit the Q1 project proposal', 'high', '2024-01-15'),
--   ('list-uuid-1', 'user-uuid-1', 'Review team feedback', 'Go through all team feedback from last sprint', 'medium', '2024-01-10'),
--   ('list-uuid-2', 'user-uuid-1', 'Prepare presentation', 'Create slides for client meeting', 'high', '2024-01-12'),
--   ('list-uuid-3', 'user-uuid-2', 'Buy groceries', 'Milk, bread, eggs, fruits', 'low', '2024-01-08');

-- Note: In a real application, seed data would be created after users sign up
-- This file serves as a template for the data structure