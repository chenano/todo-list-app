import { searchClientSide, highlightMatches, debounce, getSearchSuggestions } from '../search';
import type { Task, List } from '@/types';

// Mock data for testing
const mockTasks: Task[] = [
  {
    id: '1',
    list_id: 'list1',
    user_id: 'user1',
    title: 'Buy groceries',
    description: 'Need to buy milk, bread, and eggs',
    completed: false,
    priority: 'medium',
    due_date: '2024-01-15',
    created_at: '2024-01-10T10:00:00Z',
    updated_at: '2024-01-10T10:00:00Z',
  },
  {
    id: '2',
    list_id: 'list1',
    user_id: 'user1',
    title: 'Complete project',
    description: 'Finish the React component library',
    completed: true,
    priority: 'high',
    due_date: '2024-01-20',
    created_at: '2024-01-08T10:00:00Z',
    updated_at: '2024-01-08T10:00:00Z',
  },
  {
    id: '3',
    list_id: 'list2',
    user_id: 'user1',
    title: 'Call dentist',
    description: 'Schedule appointment for cleaning',
    completed: false,
    priority: 'low',
    due_date: null,
    created_at: '2024-01-12T10:00:00Z',
    updated_at: '2024-01-12T10:00:00Z',
  },
];

const mockLists: List[] = [
  {
    id: 'list1',
    user_id: 'user1',
    name: 'Personal Tasks',
    description: 'My personal todo items',
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-01T10:00:00Z',
  },
  {
    id: 'list2',
    user_id: 'user1',
    name: 'Work Projects',
    description: 'Professional tasks and projects',
    created_at: '2024-01-02T10:00:00Z',
    updated_at: '2024-01-02T10:00:00Z',
  },
];

describe('Search functionality', () => {
  describe('searchClientSide', () => {
    it('should find tasks by title', () => {
      const results = searchClientSide([...mockTasks, ...mockLists], {
        query: 'groceries',
        includeHighlights: true,
      });

      expect(results).toHaveLength(1);
      expect(results[0].type).toBe('task');
      expect(results[0].item.title).toBe('Buy groceries');
    });

    it('should find tasks by description', () => {
      const results = searchClientSide([...mockTasks, ...mockLists], {
        query: 'React',
        includeHighlights: true,
      });

      expect(results).toHaveLength(1);
      expect(results[0].type).toBe('task');
      expect(results[0].item.title).toBe('Complete project');
    });

    it('should find lists by name', () => {
      const results = searchClientSide([...mockTasks, ...mockLists], {
        query: 'Personal',
        includeHighlights: true,
      });

      expect(results).toHaveLength(1);
      expect(results[0].type).toBe('list');
      expect((results[0].item as List).name).toBe('Personal Tasks');
    });

    it('should filter by task type', () => {
      const results = searchClientSide([...mockTasks, ...mockLists], {
        query: 'project',
        filters: { type: 'tasks' },
        includeHighlights: true,
      });

      expect(results).toHaveLength(1);
      expect(results[0].type).toBe('task');
    });

    it('should filter by priority', () => {
      const results = searchClientSide(mockTasks, {
        query: 'project',
        filters: { priority: 'high' },
        includeHighlights: true,
      });

      expect(results).toHaveLength(1);
      expect((results[0].item as Task).priority).toBe('high');
    });

    it('should filter by completion status', () => {
      const results = searchClientSide(mockTasks, {
        query: 'project',
        filters: { completed: 'completed' },
        includeHighlights: true,
      });

      expect(results).toHaveLength(1);
      expect((results[0].item as Task).completed).toBe(true);
    });

    it('should return empty results for no matches', () => {
      const results = searchClientSide([...mockTasks, ...mockLists], {
        query: 'nonexistent',
        includeHighlights: true,
      });

      expect(results).toHaveLength(0);
    });

    it('should respect result limit', () => {
      const results = searchClientSide([...mockTasks, ...mockLists], {
        query: 'a', // Should match multiple items
        limit: 1,
        includeHighlights: true,
      });

      expect(results.length).toBeLessThanOrEqual(1);
    });
  });

  describe('highlightMatches', () => {
    it('should highlight single match', () => {
      const text = 'Buy groceries';
      const matches = [{ field: 'title' as const, start: 4, end: 12, text: 'groceries' }];
      
      const result = highlightMatches(text, matches);
      expect(result).toBe('Buy <mark class="bg-yellow-200 dark:bg-yellow-800">groceries</mark>');
    });

    it('should highlight multiple matches', () => {
      const text = 'Buy groceries and more groceries';
      const matches = [
        { field: 'title' as const, start: 4, end: 12, text: 'groceries' },
        { field: 'title' as const, start: 23, end: 31, text: 'groceries' },
      ];
      
      const result = highlightMatches(text, matches);
      expect(result).toContain('<mark class="bg-yellow-200 dark:bg-yellow-800">groceries</mark>');
    });

    it('should return original text when no matches', () => {
      const text = 'Buy groceries';
      const matches: any[] = [];
      
      const result = highlightMatches(text, matches);
      expect(result).toBe(text);
    });
  });

  describe('debounce', () => {
    jest.useFakeTimers();

    it('should delay function execution', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 300);

      debouncedFn();
      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(300);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should cancel previous calls', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 300);

      debouncedFn();
      debouncedFn();
      debouncedFn();

      jest.advanceTimersByTime(300);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    afterEach(() => {
      jest.clearAllTimers();
    });
  });

  describe('getSearchSuggestions', () => {
    it('should return matching recent searches', () => {
      const recentSearches = ['groceries', 'project', 'dentist'];
      const suggestions = getSearchSuggestions('gr', recentSearches);

      expect(suggestions).toContain('groceries');
      expect(suggestions).not.toContain('project');
    });

    it('should return matching popular terms', () => {
      const popularTerms = ['shopping', 'work', 'health'];
      const suggestions = getSearchSuggestions('sh', [], popularTerms);

      expect(suggestions).toContain('shopping');
      expect(suggestions).not.toContain('work');
    });

    it('should limit suggestions to 5', () => {
      const recentSearches = ['a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7'];
      const suggestions = getSearchSuggestions('a', recentSearches);

      expect(suggestions.length).toBeLessThanOrEqual(5);
    });

    it('should return empty array for no matches', () => {
      const suggestions = getSearchSuggestions('xyz', ['groceries'], ['shopping']);

      expect(suggestions).toHaveLength(0);
    });
  });
});