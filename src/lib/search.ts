import Fuse, { IFuseOptions } from 'fuse.js';
import { createClient } from '@/lib/supabase/client';
import type { Task, List } from '@/types';

// Search result types
export interface SearchResult {
  type: 'task' | 'list';
  item: Task | List;
  matches: TextMatch[];
  listName?: string;
  score?: number;
}

export interface TextMatch {
  field: 'title' | 'description' | 'name';
  start: number;
  end: number;
  text: string;
}

export interface SearchFilters {
  type?: 'all' | 'tasks' | 'lists';
  priority?: 'all' | 'low' | 'medium' | 'high';
  completed?: 'all' | 'completed' | 'incomplete';
  dateRange?: {
    start?: string;
    end?: string;
    field: 'created_at' | 'due_date';
  };
  listId?: string;
}

export interface SearchOptions {
  query: string;
  filters?: SearchFilters;
  limit?: number;
  includeHighlights?: boolean;
}

// Fuse.js configuration for client-side fuzzy search
const fuseOptions: IFuseOptions<Task | List> = {
  keys: [
    { name: 'title', weight: 0.7 },
    { name: 'name', weight: 0.7 }, // for lists
    { name: 'description', weight: 0.3 },
  ],
  threshold: 0.4, // Lower = more strict matching
  distance: 100,
  includeScore: true,
  includeMatches: true,
  minMatchCharLength: 2,
};

// Server-side search using Supabase function
export async function searchServerSide(options: SearchOptions): Promise<SearchResult[]> {
  const { query, filters = {}, limit = 50 } = options;
  
  if (!query.trim()) {
    return [];
  }

  try {
    const supabase = createClient();
    
    // Try the RPC function first
    const { data, error } = await supabase.rpc('search_user_content', {
      search_query: query.trim(),
      user_uuid: (await supabase.auth.getUser()).data.user?.id,
      search_limit: limit,
    });

    if (error) {
      console.warn('Server-side search RPC not available, falling back to basic search:', error);
      // Fallback to basic search using direct queries
      return await searchWithDirectQueries(options);
    }

    // Apply additional filters
    let filteredData = data || [];
    
    if (filters.type && filters.type !== 'all') {
      filteredData = filteredData.filter((item: any) => item.item_type === filters.type);
    }
    
    if (filters.priority && filters.priority !== 'all') {
      filteredData = filteredData.filter((item: any) => 
        item.item_type === 'task' && item.priority === filters.priority
      );
    }
    
    if (filters.completed && filters.completed !== 'all') {
      const isCompleted = filters.completed === 'completed';
      filteredData = filteredData.filter((item: any) => 
        item.item_type === 'task' && item.completed === isCompleted
      );
    }
    
    if (filters.listId) {
      filteredData = filteredData.filter((item: any) => item.list_id === filters.listId);
    }
    
    if (filters.dateRange) {
      const { start, end, field } = filters.dateRange;
      filteredData = filteredData.filter((item: any) => {
        const dateValue = field === 'due_date' ? item.due_date : item.created_at;
        if (!dateValue) return false;
        
        const itemDate = new Date(dateValue);
        if (start && itemDate < new Date(start)) return false;
        if (end && itemDate > new Date(end)) return false;
        return true;
      });
    }

    // Convert to SearchResult format
    return filteredData.map((item: any) => ({
      type: item.item_type as 'task' | 'list',
      item: {
        id: item.item_id,
        title: item.title,
        description: item.description,
        list_id: item.list_id,
        priority: item.priority,
        due_date: item.due_date,
        completed: item.completed,
        created_at: item.created_at,
        updated_at: item.created_at, // Using created_at as fallback
        user_id: '', // Will be populated by the calling component
        ...(item.item_type === 'list' ? { name: item.title } : {}),
      } as Task | List,
      matches: [], // Server-side doesn't provide match details
      listName: item.list_name,
      score: item.rank,
    }));
  } catch (error) {
    console.error('Search error:', error);
    return [];
  }
}

