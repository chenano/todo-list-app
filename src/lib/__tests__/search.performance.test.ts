import { searchClientSide } from '../search';
import type { Task, List } from '@/types';

// Generate large dataset for performance testing
const generateMockTasks = (count: number): Task[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `task-${i}`,
    list_id: `list-${i % 10}`,
    user_id: 'user1',
    title: `Task ${i} - ${i % 2 === 0 ? 'Important' : 'Regular'} task`,
    description: `Description for task ${i}. This is a ${i % 3 === 0 ? 'complex' : 'simple'} task with various details.`,
    completed: i % 4 === 0,
    priority: ['low', 'medium', 'high'][i % 3] as 'low' | 'medium' | 'high',
    due_date: i % 5 === 0 ? `2024-01-${(i % 28) + 1}` : null,
    created_at: `2024-01-${(i % 28) + 1}T10:00:00Z`,
    updated_at: `2024-01-${(i % 28) + 1}T10:00:00Z`,
  }));
};

const generateMockLists = (count: number): List[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `list-${i}`,
    user_id: 'user1',
    name: `List ${i} - ${i % 2 === 0 ? 'Work' : 'Personal'}`,
    description: `Description for list ${i}`,
    created_at: `2024-01-${(i % 28) + 1}T10:00:00Z`,
    updated_at: `2024-01-${(i % 28) + 1}T10:00:00Z`,
  }));
};

describe('Search Performance Tests', () => {
  const PERFORMANCE_THRESHOLD = 100; // 100ms threshold for search operations

  describe('Large dataset performance', () => {
    it('should search through 1000 tasks within performance threshold', () => {
      const tasks = generateMockTasks(1000);
      const lists = generateMockLists(50);
      const data = [...tasks, ...lists];

      const startTime = performance.now();
      const results = searchClientSide(data, {
        query: 'Important',
        includeHighlights: true,
      });
      const endTime = performance.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLD);
      expect(results.length).toBeGreaterThan(0);
    });

    it('should search through 5000 tasks within reasonable time', () => {
      const tasks = generateMockTasks(5000);
      const lists = generateMockLists(100);
      const data = [...tasks, ...lists];

      const startTime = performance.now();
      const results = searchClientSide(data, {
        query: 'complex',
        includeHighlights: true,
        limit: 50,
      });
      const endTime = performance.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(500); // 500ms for very large dataset
      expect(results.length).toBeGreaterThan(0);
      expect(results.length).toBeLessThanOrEqual(50);
    });

    it('should handle fuzzy search efficiently', () => {
      const tasks = generateMockTasks(2000);
      
      const startTime = performance.now();
      const results = searchClientSide(tasks, {
        query: 'Importnt', // Intentional typo for fuzzy search
        includeHighlights: true,
        fuzzy: true,
      });
      const endTime = performance.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(200); // Fuzzy search may be slower
      expect(results.length).toBeGreaterThan(0);
    });

    it('should handle empty query efficiently', () => {
      const tasks = generateMockTasks(1000);
      
      const startTime = performance.now();
      const results = searchClientSide(tasks, {
        query: '',
        includeHighlights: false,
      });
      const endTime = performance.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(50); // Empty query should be very fast
      expect(results.length).toBe(0);
    });

    it('should handle complex filters efficiently', () => {
      const tasks = generateMockTasks(3000);
      
      const startTime = performance.now();
      const results = searchClientSide(tasks, {
        query: 'task',
        filters: {
          priority: 'high',
          completed: 'incomplete',
          type: 'tasks',
        },
        includeHighlights: true,
      });
      const endTime = performance.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLD);
      expect(results.length).toBeGreaterThan(0);
      
      // Verify all results match filters
      results.forEach(result => {
        if (result.type === 'task') {
          const task = result.item as Task;
          expect(task.priority).toBe('high');
          expect(task.completed).toBe(false);
        }
      });
    });
  });

  describe('Memory usage optimization', () => {
    it('should not create excessive objects during search', () => {
      const tasks = generateMockTasks(1000);
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Perform multiple searches
      for (let i = 0; i < 10; i++) {
        searchClientSide(tasks, {
          query: `task ${i}`,
          includeHighlights: true,
        });
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (less than 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });

    it('should handle concurrent searches without memory leaks', async () => {
      const tasks = generateMockTasks(500);
      
      const searches = Array.from({ length: 20 }, (_, i) => 
        Promise.resolve(searchClientSide(tasks, {
          query: `task ${i}`,
          includeHighlights: true,
        }))
      );
      
      const startTime = performance.now();
      const results = await Promise.all(searches);
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      expect(duration).toBeLessThan(1000); // All searches should complete within 1 second
      expect(results).toHaveLength(20);
    });
  });

  describe('Edge cases performance', () => {
    it('should handle very long search queries efficiently', () => {
      const tasks = generateMockTasks(1000);
      const longQuery = 'a'.repeat(1000); // Very long query
      
      const startTime = performance.now();
      const results = searchClientSide(tasks, {
        query: longQuery,
        includeHighlights: true,
      });
      const endTime = performance.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLD);
      expect(results.length).toBe(0); // Should not match anything
    });

    it('should handle special characters in search efficiently', () => {
      const tasks = generateMockTasks(1000);
      const specialQuery = '!@#$%^&*()[]{}|;:,.<>?';
      
      const startTime = performance.now();
      const results = searchClientSide(tasks, {
        query: specialQuery,
        includeHighlights: true,
      });
      const endTime = performance.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLD);
      expect(results.length).toBe(0);
    });

    it('should handle unicode characters efficiently', () => {
      const tasks = generateMockTasks(1000);
      const unicodeQuery = '🚀 émojis and açcénts';
      
      const startTime = performance.now();
      const results = searchClientSide(tasks, {
        query: unicodeQuery,
        includeHighlights: true,
      });
      const endTime = performance.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLD);
    });
  });
});