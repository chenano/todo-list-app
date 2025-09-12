import { renderHook, act } from '@testing-library/react';
import { useAnalytics, ANALYTICS_PRESETS, useAnalyticsPresets } from '../useAnalytics';
import { Task, List } from '@/types';
import { format, subDays } from 'date-fns';

// Mock the analytics manager
jest.mock('@/lib/analytics', () => ({
  getAnalyticsManager: () => ({
    recordTaskCreated: jest.fn(),
    recordTaskCompleted: jest.fn(),
    recordTaskUncompleted: jest.fn(),
    recordTaskDeleted: jest.fn(),
    recordListCreated: jest.fn(),
    recordListDeleted: jest.fn(),
    exportData: jest.fn(() => 'exported-data'),
    importData: jest.fn(() => true),
    clearData: jest.fn(),
    getEvents: jest.fn(() => []),
  }),
  calculateProductivityMetrics: jest.fn(() => ({
    completionRate: 75,
    averageTasksPerDay: 2.5,
    totalTasks: 10,
    completedTasks: 7,
    priorityDistribution: { high: 3, medium: 4, low: 3 },
    timePatterns: [],
    streaks: { current: 5, longest: 10, lastActivity: '2024-01-01', streakDates: [] },
    trends: { daily: [], weekly: [], monthly: [] },
  })),
  recordTaskCreated: jest.fn(),
  recordTaskCompleted: jest.fn(),
  recordTaskUncompleted: jest.fn(),
  recordTaskDeleted: jest.fn(),
  recordListCreated: jest.fn(),
  recordListDeleted: jest.fn(),
}));

const mockTask: Task = {
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

const mockList: List = {
  id: 'list-1',
  user_id: 'user-1',
  name: 'Test List',
  description: 'Test Description',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe('useAnalytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useAnalytics());

    expect(result.current.metrics).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.filter).toEqual({
      dateRange: {
        start: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
        end: format(new Date(), 'yyyy-MM-dd'),
      },
      includeCompleted: true,
      includeIncomplete: true,
    });
  });

  it('should calculate metrics when tasks and lists are provided', async () => {
    const { result } = renderHook(() => useAnalytics([mockTask], [mockList]));

    // Wait for the effect to run
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.metrics).toBeDefined();
    expect(result.current.metrics?.completionRate).toBe(75);
    expect(result.current.metrics?.totalTasks).toBe(10);
  });

  it('should update filter and recalculate metrics', async () => {
    const { result } = renderHook(() => useAnalytics([mockTask], [mockList]));

    const newFilter = {
      dateRange: {
        start: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
        end: format(new Date(), 'yyyy-MM-dd'),
      },
      includeCompleted: true,
      includeIncomplete: false,
    };

    await act(async () => {
      result.current.setFilter(newFilter);
    });

    expect(result.current.filter).toEqual(newFilter);
  });

  it('should record events and refresh metrics', async () => {
    const { result } = renderHook(() => useAnalytics([mockTask], [mockList]));

    await act(async () => {
      result.current.recordEvent.taskCreated(mockTask);
    });

    const { recordTaskCreated } = require('@/lib/analytics');
    expect(recordTaskCreated).toHaveBeenCalledWith(mockTask);
  });

  it('should record task completion with completion time', async () => {
    const { result } = renderHook(() => useAnalytics([mockTask], [mockList]));
    const completionTime = 5000;

    await act(async () => {
      result.current.recordEvent.taskCompleted(mockTask, completionTime);
    });

    const { recordTaskCompleted } = require('@/lib/analytics');
    expect(recordTaskCompleted).toHaveBeenCalledWith(mockTask, completionTime);
  });

  it('should record task uncompleted event', async () => {
    const { result } = renderHook(() => useAnalytics([mockTask], [mockList]));

    await act(async () => {
      result.current.recordEvent.taskUncompleted(mockTask);
    });

    const { recordTaskUncompleted } = require('@/lib/analytics');
    expect(recordTaskUncompleted).toHaveBeenCalledWith(mockTask);
  });

  it('should record task deletion event', async () => {
    const { result } = renderHook(() => useAnalytics([mockTask], [mockList]));

    await act(async () => {
      result.current.recordEvent.taskDeleted(mockTask);
    });

    const { recordTaskDeleted } = require('@/lib/analytics');
    expect(recordTaskDeleted).toHaveBeenCalledWith(mockTask);
  });

  it('should record list creation event', async () => {
    const { result } = renderHook(() => useAnalytics([mockTask], [mockList]));

    await act(async () => {
      result.current.recordEvent.listCreated(mockList);
    });

    const { recordListCreated } = require('@/lib/analytics');
    expect(recordListCreated).toHaveBeenCalledWith(mockList);
  });

  it('should record list deletion event', async () => {
    const { result } = renderHook(() => useAnalytics([mockTask], [mockList]));

    await act(async () => {
      result.current.recordEvent.listDeleted(mockList);
    });

    const { recordListDeleted } = require('@/lib/analytics');
    expect(recordListDeleted).toHaveBeenCalledWith(mockList);
  });

  it('should export data', () => {
    const { result } = renderHook(() => useAnalytics());

    const exportedData = result.current.exportData();
    expect(exportedData).toBe('exported-data');
  });

  it('should import data', async () => {
    const { result } = renderHook(() => useAnalytics([mockTask], [mockList]));

    await act(async () => {
      const success = result.current.importData('test-data');
      expect(success).toBe(true);
    });
  });

  it('should clear data', async () => {
    const { result } = renderHook(() => useAnalytics());

    await act(async () => {
      result.current.clearData();
    });

    expect(result.current.metrics).toBeNull();
  });

  it('should get events', () => {
    const { result } = renderHook(() => useAnalytics());

    const events = result.current.getEvents();
    expect(Array.isArray(events)).toBe(true);
  });

  it('should refresh metrics manually', async () => {
    const { result } = renderHook(() => useAnalytics([mockTask], [mockList]));

    await act(async () => {
      result.current.refreshMetrics();
    });

    expect(result.current.metrics).toBeDefined();
  });

  it('should handle auto-refresh', async () => {
    jest.useFakeTimers();
    
    const { result } = renderHook(() => 
      useAnalytics([mockTask], [mockList], { autoRefresh: true, refreshInterval: 1000 })
    );

    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(result.current.metrics).toBeDefined();

    jest.useRealTimers();
  });

  it('should handle errors in metrics calculation', async () => {
    const { calculateProductivityMetrics } = require('@/lib/analytics');
    calculateProductivityMetrics.mockImplementationOnce(() => {
      throw new Error('Calculation failed');
    });

    const { result } = renderHook(() => useAnalytics([mockTask], [mockList]));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.error).toBe('Calculation failed');
    expect(result.current.metrics).toBeNull();
  });

  it('should handle empty tasks and lists', async () => {
    const { result } = renderHook(() => useAnalytics([], []));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.metrics).toBeNull();
  });
});

