import { useCallback, useMemo } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { TaskFilters, TaskSort } from '../types';
import { useTaskFilters } from './useTaskFilters';

/**
 * Hook for managing task filters and sort with URL persistence
 */
export function useTaskFiltersURL() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Parse initial state from URL
  const initialFilters: Partial<TaskFilters> = useMemo(() => {
    return {
      status: (searchParams.get('status') as TaskFilters['status']) || 'all',
      priority: (searchParams.get('priority') as TaskFilters['priority']) || 'all',
      overdue: searchParams.get('overdue') === 'true',
    };
  }, [searchParams]);

  const initialSort: Partial<TaskSort> = useMemo(() => {
    return {
      field: (searchParams.get('sortBy') as TaskSort['field']) || 'created_at',
      direction: (searchParams.get('sortDir') as TaskSort['direction']) || 'desc',
    };
  }, [searchParams]);

  const filterHook = useTaskFilters(initialFilters, initialSort);

  // Update URL when filters or sort change
  const updateURL = useCallback((newFilters: TaskFilters, newSort: TaskSort) => {
    const params = new URLSearchParams();
    
    // Add filter params
    if (newFilters.status && newFilters.status !== 'all') {
      params.set('status', newFilters.status);
    }
    if (newFilters.priority && newFilters.priority !== 'all') {
      params.set('priority', newFilters.priority);
    }
    if (newFilters.overdue) {
      params.set('overdue', 'true');
    }
    
    // Add sort params
    if (newSort.field !== 'created_at') {
      params.set('sortBy', newSort.field);
    }
    if (newSort.direction !== 'desc') {
      params.set('sortDir', newSort.direction);
    }
    
    const queryString = params.toString();
    const newURL = queryString ? `${pathname}?${queryString}` : pathname;
    
    router.replace(newURL, { scroll: false });
  }, [router, pathname]);

  // Override filter and sort setters to update URL
  const setFiltersWithURL = useCallback((newFilters: TaskFilters) => {
    filterHook.setFilters(newFilters);
    updateURL(newFilters, filterHook.sort);
  }, [filterHook.setFilters, filterHook.sort, updateURL]);

  const setSortWithURL = useCallback((newSort: TaskSort) => {
    filterHook.setSort(newSort);
    updateURL(filterHook.filters, newSort);
  }, [filterHook.setSort, filterHook.filters, updateURL]);

  const updateFilterWithURL = useCallback(<K extends keyof TaskFilters>(
    key: K, 
    value: TaskFilters[K]
  ) => {
    const newFilters = { ...filterHook.filters, [key]: value };
    setFiltersWithURL(newFilters);
  }, [filterHook.filters, setFiltersWithURL]);

  const updateSortWithURL = useCallback(<K extends keyof TaskSort>(
    key: K, 
    value: TaskSort[K]
  ) => {
    const newSort = { ...filterHook.sort, [key]: value };
    setSortWithURL(newSort);
  }, [filterHook.sort, setSortWithURL]);

  const clearAllFiltersWithURL = useCallback(() => {
    const clearedFilters = { status: 'all' as const, priority: 'all' as const, overdue: false };
    setFiltersWithURL(clearedFilters);
  }, [setFiltersWithURL]);

  const resetSortWithURL = useCallback(() => {
    const defaultSort = { field: 'created_at' as const, direction: 'desc' as const };
    setSortWithURL(defaultSort);
  }, [setSortWithURL]);

  const resetWithURL = useCallback(() => {
    const clearedFilters = { status: 'all' as const, priority: 'all' as const, overdue: false };
    const defaultSort = { field: 'created_at' as const, direction: 'desc' as const };
    filterHook.setFilters(clearedFilters);
    filterHook.setSort(defaultSort);
    updateURL(clearedFilters, defaultSort);
  }, [filterHook.setFilters, filterHook.setSort, updateURL]);

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
 * Hook for managing task filters with URL persistence (simplified version)
 */
export function useTaskFiltersSimpleURL() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const filters: TaskFilters = useMemo(() => ({
    status: (searchParams.get('status') as TaskFilters['status']) || 'all',
    priority: (searchParams.get('priority') as TaskFilters['priority']) || 'all',
    overdue: searchParams.get('overdue') === 'true',
  }), [searchParams]);

  const sort: TaskSort = useMemo(() => ({
    field: (searchParams.get('sortBy') as TaskSort['field']) || 'created_at',
    direction: (searchParams.get('sortDir') as TaskSort['direction']) || 'desc',
  }), [searchParams]);

  const updateFilters = useCallback((newFilters: Partial<TaskFilters>) => {
    const params = new URLSearchParams(searchParams);
    
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== 'all' && value !== false) {
        params.set(key, String(value));
      } else {
        params.delete(key);
      }
    });
    
    const queryString = params.toString();
    const newURL = queryString ? `${pathname}?${queryString}` : pathname;
    router.replace(newURL, { scroll: false });
  }, [searchParams, pathname, router]);

  const updateSort = useCallback((newSort: Partial<TaskSort>) => {
    const params = new URLSearchParams(searchParams);
    
    if (newSort.field && newSort.field !== 'created_at') {
      params.set('sortBy', newSort.field);
    } else {
      params.delete('sortBy');
    }
    
    if (newSort.direction && newSort.direction !== 'desc') {
      params.set('sortDir', newSort.direction);
    } else {
      params.delete('sortDir');
    }
    
    const queryString = params.toString();
    const newURL = queryString ? `${pathname}?${queryString}` : pathname;
    router.replace(newURL, { scroll: false });
  }, [searchParams, pathname, router]);

  const clearAll = useCallback(() => {
    router.replace(pathname, { scroll: false });
  }, [pathname, router]);

  return {
    filters,
    sort,
    updateFilters,
    updateSort,
    clearAll,
  };
}