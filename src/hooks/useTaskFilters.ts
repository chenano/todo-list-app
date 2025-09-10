import { useState, useCallback, useMemo } from 'react';
import { TaskFilters, TaskSort, Task } from '../types';
import { 
  filterAndSortTasks, 
  hasActiveFilters, 
  hasCustomSort, 
  clearFilters, 
  getDefaultSort,
  getTaskCounts 
} from '../lib/task-filters';

export interface UseTaskFiltersState {
  filters: TaskFilters;
  sort: TaskSort;
}

export interface UseTaskFiltersActions {
  setFilters: (filters: TaskFilters) => void;
  setSort: (sort: TaskSort) => void;
  updateFilter: <K extends keyof TaskFilters>(key: K, value: TaskFilters[K]) => void;
  updateSort: <K extends keyof TaskSort>(key: K, value: TaskSort[K]) => void;
  clearAllFilters: () => void;
  resetSort: () => void;
  reset: () => void;
}

export interface UseTaskFiltersReturn extends UseTaskFiltersState, UseTaskFiltersActions {
  hasActiveFilters: boolean;
  hasCustomSort: boolean;
  applyFiltersAndSort: (tasks: Task[]) => Task[];
  getFilteredTaskCounts: (tasks: Task[]) => ReturnType<typeof getTaskCounts>;
}

/**
 * Hook for managing task filters and sorting state
 */