describe('useAnalyticsPresets', () => {
  it('should provide analytics presets', () => {
    const { result } = renderHook(() => useAnalyticsPresets());

    expect(result.current.presets).toBeDefined();
    expect(typeof result.current.presets.last7Days).toBe('function');
    expect(typeof result.current.presets.last30Days).toBe('function');
    expect(typeof result.current.presets.thisWeek).toBe('function');
    expect(typeof result.current.presets.thisMonth).toBe('function');
  });

  it('should apply presets correctly', () => {
    const { result } = renderHook(() => useAnalyticsPresets());

    const last7DaysFilter = result.current.applyPreset('last7Days');
    expect(last7DaysFilter.dateRange.start).toBe(
      format(subDays(new Date(), 7), 'yyyy-MM-dd')
    );
    expect(last7DaysFilter.dateRange.end).toBe(
      format(new Date(), 'yyyy-MM-dd')
    );
  });
});

describe('ANALYTICS_PRESETS', () => {
  it('should generate correct last7Days filter', () => {
    const filter = ANALYTICS_PRESETS.last7Days();
    
    expect(filter.dateRange.start).toBe(
      format(subDays(new Date(), 7), 'yyyy-MM-dd')
    );
    expect(filter.dateRange.end).toBe(
      format(new Date(), 'yyyy-MM-dd')
    );
    expect(filter.includeCompleted).toBe(true);
    expect(filter.includeIncomplete).toBe(true);
  });

  it('should generate correct last30Days filter', () => {
    const filter = ANALYTICS_PRESETS.last30Days();
    
    expect(filter.dateRange.start).toBe(
      format(subDays(new Date(), 30), 'yyyy-MM-dd')
    );
    expect(filter.dateRange.end).toBe(
      format(new Date(), 'yyyy-MM-dd')
    );
  });

  it('should generate correct completedOnly filter', () => {
    const filter = ANALYTICS_PRESETS.completedOnly();
    
    expect(filter.includeCompleted).toBe(true);
    expect(filter.includeIncomplete).toBe(false);
  });

  it('should generate correct highPriorityOnly filter', () => {
    const filter = ANALYTICS_PRESETS.highPriorityOnly();
    
    expect(filter.priorities).toEqual(['high']);
    expect(filter.includeCompleted).toBe(true);
    expect(filter.includeIncomplete).toBe(true);
  });
});