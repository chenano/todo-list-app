import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  ProductivityMetrics, 
  AnalyticsFilter, 
  Task, 
  List,
  AnalyticsEvent 
} from '@/types';
import { 
  getAnalyticsManager, 
  calculateProductivityMetrics,
  recordTaskCreated,
  recordTaskCompleted,
  recordTaskUncompleted,
  recordTaskDeleted,
  recordListCreated,
  recordListDeleted
} from '@/lib/analytics';
import { format, subDays, startOfWeek, startOfMonth } from 'date-fns';

interface UseAnalyticsOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseAnalyticsReturn {
  metrics: ProductivityMetrics | null;
  loading: boolean;
  error: string | null;
  filter: AnalyticsFilter;
  setFilter: (filter: AnalyticsFilter) => void;
  refreshMetrics: () => void;
  recordEvent: {
    taskCreated: (task: Task) => void;
    taskCompleted: (task: Task, completionTime?: number) => void;
    taskUncompleted: (task: Task) => void;
    taskDeleted: (task: Task) => void;
    listCreated: (list: List) => void;
    listDeleted: (list: List) => void;
  };
  exportData: () => string;
  importData: (data: string) => boolean;
  clearData: () => void;
  getEvents: () => AnalyticsEvent[];
}

const DEFAULT_FILTER: AnalyticsFilter = {
  dateRange: {
    start: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  },
  includeCompleted: true,
  includeIncomplete: true
};

export function useAnalytics(
  tasks: Task[] = [],
  lists: List[] = [],
  options: UseAnalyticsOptions = {}
): UseAnalyticsReturn {
  const { autoRefresh = false, refreshInterval = 60000 } = options;
  
  const [metrics, setMetrics] = useState<ProductivityMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<AnalyticsFilter>(DEFAULT_FILTER);

  // Calculate metrics when tasks, lists, or filter changes
  const calculateMetrics = useCallback(async () => {
    if (tasks.length === 0 && lists.length === 0) {
      setMetrics(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const calculatedMetrics = calculateProductivityMetrics(tasks, lists, filter);
      setMetrics(calculatedMetrics);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate metrics');
      console.error('Analytics calculation error:', err);
    } finally {
      setLoading(false);
    }
  }, [tasks, lists, filter]);

  // Initial calculation and when dependencies change
  useEffect(() => {
    calculateMetrics();
  }, [calculateMetrics]);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      calculateMetrics();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, calculateMetrics]);

  // Event recording functions with automatic refresh
  const recordEvent = useMemo(() => ({
    taskCreated: (task: Task) => {
      recordTaskCreated(task);
      calculateMetrics();
    },
    taskCompleted: (task: Task, completionTime?: number) => {
      recordTaskCompleted(task, completionTime);
      calculateMetrics();
    },
    taskUncompleted: (task: Task) => {
      recordTaskUncompleted(task);
      calculateMetrics();
    },
    taskDeleted: (task: Task) => {
      recordTaskDeleted(task);
      calculateMetrics();
    },
    listCreated: (list: List) => {
      recordListCreated(list);
      calculateMetrics();
    },
    listDeleted: (list: List) => {
      recordListDeleted(list);
      calculateMetrics();
    }
  }), [calculateMetrics]);

  // Utility functions
  const exportData = useCallback(() => {
    return getAnalyticsManager().exportData();
  }, []);

  const importData = useCallback((data: string) => {
    const success = getAnalyticsManager().importData(data);
    if (success) {
      calculateMetrics();
    }
    return success;
  }, [calculateMetrics]);

  const clearData = useCallback(() => {
    getAnalyticsManager().clearData();
    setMetrics(null);
  }, []);

  const getEvents = useCallback(() => {
    return getAnalyticsManager().getEvents();
  }, []);

  const refreshMetrics = useCallback(() => {
    calculateMetrics();
  }, [calculateMetrics]);

  return {
    metrics,
    loading,
    error,
    filter,
    setFilter,
    refreshMetrics,
    recordEvent,
    exportData,
    importData,
    clearData,
    getEvents
  };
}

// Predefined filter presets
export const ANALYTICS_PRESETS = {
  last7Days: (): AnalyticsFilter => ({
    dateRange: {
      start: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
      end: format(new Date(), 'yyyy-MM-dd')
    },
    includeCompleted: true,
    includeIncomplete: true
  }),

  last30Days: (): AnalyticsFilter => ({
    dateRange: {
      start: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
      end: format(new Date(), 'yyyy-MM-dd')
    },
    includeCompleted: true,
    includeIncomplete: true
  }),

  thisWeek: (): AnalyticsFilter => ({
    dateRange: {
      start: format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'),
      end: format(new Date(), 'yyyy-MM-dd')
    },
    includeCompleted: true,
    includeIncomplete: true
  }),

  thisMonth: (): AnalyticsFilter => ({
    dateRange: {
      start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
      end: format(new Date(), 'yyyy-MM-dd')
    },
    includeCompleted: true,
    includeIncomplete: true
  }),

  completedOnly: (): AnalyticsFilter => ({
    dateRange: {
      start: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
      end: format(new Date(), 'yyyy-MM-dd')
    },
    includeCompleted: true,
    includeIncomplete: false
  }),

  highPriorityOnly: (): AnalyticsFilter => ({
    dateRange: {
      start: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
      end: format(new Date(), 'yyyy-MM-dd')
    },
    priorities: ['high'],
    includeCompleted: true,
    includeIncomplete: true
  })
};

// Hook for analytics presets
export function useAnalyticsPresets() {
  return {
    presets: ANALYTICS_PRESETS,
    applyPreset: (presetName: keyof typeof ANALYTICS_PRESETS) => {
      return ANALYTICS_PRESETS[presetName]();
    }
  };
}