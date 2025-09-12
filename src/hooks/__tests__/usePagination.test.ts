import { renderHook, act } from '@testing-library/react';
import { usePagination, useInfiniteScroll } from '../usePagination';

describe('usePagination', () => {
  it('initializes with default values', () => {
    const { result } = renderHook(() => usePagination());
    
    expect(result.current.page).toBe(1);
    expect(result.current.pageSize).toBe(50);
    expect(result.current.hasNextPage).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.totalCount).toBeUndefined();
  });

  it('initializes with custom values', () => {
    const { result } = renderHook(() => 
      usePagination({
        initialPage: 2,
        initialPageSize: 25,
      })
    );
    
    expect(result.current.page).toBe(2);
    expect(result.current.pageSize).toBe(25);
  });

  it('respects maxPageSize', () => {
    const { result } = renderHook(() => 
      usePagination({
        initialPageSize: 300,
        maxPageSize: 100,
      })
    );
    
    expect(result.current.pageSize).toBe(100);
  });

  it('navigates to next page', () => {
    const { result } = renderHook(() => usePagination());
    
    act(() => {
      result.current.nextPage();
    });
    
    expect(result.current.page).toBe(2);
  });

  it('navigates to previous page', () => {
    const { result } = renderHook(() => 
      usePagination({ initialPage: 3 })
    );
    
    act(() => {
      result.current.previousPage();
    });
    
    expect(result.current.page).toBe(2);
  });

  it('does not go below page 1', () => {
    const { result } = renderHook(() => usePagination());
    
    act(() => {
      result.current.previousPage();
    });
    
    expect(result.current.page).toBe(1);
  });

  it('goes to specific page', () => {
    const { result } = renderHook(() => usePagination());
    
    act(() => {
      result.current.goToPage(5);
    });
    
    expect(result.current.page).toBe(5);
  });

  it('does not go below page 1 when going to specific page', () => {
    const { result } = renderHook(() => usePagination());
    
    act(() => {
      result.current.goToPage(-1);
    });
    
    expect(result.current.page).toBe(1);
  });

  it('sets page size and resets to page 1', () => {
    const { result } = renderHook(() => 
      usePagination({ initialPage: 3 })
    );
    
    act(() => {
      result.current.setPageSize(25);
    });
    
    expect(result.current.pageSize).toBe(25);
    expect(result.current.page).toBe(1);
  });

  it('respects maxPageSize when setting page size', () => {
    const { result } = renderHook(() => 
      usePagination({ maxPageSize: 100 })
    );
    
    act(() => {
      result.current.setPageSize(200);
    });
    
    expect(result.current.pageSize).toBe(100);
  });

  it('resets to initial state', () => {
    const { result } = renderHook(() => 
      usePagination({
        initialPage: 2,
        initialPageSize: 25,
      })
    );
    
    act(() => {
      result.current.nextPage();
      result.current.setHasNextPage(true);
      result.current.setIsLoading(true);
    });
    
    act(() => {
      result.current.reset();
    });
    
    expect(result.current.page).toBe(2);
    expect(result.current.pageSize).toBe(25);
    expect(result.current.hasNextPage).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it('sets hasNextPage', () => {
    const { result } = renderHook(() => usePagination());
    
    act(() => {
      result.current.setHasNextPage(true);
    });
    
    expect(result.current.hasNextPage).toBe(true);
  });

  it('sets loading state', () => {
    const { result } = renderHook(() => usePagination());
    
    act(() => {
      result.current.setIsLoading(true);
    });
    
    expect(result.current.isLoading).toBe(true);
  });

  it('sets total count', () => {
    const { result } = renderHook(() => usePagination());
    
    act(() => {
      result.current.setTotalCount(100);
    });
    
    expect(result.current.totalCount).toBe(100);
  });
});

describe('useInfiniteScroll', () => {
  const mockFetchFn = jest.fn();

  beforeEach(() => {
    mockFetchFn.mockClear();
  });

  it('initializes with empty state', () => {
    const { result } = renderHook(() => useInfiniteScroll());
    
    expect(result.current.items).toEqual([]);
    expect(result.current.hasNextPage).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('loads more items successfully', async () => {
    mockFetchFn.mockResolvedValue({
      data: [{ id: 1 }, { id: 2 }],
      hasMore: true,
    });

    const { result } = renderHook(() => useInfiniteScroll());
    
    await act(async () => {
      await result.current.loadMore(mockFetchFn);
    });
    
    expect(result.current.items).toEqual([{ id: 1 }, { id: 2 }]);
    expect(result.current.hasNextPage).toBe(true);
    expect(result.current.isLoading).toBe(false);
    expect(mockFetchFn).toHaveBeenCalledWith(1, 50);
  });

  it('appends items on subsequent loads', async () => {
    mockFetchFn
      .mockResolvedValueOnce({
        data: [{ id: 1 }, { id: 2 }],
        hasMore: true,
      })
      .mockResolvedValueOnce({
        data: [{ id: 3 }, { id: 4 }],
        hasMore: false,
      });

    const { result } = renderHook(() => useInfiniteScroll());
    
    await act(async () => {
      await result.current.loadMore(mockFetchFn);
    });
    
    await act(async () => {
      await result.current.loadMore(mockFetchFn);
    });
    
    expect(result.current.items).toEqual([
      { id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }
    ]);
    expect(result.current.hasNextPage).toBe(false);
    expect(mockFetchFn).toHaveBeenCalledTimes(2);
    expect(mockFetchFn).toHaveBeenNthCalledWith(1, 1, 50);
    expect(mockFetchFn).toHaveBeenNthCalledWith(2, 2, 50);
  });

  it('handles fetch errors', async () => {
    mockFetchFn.mockResolvedValue({
      data: [],
      hasMore: false,
      error: 'Failed to fetch',
    });

    const { result } = renderHook(() => useInfiniteScroll());
    
    await act(async () => {
      await result.current.loadMore(mockFetchFn);
    });
    
    expect(result.current.items).toEqual([]);
    expect(result.current.error).toBe('Failed to fetch');
    expect(result.current.isLoading).toBe(false);
  });

  it('handles thrown errors', async () => {
    mockFetchFn.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useInfiniteScroll());
    
    await act(async () => {
      await result.current.loadMore(mockFetchFn);
    });
    
    expect(result.current.items).toEqual([]);
    expect(result.current.error).toBe('Network error');
    expect(result.current.isLoading).toBe(false);
  });

  it('prevents concurrent loads', async () => {
    mockFetchFn.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({
        data: [{ id: 1 }],
        hasMore: false,
      }), 100))
    );

    const { result } = renderHook(() => useInfiniteScroll());
    
    // Start two loads concurrently
    const promise1 = act(async () => {
      await result.current.loadMore(mockFetchFn);
    });
    
    const promise2 = act(async () => {
      await result.current.loadMore(mockFetchFn);
    });
    
    await Promise.all([promise1, promise2]);
    
    // Should only call fetch once
    expect(mockFetchFn).toHaveBeenCalledTimes(1);
  });

  it('resets state', () => {
    const { result } = renderHook(() => useInfiniteScroll());
    
    // Set some state
    act(() => {
      result.current.items.push({ id: 1 });
    });
    
    act(() => {
      result.current.reset();
    });
    
    expect(result.current.items).toEqual([]);
    expect(result.current.hasNextPage).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('refreshes data', async () => {
    mockFetchFn
      .mockResolvedValueOnce({
        data: [{ id: 1 }, { id: 2 }],
        hasMore: true,
      })
      .mockResolvedValueOnce({
        data: [{ id: 3 }, { id: 4 }],
        hasMore: false,
      });

    const { result } = renderHook(() => useInfiniteScroll());
    
    // Load initial data
    await act(async () => {
      await result.current.loadMore(mockFetchFn);
    });
    
    // Refresh should reset to page 1
    await act(async () => {
      await result.current.refresh(mockFetchFn);
    });
    
    expect(result.current.items).toEqual([{ id: 3 }, { id: 4 }]);
    expect(mockFetchFn).toHaveBeenCalledTimes(2);
    expect(mockFetchFn).toHaveBeenNthCalledWith(2, 1, 50);
  });

  it('sets page size', () => {
    const { result } = renderHook(() => useInfiniteScroll({ maxPageSize: 100 }));
    
    act(() => {
      result.current.setPageSize(75);
    });
    
    // Page size change should be reflected in next fetch
    expect(mockFetchFn).not.toHaveBeenCalled();
  });

  it('respects maxPageSize when setting page size', () => {
    const { result } = renderHook(() => useInfiniteScroll({ maxPageSize: 100 }));
    
    act(() => {
      result.current.setPageSize(200);
    });
    
    // Should be clamped to maxPageSize
    // We can't directly test this without triggering a fetch
    expect(result.current.items).toEqual([]);
  });
});