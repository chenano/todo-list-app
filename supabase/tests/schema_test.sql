-- Test file to verify database schema and RLS policies
-- This file can be run in Supabase SQL editor to test the setup

-- Test 1: Verify tables exist
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('lists', 'tasks');

-- Test 2: Verify columns exist and have correct types
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('lists', 'tasks')
ORDER BY table_name, ordinal_position;

-- Test 3: Verify foreign key constraints
SELECT
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name IN ('lists', 'tasks');

-- Test 4: Verify RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('lists', 'tasks');

-- Test 5: Verify RLS policies exist
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
WHERE schemaname = 'public' 
AND tablename IN ('lists', 'tasks')
ORDER BY tablename, policyname;

-- Test 6: Verify indexes exist
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('lists', 'tasks')
ORDER BY tablename, indexname;

-- Test 7: Verify triggers exist
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE event_object_schema = 'public'
AND event_object_table IN ('lists', 'tasks')
ORDER BY event_object_table, trigger_name;