// Client-side fuzzy search
export function searchClientSide(
  items: (Task | List)[],
  options: SearchOptions
): SearchResult[] {
  const { query, filters = {}, limit = 50 } = options;
  
  if (!query.trim()) {
    return [];
  }

  // Apply filters before search
  let filteredItems = items;
  
  if (filters.type && filters.type !== 'all') {
    filteredItems = filteredItems.filter((item: any) => {
      if (filters.type === 'tasks') return 'title' in item;
      if (filters.type === 'lists') return 'name' in item;
      return true;
    });
  }
  
  if (filters.priority && filters.priority !== 'all') {
    filteredItems = filteredItems.filter((item: any) => 
      'priority' in item && item.priority === filters.priority
    );
  }
  
  if (filters.completed && filters.completed !== 'all') {
    const isCompleted = filters.completed === 'completed';
    filteredItems = filteredItems.filter((item: any) => 
      'completed' in item && item.completed === isCompleted
    );
  }
  
  if (filters.listId) {
    filteredItems = filteredItems.filter((item: any) => 
      'list_id' in item && item.list_id === filters.listId
    );
  }

  // Create Fuse instance and search
  const fuse = new Fuse(filteredItems, fuseOptions);
  const fuseResults = fuse.search(query.trim()).slice(0, limit);

  // Convert Fuse results to SearchResult format
  return fuseResults.map(result => {
    const item = result.item;
    const matches: TextMatch[] = [];
    
    if (options.includeHighlights && result.matches) {
      result.matches.forEach(match => {
        if (match.indices && match.key) {
          match.indices.forEach(([start, end]) => {
            matches.push({
              field: match.key as 'title' | 'description' | 'name',
              start,
              end,
              text: match.value?.substring(start, end + 1) || '',
            });
          });
        }
      });
    }

    return {
      type: 'title' in item ? 'task' : 'list',
      item,
      matches,
      score: result.score,
    };
  });
}

// Highlight text matches in search results
export function highlightMatches(text: string, matches: TextMatch[]): string {
  if (!matches.length) return text;
  
  // Sort matches by start position (descending) to avoid index shifting
  const sortedMatches = [...matches].sort((a, b) => b.start - a.start);
  
  let highlightedText = text;
  sortedMatches.forEach(match => {
    const before = highlightedText.substring(0, match.start);
    const highlighted = highlightedText.substring(match.start, match.end + 1);
    const after = highlightedText.substring(match.end + 1);
    highlightedText = `${before}<mark class="bg-yellow-200 dark:bg-yellow-800">${highlighted}</mark>${after}`;
  });
  
  return highlightedText;
}

// Debounce utility for search input
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Search suggestions based on recent searches and popular terms
export function getSearchSuggestions(
  query: string,
  recentSearches: string[] = [],
  popularTerms: string[] = []
): string[] {
  const suggestions = new Set<string>();
  const lowerQuery = query.toLowerCase();
  
  // Add matching recent searches
  recentSearches.forEach(search => {
    if (search.toLowerCase().includes(lowerQuery)) {
      suggestions.add(search);
    }
  });
  
  // Add matching popular terms
  popularTerms.forEach(term => {
    if (term.toLowerCase().includes(lowerQuery)) {
      suggestions.add(term);
    }
  });
  
  return Array.from(suggestions).slice(0, 5);
}

// Fallback search using direct Supabase queries
async function searchWithDirectQueries(options: SearchOptions): Promise<SearchResult[]> {
  const { query, filters = {}, limit = 50 } = options;
  const supabase = createClient();
  const results: SearchResult[] = [];
  
  try {
    // Search tasks
    if (!filters.type || filters.type === 'all' || filters.type === 'tasks') {
      let taskQuery = supabase
        .from('tasks')
        .select(`
          *,
          lists!inner(name)
        `)
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`);
      
      // Apply filters
      if (filters.priority && filters.priority !== 'all') {
        taskQuery = taskQuery.eq('priority', filters.priority);
      }
      
      if (filters.completed && filters.completed !== 'all') {
        taskQuery = taskQuery.eq('completed', filters.completed === 'completed');
      }
      
      if (filters.listId) {
        taskQuery = taskQuery.eq('list_id', filters.listId);
      }
      
      const { data: tasks, error: taskError } = await taskQuery.limit(Math.floor(limit / 2));
      
      if (!taskError && tasks) {
        tasks.forEach(task => {
          results.push({
            type: 'task',
            item: task,
            matches: [],
            listName: task.lists?.name,
          });
        });
      }
    }
    
    // Search lists
    if (!filters.type || filters.type === 'all' || filters.type === 'lists') {
      const { data: lists, error: listError } = await supabase
        .from('lists')
        .select('*')
        .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
        .limit(Math.floor(limit / 2));
      
      if (!listError && lists) {
        lists.forEach(list => {
          results.push({
            type: 'list',
            item: list,
            matches: [],
          });
        });
      }
    }
    
    return results.slice(0, limit);
  } catch (error) {
    console.error('Fallback search error:', error);
    return [];
  }
}