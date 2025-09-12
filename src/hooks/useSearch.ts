'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { searchServerSide, searchClientSide, getSearchSuggestions } from '@/lib/search';
import type { SearchResult, SearchFilters, SearchOptions, Task, List } from '@/types';

export interface UseSearchOptions {
  mode?: 'server' | 'client';
  debounceMs?: number;
  minQueryLength?: number;
  maxResults?: number;
  enableSuggestions?: boolean;
}

export interface UseSearchReturn {
  // State
  query: string;
  results: SearchResult[];
  loading: boolean;
  error: string | null;
  filters: SearchFilters;
  suggestions: string[];
  recentSearches: string[];
  
  // Actions
  setQuery: (query: string) => void;
  setFilters: (filters: Partial<SearchFilters>) => void;
  search: (options?: Partial<SearchOptions>) => Promise<void>;
  searchWithData: (items: (Task | List)[], options?: Partial<SearchOptions>) => void;
  clearSearch: () => void;
  clearRecentSearches: () => void;
  
  // Computed
  hasResults: boolean;
  isEmpty: boolean;
  isSearching: boolean;
}

const RECENT_SEARCHES_KEY = 'todo-recent-searches';
const MAX_RECENT_SEARCHES = 10;

export function useSearch(options: UseSearchOptions = {}): UseSearchReturn {
  const {
    mode = 'server',
    debounceMs = 300,
    minQueryLength = 2,
    maxResults = 50,
    enableSuggestions = true,
  } = options;

  // State
  const [query, setQueryState] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<SearchFilters>({
    type: 'all',
    priority: 'all',
    completed: 'all',
  });
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(null);

  // Load recent searches from localStorage on mount
  useEffect(() => {
    // Check if we're in a browser environment
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return;
    }
    
    const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (saved) {
      try {
        const searches = JSON.parse(saved);
        setRecentSearches(Array.isArray(searches) ? searches : []);
      } catch (error) {
        console.error('Failed to load recent searches:', error);
      }
    }
  }, []);

  // Save recent searches to localStorage
  const saveRecentSearches = useCallback((searches: string[]) => {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches));
    }
  }, []);

  // Add to recent searches
  const addRecentSearch = useCallback((searchQuery: string) => {
    if (searchQuery.length < minQueryLength) return;
    
    setRecentSearches(prev => {
      const filtered = prev.filter(s => s !== searchQuery);
      const updated = [searchQuery, ...filtered].slice(0, MAX_RECENT_SEARCHES);
      saveRecentSearches(updated);
      return updated;
    });
  }, [minQueryLength, saveRecentSearches]);

  // Server-side search
  const performServerSearch = useCallback(async (searchOptions: SearchOptions) => {
    setLoading(true);
    setError(null);

    try {
      const searchResults = await searchServerSide(searchOptions);
      setResults(searchResults);
      addRecentSearch(searchOptions.query);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Search failed';
      setError(errorMessage);
      console.error('Server search error:', err);
    } finally {
      setLoading(false);
    }
  }, [addRecentSearch]);

  // Client-side search
  const performClientSearch = useCallback((
    items: (Task | List)[],
    searchOptions: SearchOptions
  ) => {
    setLoading(true);
    setError(null);

    try {
      const searchResults = searchClientSide(items, searchOptions);
      setResults(searchResults);
      addRecentSearch(searchOptions.query);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Search failed';
      setError(errorMessage);
      console.error('Client search error:', err);
    } finally {
      setLoading(false);
    }
  }, [addRecentSearch]);

  // Debounced search function
  const debouncedSearch = useCallback((searchFn: () => void) => {
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    const timeout = setTimeout(searchFn, debounceMs);
    setDebounceTimeout(timeout);
  }, [debounceMs, debounceTimeout]);

  // Main search function (server-side)
  const search = useCallback(async (searchOptions: Partial<SearchOptions> = {}) => {
    const options: SearchOptions = {
      query,
      filters,
      limit: maxResults,
      includeHighlights: true,
      ...searchOptions,
    };

    if (options.query.length < minQueryLength) {
      setResults([]);
      return;
    }

    if (mode === 'server') {
      debouncedSearch(() => performServerSearch(options));
    }
  }, [query, filters, maxResults, minQueryLength, mode, debouncedSearch, performServerSearch]);

  // Client-side search with data
  const searchWithData = useCallback((
    items: (Task | List)[],
    searchOptions: Partial<SearchOptions> = {}
  ) => {
    const options: SearchOptions = {
      query,
      filters,
      limit: maxResults,
      includeHighlights: true,
      ...searchOptions,
    };

    if (options.query.length < minQueryLength) {
      setResults([]);
      return;
    }

    performClientSearch(items, options);
  }, [query, filters, maxResults, minQueryLength, performClientSearch]);

  // Update query
  const setQuery = useCallback((newQuery: string) => {
    setQueryState(newQuery);
    
    if (newQuery.length < minQueryLength) {
      setResults([]);
      setError(null);
      return;
    }

    // Update suggestions
    if (enableSuggestions) {
      const newSuggestions = getSearchSuggestions(newQuery, recentSearches);
      setSuggestions(newSuggestions);
    }
  }, [minQueryLength, enableSuggestions, recentSearches]);

  // Update filters
  const setFilters = useCallback((newFilters: Partial<SearchFilters>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Clear search
  const clearSearch = useCallback(() => {
    setQueryState('');
    setResults([]);
    setError(null);
    setSuggestions([]);
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
      setDebounceTimeout(null);
    }
  }, [debounceTimeout]);

  // Clear recent searches
  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    // Check if we're in a browser environment
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    }
  }, []);

  // Auto-search when query or filters change
  useEffect(() => {
    if (query.length >= minQueryLength && mode === 'server') {
      search();
    }
  }, [query, filters, search, minQueryLength, mode]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
    };
  }, [debounceTimeout]);

  // Computed values
  const hasResults = results.length > 0;
  const isEmpty = query.length >= minQueryLength && !loading && !hasResults && !error;
  const isSearching = loading && query.length >= minQueryLength;

  return {
    // State
    query,
    results,
    loading,
    error,
    filters,
    suggestions,
    recentSearches,
    
    // Actions
    setQuery,
    setFilters,
    search,
    searchWithData,
    clearSearch,
    clearRecentSearches,
    
    // Computed
    hasResults,
    isEmpty,
    isSearching,
  };
}

// Hook for search keyboard shortcuts
export function useSearchKeyboard(onOpen: () => void, onClose: () => void, isOpen: boolean) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + K to open search
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        onOpen();
      }
      
      // Escape to close search
      if (event.key === 'Escape' && isOpen) {
        event.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onOpen, onClose, isOpen]);
}

// Hook for search analytics (optional)
export function useSearchAnalytics() {
  const [searchStats, setSearchStats] = useState({
    totalSearches: 0,
    popularTerms: [] as string[],
    averageResultsPerSearch: 0,
  });

  const trackSearch = useCallback((query: string, resultCount: number) => {
    setSearchStats(prev => ({
      totalSearches: prev.totalSearches + 1,
      popularTerms: [query, ...prev.popularTerms.filter(t => t !== query)].slice(0, 10),
      averageResultsPerSearch: (prev.averageResultsPerSearch * prev.totalSearches + resultCount) / (prev.totalSearches + 1),
    }));
  }, []);

  return {
    searchStats,
    trackSearch,
  };
}