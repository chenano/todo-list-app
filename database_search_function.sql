-- Search function for Todo List App
-- Add this to your Supabase SQL Editor

-- Create a search function that searches across tasks and lists
CREATE OR REPLACE FUNCTION search_user_content(
  search_query TEXT,
  user_uuid UUID,
  search_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  item_type TEXT,
  item_id UUID,
  title TEXT,
  description TEXT,
  list_id UUID,
  list_name TEXT,
  priority TEXT,
  due_date DATE,
  completed BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  rank REAL
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  (
    -- Search in tasks
    SELECT 
      'task'::TEXT as item_type,
      t.id as item_id,
      t.title,
      t.description,
      t.list_id,
      l.name as list_name,
      t.priority,
      t.due_date,
      t.completed,
      t.created_at,
      ts_rank(
        to_tsvector('english', coalesce(t.title, '') || ' ' || coalesce(t.description, '')),
        plainto_tsquery('english', search_query)
      ) as rank
    FROM tasks t
    JOIN lists l ON t.list_id = l.id
    WHERE t.user_id = user_uuid
      AND (
        t.title ILIKE '%' || search_query || '%' OR
        t.description ILIKE '%' || search_query || '%' OR
        to_tsvector('english', coalesce(t.title, '') || ' ' || coalesce(t.description, '')) @@ plainto_tsquery('english', search_query)
      )
    
    UNION ALL
    
    -- Search in lists
    SELECT 
      'list'::TEXT as item_type,
      l.id as item_id,
      l.name as title,
      l.description,
      l.id as list_id,
      l.name as list_name,
      NULL::TEXT as priority,
      NULL::DATE as due_date,
      NULL::BOOLEAN as completed,
      l.created_at,
      ts_rank(
        to_tsvector('english', coalesce(l.name, '') || ' ' || coalesce(l.description, '')),
        plainto_tsquery('english', search_query)
      ) as rank
    FROM lists l
    WHERE l.user_id = user_uuid
      AND (
        l.name ILIKE '%' || search_query || '%' OR
        l.description ILIKE '%' || search_query || '%' OR
        to_tsvector('english', coalesce(l.name, '') || ' ' || coalesce(l.description, '')) @@ plainto_tsquery('english', search_query)
      )
  )
  ORDER BY rank DESC, created_at DESC
  LIMIT search_limit;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION search_user_content TO authenticated;