import { 
  filterTasks, 
  sortTasks, 
  filterAndSortTasks, 
  isTaskOverdue, 
  getTaskCounts, 
  hasActiveFilters, 
  clearFilters, 
  getDefaultSort, 
  hasCustomSort 
} from '../task-filters';
import { Task, TaskFilters, TaskSort } from '../../types';

// Mock tasks for testing
const mockTasks: Task[] = [
  {
    id: '1',
    list_id: 'list1',
    user_id: 'user1',
    title: 'Task 1',
    description: 'Description 1',
    completed: false,
    priority: 'high',
    due_date: '2030-01-15', // Future date
    created_at: '2024-01-10T10:00:00Z',
    updated_at: '2024-01-10T10:00:00Z',
  },
  {
    id: '2',
    list_id: 'list1',
    user_id: 'user1',
    title: 'Task 2',
    description: 'Description 2',
    completed: true,
    priority: 'medium',
    due_date: '2030-01-20', // Future date
    created_at: '2024-01-11T10:00:00Z',
    updated_at: '2024-01-11T10:00:00Z',
  },
  {
    id: '3',
    list_id: 'list1',
    user_id: 'user1',
    title: 'Task 3',
    description: 'Description 3',
    completed: false,
    priority: 'low',
    due_date: null,
    created_at: '2024-01-12T10:00:00Z',
    updated_at: '2024-01-12T10:00:00Z',
  },
  {
    id: '4',
    list_id: 'list1',
    user_id: 'user1',
    title: 'Overdue Task',
    description: 'This task is overdue',
    completed: false,
    priority: 'high',
    due_date: '2023-12-01', // Past date
    created_at: '2023-11-30T10:00:00Z',
    updated_at: '2023-11-30T10:00:00Z',
  },
];

