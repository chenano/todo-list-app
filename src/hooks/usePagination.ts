import { useState, useCallback, useRef } from 'react';

export interface PaginationState {
  page: number;
  pageSize: number;
  hasNextPage: boolean;
  isLoading: boolean;
  totalCount?: number;
}

export interface PaginationActions {
  nextPage: () => void;
  previousPage: () => void;
  goToPage: (page: number) => void;
  setPageSize: (size: number) => void;
  reset: () => void;
  setHasNextPage: (hasNext: boolean) => void;
  setIsLoading: (loading: boolean) => void;
  setTotalCount: (count: number) => void;
}

export interface UsePaginationOptions {
  initialPage?: number;
  initialPageSize?: number;
  maxPageSize?: number;
}

export interface UsePaginationReturn extends PaginationState, PaginationActions {}

/**
 * Hook for managing pagination state and actions
 */
export function usePagination({
  initialPage = 1,
  initialPageSize = 50,
  maxPageSize = 200,
}: UsePaginationOptions = {}): UsePaginationReturn {
  const [state, setState] = useState<PaginationState>({
    page: initialPage,
    pageSize: Math.min(initialPageSize, maxPageSize),
    hasNextPage: false,
    isLoading: false,
  });

  const stateRef = useRef(state);
  stateRef.current = state;

  const nextPage = useCallback(() => {
    setState(prev => ({
      ...prev,
      page: prev.page + 1,
    }));
  }, []);

  const previousPage = useCallback(() => {
    setState(prev => ({
      ...prev,
      page: Math.max(1, prev.page - 1),
    }));
  }, []);

  const goToPage = useCallback((page: number) => {
    setState(prev => ({
      ...prev,
      page: Math.max(1, page),
    }));
  }, []);

  const setPageSize = useCallback((size: number) => {
    const newSize = Math.min(Math.max(1, size), maxPageSize);
    setState(prev => ({
      ...prev,
      pageSize: newSize,
      page: 1, // Reset to first page when changing page size
    }));
  }, [maxPageSize]);

  const reset = useCallback(() => {
    setState({
      page: initialPage,
      pageSize: Math.min(initialPageSize, maxPageSize),
      hasNextPage: false,
      isLoading: false,
    });
  }, [initialPage, initialPageSize, maxPageSize]);

  const setHasNextPage = useCallback((hasNext: boolean) => {
    setState(prev => ({
      ...prev,
      hasNextPage: hasNext,
    }));
  }, []);

  const setIsLoading = useCallback((loading: boolean) => {
    setState(prev => ({
      ...prev,
      isLoading: loading,
    }));
  }, []);

  const setTotalCount = useCallback((count: number) => {
    setState(prev => ({
      ...prev,
      totalCount: count,
    }));
  }, []);

  return {
    ...state,
    nextPage,
    previousPage,
    goToPage,
    setPageSize,
    reset,
    setHasNextPage,
    setIsLoading,
    setTotalCount,
  };
}

/**
 * Hook for infinite scroll pagination
 */
export function useInfiniteScroll<T>({
  initialPageSize = 50,
  maxPageSize = 200,
}: UsePaginationOptions = {}) {
  const [items, setItems] = useState<T[]>([]);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const pageRef = useRef(1);
  const pageSizeRef = useRef(Math.min(initialPageSize, maxPageSize));

  const loadMore = useCallback(async (
    fetchFn: (page: number, pageSize: number) => Promise<{
      data: T[];
      hasMore: boolean;
      error?: string;
    }>
  ) => {
    if (isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchFn(pageRef.current, pageSizeRef.current);
      
      if (result.error) {
        setError(result.error);
        return;
      }

      setItems(prev => {
        // If it's the first page, replace items; otherwise, append
        if (pageRef.current === 1) {
          return result.data;
        }
        return [...prev, ...result.data];
      });

      setHasNextPage(result.hasMore);
      pageRef.current += 1;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more items');
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  const reset = useCallback(() => {
    setItems([]);
    setHasNextPage(false);
    setIsLoading(false);
    setError(null);
    pageRef.current = 1;
  }, []);

  const refresh = useCallback(async (
    fetchFn: (page: number, pageSize: number) => Promise<{
      data: T[];
      hasMore: boolean;
      error?: string;
    }>
  ) => {
    pageRef.current = 1;
    await loadMore(fetchFn);
  }, [loadMore]);

  return {
    items,
    hasNextPage,
    isLoading,
    error,
    loadMore,
    reset,
    refresh,
    setPageSize: (size: number) => {
      pageSizeRef.current = Math.min(Math.max(1, size), maxPageSize);
    },
  };
}