export function useTaskFilters(
  initialFilters?: Partial<TaskFilters>,
  initialSort?: Partial<TaskSort>
): UseTaskFiltersReturn {
  const [filters, setFilters] = useState<TaskFilters>({
    status: 'all',
    priority: 'all',
    overdue: false,
    ...initialFilters,
  });

  const [sort, setSort] = useState<TaskSort>({
    ...getDefaultSort(),
    ...initialSort,
  });

  // Update a specific filter
  const updateFilter = useCallback(<K extends keyof TaskFilters>(
    key: K, 
    value: TaskFilters[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  // Update a specific sort property
  const updateSort = useCallback(<K extends keyof TaskSort>(
    key: K, 
    value: TaskSort[K]
  ) => {
    setSort(prev => ({ ...prev, [key]: value }));
  }, []);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setFilters(clearFilters());
  }, []);

  // Reset sort to default
  const resetSort = useCallback(() => {
    setSort(getDefaultSort());
  }, []);

  // Reset both filters and sort
  const reset = useCallback(() => {
    clearAllFilters();
    resetSort();
  }, [clearAllFilters, resetSort]);

  // Apply filters and sorting to tasks
  const applyFiltersAndSort = useCallback((tasks: Task[]) => {
    return filterAndSortTasks(tasks, filters, sort);
  }, [filters, sort]);

  // Get task counts for filtered results
  const getFilteredTaskCounts = useCallback((tasks: Task[]) => {
    const filteredTasks = applyFiltersAndSort(tasks);
    return getTaskCounts(filteredTasks);
  }, [applyFiltersAndSort]);

  // Computed values
  const hasActiveFiltersValue = useMemo(() => hasActiveFilters(filters), [filters]);
  const hasCustomSortValue = useMemo(() => hasCustomSort(sort), [sort]);

  return {
    filters,
    sort,
    setFilters,
    setSort,
    updateFilter,
    updateSort,
    clearAllFilters,
    resetSort,
    reset,
    hasActiveFilters: hasActiveFiltersValue,
    hasCustomSort: hasCustomSortValue,
    applyFiltersAndSort,
    getFilteredTaskCounts,
  };
}

/**
 * Hook for managing filter state with URL persistence
 */
export function useTaskFiltersWithURL(
  searchParams?: URLSearchParams,
  updateURL?: (params: URLSearchParams) => void
): UseTaskFiltersReturn {
  // Parse initial state from URL
  const initialFilters: Partial<TaskFilters> = useMemo(() => {
    if (!searchParams) return {};
    
    return {
      status: (searchParams.get('status') as TaskFilters['status']) || 'all',
      priority: (searchParams.get('priority') as TaskFilters['priority']) || 'all',
      overdue: searchParams.get('overdue') === 'true',
    };
  }, [searchParams]);

  const initialSort: Partial<TaskSort> = useMemo(() => {
    if (!searchParams) return {};
    
    return {
      field: (searchParams.get('sortBy') as TaskSort['field']) || 'created_at',
      direction: (searchParams.get('sortDir') as TaskSort['direction']) || 'desc',
    };
  }, [searchParams]);

  const filterHook = useTaskFilters(initialFilters, initialSort);

  // Update URL when filters change
  const setFiltersWithURL = useCallback((newFilters: TaskFilters) => {
    filterHook.setFilters(newFilters);
    
    if (updateURL) {
      const params = new URLSearchParams();
      
      if (newFilters.status && newFilters.status !== 'all') {
        params.set('status', newFilters.status);
      }
      if (newFilters.priority && newFilters.priority !== 'all') {
        params.set('priority', newFilters.priority);
      }
      if (newFilters.overdue) {
        params.set('overdue', 'true');
      }
      
      updateURL(params);
    }
  }, [filterHook.setFilters, updateURL]);

  // Update URL when sort changes
  const setSortWithURL = useCallback((newSort: TaskSort) => {
    filterHook.setSort(newSort);
    
    if (updateURL) {
      const params = new URLSearchParams();
      
      // Preserve existing filter params
      if (filterHook.filters.status && filterHook.filters.status !== 'all') {
        params.set('status', filterHook.filters.status);
      }
      if (filterHook.filters.priority && filterHook.filters.priority !== 'all') {
        params.set('priority', filterHook.filters.priority);
      }
      if (filterHook.filters.overdue) {
        params.set('overdue', 'true');
      }
      
      // Add sort params
      if (newSort.field !== 'created_at') {
        params.set('sortBy', newSort.field);
      }
      if (newSort.direction !== 'desc') {
        params.set('sortDir', newSort.direction);
      }
      
      updateURL(params);
    }
  }, [filterHook.setSort, filterHook.filters, updateURL]);

  // Update filter with URL persistence
  const updateFilterWithURL = useCallback(<K extends keyof TaskFilters>(
    key: K, 
    value: TaskFilters[K]
  ) => {
    const newFilters = { ...filterHook.filters, [key]: value };
    setFiltersWithURL(newFilters);
  }, [filterHook.filters, setFiltersWithURL]);

  // Update sort with URL persistence
  const updateSortWithURL = useCallback(<K extends keyof TaskSort>(
    key: K, 
    value: TaskSort[K]
  ) => {
    const newSort = { ...filterHook.sort, [key]: value };
    setSortWithURL(newSort);
  }, [filterHook.sort, setSortWithURL]);

  // Clear filters with URL update
  const clearAllFiltersWithURL = useCallback(() => {
    const clearedFilters = clearFilters();
    setFiltersWithURL(clearedFilters);
  }, [setFiltersWithURL]);

  // Reset sort with URL update
  const resetSortWithURL = useCallback(() => {
    const defaultSort = getDefaultSort();
    setSortWithURL(defaultSort);
  }, [setSortWithURL]);

  // Reset both with URL update
  const resetWithURL = useCallback(() => {
    clearAllFiltersWithURL();
    resetSortWithURL();
  }, [clearAllFiltersWithURL, resetSortWithURL]);

  return {
    ...filterHook,
    setFilters: setFiltersWithURL,
    setSort: setSortWithURL,
    updateFilter: updateFilterWithURL,
    updateSort: updateSortWithURL,
    clearAllFilters: clearAllFiltersWithURL,
    resetSort: resetSortWithURL,
    reset: resetWithURL,
  };
}

/**
 * Hook for managing quick filter presets
 */
export function useTaskFilterPresets() {
  const getPresets = useCallback(() => {
    return [
      {
        name: 'All Tasks',
        filters: { status: 'all' as const, priority: 'all' as const, overdue: false },
        sort: { field: 'created_at' as const, direction: 'desc' as const },
      },
      {
        name: 'Incomplete Tasks',
        filters: { status: 'incomplete' as const, priority: 'all' as const, overdue: false },
        sort: { field: 'created_at' as const, direction: 'desc' as const },
      },
      {
        name: 'Completed Tasks',
        filters: { status: 'completed' as const, priority: 'all' as const, overdue: false },
        sort: { field: 'updated_at' as const, direction: 'desc' as const },
      },
      {
        name: 'High Priority',
        filters: { status: 'incomplete' as const, priority: 'high' as const, overdue: false },
        sort: { field: 'due_date' as const, direction: 'asc' as const },
      },
      {
        name: 'Overdue Tasks',
        filters: { status: 'incomplete' as const, priority: 'all' as const, overdue: true },
        sort: { field: 'due_date' as const, direction: 'asc' as const },
      },
      {
        name: 'Due Soon',
        filters: { status: 'incomplete' as const, priority: 'all' as const, overdue: false },
        sort: { field: 'due_date' as const, direction: 'asc' as const },
      },
    ];
  }, []);

  return { getPresets };
}