import { AnalyticsManager, getAnalyticsManager } from '../analytics';
import { Task, List, AnalyticsEvent } from '@/types';
import { format, subDays, addDays } from 'date-fns';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: jest.fn(() => 'test-uuid-' + Math.random()),
  },
});

describe('AnalyticsManager', () => {
  let manager: AnalyticsManager;
  let mockTask: Task;
  let mockList: List;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    
    manager = new AnalyticsManager();
    
    mockTask = {
      id: 'task-1',
      list_id: 'list-1',
      user_id: 'user-1',
      title: 'Test Task',
      description: 'Test Description',
      completed: false,
      priority: 'medium',
      due_date: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    mockList = {
      id: 'list-1',
      user_id: 'user-1',
      name: 'Test List',
      description: 'Test Description',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  });

  describe('Event Recording', () => {
    it('should record task creation event', () => {
      manager.recordTaskCreated(mockTask);
      
      const events = manager.getEvents();
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('task_created');
      expect(events[0].data.taskId).toBe(mockTask.id);
      expect(events[0].data.priority).toBe(mockTask.priority);
    });

    it('should record task completion event', () => {
      const completionTime = 5000;
      manager.recordTaskCompleted(mockTask, completionTime);
      
      const events = manager.getEvents();
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('task_completed');
      expect(events[0].data.completionTime).toBe(completionTime);
    });

    it('should record task uncompleted event', () => {
      manager.recordTaskUncompleted(mockTask);
      
      const events = manager.getEvents();
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('task_uncompleted');
    });

    it('should record task deletion event', () => {
      manager.recordTaskDeleted(mockTask);
      
      const events = manager.getEvents();
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('task_deleted');
    });

    it('should record list creation event', () => {
      manager.recordListCreated(mockList);
      
      const events = manager.getEvents();
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('list_created');
      expect(events[0].data.listId).toBe(mockList.id);
    });

    it('should record list deletion event', () => {
      manager.recordListDeleted(mockList);
      
      const events = manager.getEvents();
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('list_deleted');
    });
  });

  describe('Metrics Calculation', () => {
    it('should calculate basic productivity metrics', () => {
      const tasks: Task[] = [
        { ...mockTask, id: 'task-1', completed: true, priority: 'high' },
        { ...mockTask, id: 'task-2', completed: false, priority: 'medium' },
        { ...mockTask, id: 'task-3', completed: true, priority: 'low' },
      ];

      const metrics = manager.calculateMetrics(tasks, [mockList]);

      expect(metrics.totalTasks).toBe(3);
      expect(metrics.completedTasks).toBe(2);
      expect(metrics.completionRate).toBe(66.67);
      expect(metrics.priorityDistribution.high).toBe(1);
      expect(metrics.priorityDistribution.medium).toBe(1);
      expect(metrics.priorityDistribution.low).toBe(1);
    });

    it('should handle empty task list', () => {
      const metrics = manager.calculateMetrics([], [mockList]);

      expect(metrics.totalTasks).toBe(0);
      expect(metrics.completedTasks).toBe(0);
      expect(metrics.completionRate).toBe(0);
      expect(metrics.averageTasksPerDay).toBe(0);
    });

    it('should filter tasks by date range', () => {
      const oldTask = {
        ...mockTask,
        id: 'old-task',
        created_at: subDays(new Date(), 60).toISOString(),
      };
      
      const recentTask = {
        ...mockTask,
        id: 'recent-task',
        created_at: subDays(new Date(), 5).toISOString(),
      };

      const tasks = [oldTask, recentTask];
      const filter = {
        dateRange: {
          start: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
          end: format(new Date(), 'yyyy-MM-dd'),
        },
      };

      const metrics = manager.calculateMetrics(tasks, [mockList], filter);
      expect(metrics.totalTasks).toBe(1);
    });

    it('should filter tasks by priority', () => {
      const now = new Date();
      const tasks: Task[] = [
        { ...mockTask, id: 'task-1', priority: 'high', created_at: now.toISOString() },
        { ...mockTask, id: 'task-2', priority: 'medium', created_at: now.toISOString() },
        { ...mockTask, id: 'task-3', priority: 'low', created_at: now.toISOString() },
      ];

      const filter = {
        dateRange: {
          start: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
          end: format(new Date(), 'yyyy-MM-dd'),
        },
        priorities: ['high' as const],
      };

      const metrics = manager.calculateMetrics(tasks, [mockList], filter);
      expect(metrics.totalTasks).toBe(1);
      expect(metrics.priorityDistribution.high).toBe(1);
      expect(metrics.priorityDistribution.medium).toBe(0);
      expect(metrics.priorityDistribution.low).toBe(0);
    });

    it('should filter tasks by completion status', () => {
      const now = new Date();
      const tasks: Task[] = [
        { ...mockTask, id: 'task-1', completed: true, created_at: now.toISOString() },
        { ...mockTask, id: 'task-2', completed: false, created_at: now.toISOString() },
      ];

      const filter = {
        dateRange: {
          start: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
          end: format(new Date(), 'yyyy-MM-dd'),
        },
        includeCompleted: true,
        includeIncomplete: false,
      };

      const metrics = manager.calculateMetrics(tasks, [mockList], filter);
      expect(metrics.totalTasks).toBe(1);
      expect(metrics.completedTasks).toBe(1);
    });
  });

  describe('Streak Calculation', () => {
    beforeEach(() => {
      // Clear any existing events
      manager.clearData();
    });

    it('should calculate current streak correctly', () => {
      const today = new Date();
      const yesterday = subDays(today, 1);
      const twoDaysAgo = subDays(today, 2);

      // Record completion events for consecutive days
      manager.recordEvent({
        type: 'task_completed',
        data: { taskId: 'task-1' },
      });

      // Manually set timestamps for testing
      const events = manager.getEvents();
      events[0].timestamp = format(today, "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");

      // Add more events
      manager.recordEvent({
        type: 'task_completed',
        data: { taskId: 'task-2' },
      });
      manager.recordEvent({
        type: 'task_completed',
        data: { taskId: 'task-3' },
      });

      const allEvents = manager.getEvents();
      allEvents[1].timestamp = format(yesterday, "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
      allEvents[2].timestamp = format(twoDaysAgo, "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");

      const metrics = manager.calculateMetrics([], [mockList]);
      expect(metrics.streaks.current).toBeGreaterThan(0);
    });

    it('should handle no streak when no recent activity', () => {
      const oldDate = subDays(new Date(), 10);
      
      manager.recordEvent({
        type: 'task_completed',
        data: { taskId: 'task-1' },
      });

      const events = manager.getEvents();
      events[0].timestamp = format(oldDate, "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");

      const metrics = manager.calculateMetrics([], [mockList]);
      expect(metrics.streaks.current).toBe(0);
    });
  });

  describe('Data Persistence', () => {
    it('should save events to localStorage', () => {
      manager.recordTaskCreated(mockTask);
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'todo-analytics-events',
        expect.stringContaining('"version":"1.0.0"')
      );
    });

    it('should load events from localStorage', () => {
      const mockData = {
        version: '1.0.0',
        events: [
          {
            id: 'test-event',
            type: 'task_created',
            timestamp: new Date().toISOString(),
            data: { taskId: 'task-1' },
          },
        ],
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockData));
      
      const newManager = new AnalyticsManager();
      const events = newManager.getEvents();
      
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('task_created');
    });

    it('should handle corrupted localStorage data', () => {
      localStorageMock.getItem.mockReturnValue('invalid json');
      
      const newManager = new AnalyticsManager();
      const events = newManager.getEvents();
      
      expect(events).toHaveLength(0);
    });
  });

  describe('Data Export/Import', () => {
    it('should export data correctly', () => {
      manager.recordTaskCreated(mockTask);
      
      const exportedData = manager.exportData();
      const parsed = JSON.parse(exportedData);
      
      expect(parsed.version).toBe('1.0.0');
      expect(parsed.events).toHaveLength(1);
      expect(parsed.exportedAt).toBeDefined();
    });

    it('should import data correctly', () => {
      const importData = {
        version: '1.0.0',
        events: [
          {
            id: 'imported-event',
            type: 'task_completed',
            timestamp: new Date().toISOString(),
            data: { taskId: 'imported-task' },
          },
        ],
      };

      const success = manager.importData(JSON.stringify(importData));
      
      expect(success).toBe(true);
      expect(manager.getEvents()).toHaveLength(1);
      expect(manager.getEvents()[0].id).toBe('imported-event');
    });

    it('should reject invalid import data', () => {
      const success = manager.importData('invalid data');
      expect(success).toBe(false);
    });

    it('should reject import data with wrong version', () => {
      const importData = {
        version: '2.0.0',
        events: [],
      };

      const success = manager.importData(JSON.stringify(importData));
      expect(success).toBe(false);
    });
  });

  describe('Data Cleanup', () => {
    it('should clear all data', () => {
      manager.recordTaskCreated(mockTask);
      expect(manager.getEvents()).toHaveLength(1);
      
      manager.clearData();
      
      expect(manager.getEvents()).toHaveLength(0);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('todo-analytics-events');
    });
  });

  describe('Trend Calculations', () => {
    it('should calculate daily trends', () => {
      const tasks: Task[] = [
        { ...mockTask, id: 'task-1', completed: true },
        { ...mockTask, id: 'task-2', completed: false },
      ];

      // Record some events
      manager.recordTaskCreated(tasks[0]);
      manager.recordTaskCompleted(tasks[0]);
      manager.recordTaskCreated(tasks[1]);

      const metrics = manager.calculateMetrics(tasks, [mockList]);
      
      expect(metrics.trends.daily).toBeDefined();
      expect(Array.isArray(metrics.trends.daily)).toBe(true);
    });

    it('should calculate weekly trends', () => {
      const tasks: Task[] = [mockTask];
      const metrics = manager.calculateMetrics(tasks, [mockList]);
      
      expect(metrics.trends.weekly).toBeDefined();
      expect(Array.isArray(metrics.trends.weekly)).toBe(true);
    });

    it('should calculate monthly trends', () => {
      const tasks: Task[] = [mockTask];
      const metrics = manager.calculateMetrics(tasks, [mockList]);
      
      expect(metrics.trends.monthly).toBeDefined();
      expect(Array.isArray(metrics.trends.monthly)).toBe(true);
    });
  });
});

describe('Singleton Analytics Manager', () => {
  let testTask: Task;

  beforeEach(() => {
    testTask = {
      id: 'test-task',
      list_id: 'test-list',
      user_id: 'test-user',
      title: 'Test Task',
      description: 'Test Description',
      completed: false,
      priority: 'medium',
      due_date: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  });

  it('should provide singleton instance', () => {
    expect(getAnalyticsManager()).toBeInstanceOf(AnalyticsManager);
  });

  it('should maintain state across imports', () => {
    const { recordTaskCreated, recordTaskCompleted } = require('../analytics');
    
    recordTaskCreated(testTask);
    recordTaskCompleted(testTask);
    
    expect(getAnalyticsManager().getEvents()).toHaveLength(2);
  });
});