describe('task-filters', () => {
  describe('filterTasks', () => {
    it('should return all tasks when no filters are applied', () => {
      const filters: TaskFilters = {};
      const result = filterTasks(mockTasks, filters);
      expect(result).toHaveLength(4);
    });

    it('should filter by completed status', () => {
      const filters: TaskFilters = { status: 'completed' };
      const result = filterTasks(mockTasks, filters);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('2');
    });

    it('should filter by incomplete status', () => {
      const filters: TaskFilters = { status: 'incomplete' };
      const result = filterTasks(mockTasks, filters);
      expect(result).toHaveLength(3);
      expect(result.every(task => !task.completed)).toBe(true);
    });

    it('should filter by priority', () => {
      const filters: TaskFilters = { priority: 'high' };
      const result = filterTasks(mockTasks, filters);
      expect(result).toHaveLength(2);
      expect(result.every(task => task.priority === 'high')).toBe(true);
    });

    it('should filter by overdue status', () => {
      const filters: TaskFilters = { overdue: true };
      const result = filterTasks(mockTasks, filters);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('4');
    });

    it('should apply multiple filters', () => {
      const filters: TaskFilters = { 
        status: 'incomplete', 
        priority: 'high' 
      };
      const result = filterTasks(mockTasks, filters);
      expect(result).toHaveLength(2);
      expect(result.every(task => !task.completed && task.priority === 'high')).toBe(true);
    });

    it('should handle "all" filter values', () => {
      const filters: TaskFilters = { 
        status: 'all', 
        priority: 'all' 
      };
      const result = filterTasks(mockTasks, filters);
      expect(result).toHaveLength(4);
    });
  });

  describe('sortTasks', () => {
    it('should sort by created_at ascending', () => {
      const sort: TaskSort = { field: 'created_at', direction: 'asc' };
      const result = sortTasks(mockTasks, sort);
      expect(result[0].id).toBe('4'); // Oldest
      expect(result[3].id).toBe('3'); // Newest
    });

    it('should sort by created_at descending', () => {
      const sort: TaskSort = { field: 'created_at', direction: 'desc' };
      const result = sortTasks(mockTasks, sort);
      expect(result[0].id).toBe('3'); // Newest
      expect(result[3].id).toBe('4'); // Oldest
    });

    it('should sort by due_date ascending', () => {
      const sort: TaskSort = { field: 'due_date', direction: 'asc' };
      const result = sortTasks(mockTasks, sort);
      expect(result[0].id).toBe('4'); // Earliest due date
      expect(result[1].id).toBe('1');
      expect(result[2].id).toBe('2');
      expect(result[3].id).toBe('3'); // No due date (should be last)
    });

    it('should sort by priority descending (high to low)', () => {
      const sort: TaskSort = { field: 'priority', direction: 'desc' };
      const result = sortTasks(mockTasks, sort);
      const priorities = result.map(task => task.priority);
      expect(priorities[0]).toBe('high');
      expect(priorities[1]).toBe('high');
      expect(priorities[2]).toBe('medium');
      expect(priorities[3]).toBe('low');
    });

    it('should sort by title alphabetically', () => {
      const sort: TaskSort = { field: 'title', direction: 'asc' };
      const result = sortTasks(mockTasks, sort);
      expect(result[0].title).toBe('Overdue Task');
      expect(result[1].title).toBe('Task 1');
      expect(result[2].title).toBe('Task 2');
      expect(result[3].title).toBe('Task 3');
    });

    it('should not mutate the original array', () => {
      const sort: TaskSort = { field: 'title', direction: 'asc' };
      const originalOrder = mockTasks.map(task => task.id);
      sortTasks(mockTasks, sort);
      const currentOrder = mockTasks.map(task => task.id);
      expect(currentOrder).toEqual(originalOrder);
    });
  });

  describe('filterAndSortTasks', () => {
    it('should apply both filtering and sorting', () => {
      const filters: TaskFilters = { status: 'incomplete' };
      const sort: TaskSort = { field: 'priority', direction: 'desc' };
      const result = filterAndSortTasks(mockTasks, filters, sort);
      
      expect(result).toHaveLength(3);
      expect(result.every(task => !task.completed)).toBe(true);
      expect(result[0].priority).toBe('high');
      expect(result[2].priority).toBe('low');
    });
  });

  describe('isTaskOverdue', () => {
    it('should return true for overdue incomplete tasks', () => {
      const overdueTask = mockTasks.find(task => task.id === '4')!;
      expect(isTaskOverdue(overdueTask)).toBe(true);
    });

    it('should return false for completed tasks even if past due date', () => {
      const completedTask = { ...mockTasks[0], completed: true, due_date: '2023-01-01' };
      expect(isTaskOverdue(completedTask)).toBe(false);
    });

    it('should return false for tasks without due dates', () => {
      const taskWithoutDueDate = mockTasks.find(task => task.id === '3')!;
      expect(isTaskOverdue(taskWithoutDueDate)).toBe(false);
    });

    it('should return false for future due dates', () => {
      const futureTask = { ...mockTasks[0], due_date: '2030-01-01' };
      expect(isTaskOverdue(futureTask)).toBe(false);
    });
  });

  describe('getTaskCounts', () => {
    it('should return correct task counts', () => {
      const counts = getTaskCounts(mockTasks);
      
      expect(counts.total).toBe(4);
      expect(counts.completed).toBe(1);
      expect(counts.incomplete).toBe(3);
      expect(counts.overdue).toBe(1);
      expect(counts.byPriority.high).toBe(2);
      expect(counts.byPriority.medium).toBe(1);
      expect(counts.byPriority.low).toBe(1);
    });
  });

  describe('hasActiveFilters', () => {
    it('should return false for empty filters', () => {
      expect(hasActiveFilters({})).toBe(false);
    });

    it('should return false for "all" filter values', () => {
      const filters: TaskFilters = { status: 'all', priority: 'all', overdue: false };
      expect(hasActiveFilters(filters)).toBe(false);
    });

    it('should return true for active status filter', () => {
      const filters: TaskFilters = { status: 'completed' };
      expect(hasActiveFilters(filters)).toBe(true);
    });

    it('should return true for active priority filter', () => {
      const filters: TaskFilters = { priority: 'high' };
      expect(hasActiveFilters(filters)).toBe(true);
    });

    it('should return true for overdue filter', () => {
      const filters: TaskFilters = { overdue: true };
      expect(hasActiveFilters(filters)).toBe(true);
    });
  });

  describe('clearFilters', () => {
    it('should return default filter state', () => {
      const cleared = clearFilters();
      expect(cleared.status).toBe('all');
      expect(cleared.priority).toBe('all');
      expect(cleared.overdue).toBe(false);
    });
  });

  describe('getDefaultSort', () => {
    it('should return default sort configuration', () => {
      const defaultSort = getDefaultSort();
      expect(defaultSort.field).toBe('created_at');
      expect(defaultSort.direction).toBe('desc');
    });
  });

  describe('hasCustomSort', () => {
    it('should return false for default sort', () => {
      const defaultSort = getDefaultSort();
      expect(hasCustomSort(defaultSort)).toBe(false);
    });

    it('should return true for custom field', () => {
      const customSort: TaskSort = { field: 'title', direction: 'desc' };
      expect(hasCustomSort(customSort)).toBe(true);
    });

    it('should return true for custom direction', () => {
      const customSort: TaskSort = { field: 'created_at', direction: 'asc' };
      expect(hasCustomSort(customSort)).toBe(true);
    });
  });
});