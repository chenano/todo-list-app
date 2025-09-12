'use client';

import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { searchServerSide, searchClientSide, debounce } from '@/lib/search';
import type { SearchResult, SearchFilters, SearchOptions } from '@/lib/search';
import type { Task, List } from '@/types';

// Search state interface
export interface SearchState {
  query: string;
  results: SearchResult[];
  loading: boolean;
  error: string | null;
  filters: SearchFilters;
  suggestions: string[];
  recentSearches: string[];
  isOpen: boolean;
  mode: 'server' | 'client';
}

// Search actions
export type SearchAction =
  | { type: 'SET_QUERY'; payload: string }
  | { type: 'SET_RESULTS'; payload: SearchResult[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_FILTERS'; payload: Partial<SearchFilters> }
  | { type: 'SET_SUGGESTIONS'; payload: string[] }
  | { type: 'ADD_RECENT_SEARCH'; payload: string }
  | { type: 'CLEAR_RECENT_SEARCHES' }
  | { type: 'SET_OPEN'; payload: boolean }
  | { type: 'SET_MODE'; payload: 'server' | 'client' }
  | { type: 'CLEAR_SEARCH' }
  | { type: 'RESET_STATE' };

// Initial state
const initialState: SearchState = {
  query: '',
  results: [],
  loading: false,
  error: null,
  filters: {
    type: 'all',
    priority: 'all',
    completed: 'all',
  },
  suggestions: [],
  recentSearches: [],
  isOpen: false,
  mode: 'server',
};

// Search reducer
function searchReducer(state: SearchState, action: SearchAction): SearchState {
  switch (action.type) {
    case 'SET_QUERY':
      return { ...state, query: action.payload };
    
    case 'SET_RESULTS':
      return { ...state, results: action.payload, loading: false, error: null };
    
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    
    case 'SET_FILTERS':
      return { ...state, filters: { ...state.filters, ...action.payload } };
    
    case 'SET_SUGGESTIONS':
      return { ...state, suggestions: action.payload };
    
    case 'ADD_RECENT_SEARCH':
      const newRecentSearches = [
        action.payload,
        ...state.recentSearches.filter(search => search !== action.payload)
      ].slice(0, 10); // Keep only last 10 searches
      return { ...state, recentSearches: newRecentSearches };
    
    case 'CLEAR_RECENT_SEARCHES':
      return { ...state, recentSearches: [] };
    
    case 'SET_OPEN':
      return { ...state, isOpen: action.payload };
    
    case 'SET_MODE':
      return { ...state, mode: action.payload };
    
    case 'CLEAR_SEARCH':
      return {
        ...state,
        query: '',
        results: [],
        error: null,
        suggestions: [],
      };
    
    case 'RESET_STATE':
      return { ...initialState, recentSearches: state.recentSearches };
    
    default:
      return state;
  }
}

// Search context interface
export interface SearchContextValue {
  state: SearchState;
  dispatch: React.Dispatch<SearchAction>;
  search: (options?: Partial<SearchOptions>) => Promise<void>;
  searchWithData: (items: (Task | List)[], options?: Partial<SearchOptions>) => void;
  clearSearch: () => void;
  setQuery: (query: string) => void;
  setFilters: (filters: Partial<SearchFilters>) => void;
  openSearch: () => void;
  closeSearch: () => void;
  addRecentSearch: (query: string) => void;
}

// Create context
const SearchContext = createContext<SearchContextValue | undefined>(undefined);

// Search provider props
interface SearchProviderProps {
  children: React.ReactNode;
  defaultMode?: 'server' | 'client';
}

// Search provider component
export function SearchProvider({ children, defaultMode = 'server' }: SearchProviderProps) {
  const [state, dispatch] = useReducer(searchReducer, {
    ...initialState,
    mode: defaultMode,
  });

  // Load recent searches from localStorage on mount
  useEffect(() => {
    const savedSearches = localStorage.getItem('todo-recent-searches');
    if (savedSearches) {
      try {
        const searches = JSON.parse(savedSearches);
        searches.forEach((search: string) => {
          dispatch({ type: 'ADD_RECENT_SEARCH', payload: search });
        });
      } catch (error) {
        console.error('Failed to load recent searches:', error);
      }
    }
  }, []);

  // Save recent searches to localStorage
  useEffect(() => {
    localStorage.setItem('todo-recent-searches', JSON.stringify(state.recentSearches));
  }, [state.recentSearches]);

  // Server-side search function
  const search = useCallback(async (options: Partial<SearchOptions> = {}) => {
    const searchOptions: SearchOptions = {
      query: state.query,
      filters: state.filters,
      limit: 50,
      includeHighlights: true,
      ...options,
    };

    if (!searchOptions.query.trim()) {
      dispatch({ type: 'SET_RESULTS', payload: [] });
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const results = await searchServerSide(searchOptions);
      dispatch({ type: 'SET_RESULTS', payload: results });
      
      // Add to recent searches if it's a meaningful query
      if (searchOptions.query.length >= 2) {
        dispatch({ type: 'ADD_RECENT_SEARCH', payload: searchOptions.query });
      }
    } catch (error) {
      console.error('Search failed:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Search failed. Please try again.' });
    }
  }, [state.query, state.filters]);

  // Client-side search function
  const searchWithData = useCallback((
    items: (Task | List)[],
    options: Partial<SearchOptions> = {}
  ) => {
    const searchOptions: SearchOptions = {
      query: state.query,
      filters: state.filters,
      limit: 50,
      includeHighlights: true,
      ...options,
    };

    if (!searchOptions.query.trim()) {
      dispatch({ type: 'SET_RESULTS', payload: [] });
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const results = searchClientSide(items, searchOptions);
      dispatch({ type: 'SET_RESULTS', payload: results });
      
      // Add to recent searches if it's a meaningful query
      if (searchOptions.query.length >= 2) {
        dispatch({ type: 'ADD_RECENT_SEARCH', payload: searchOptions.query });
      }
    } catch (error) {
      console.error('Client search failed:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Search failed. Please try again.' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.query, state.filters]);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(() => {
      if (state.mode === 'server') {
        search();
      }
    }, 300),
    [search, state.mode]
  );

  // Trigger search when query or filters change
  useEffect(() => {
    if (state.query.trim()) {
      debouncedSearch();
    } else {
      dispatch({ type: 'SET_RESULTS', payload: [] });
    }
  }, [state.query, state.filters, debouncedSearch]);

  // Helper functions
  const clearSearch = useCallback(() => {
    dispatch({ type: 'CLEAR_SEARCH' });
  }, []);

  const setQuery = useCallback((query: string) => {
    dispatch({ type: 'SET_QUERY', payload: query });
  }, []);

  const setFilters = useCallback((filters: Partial<SearchFilters>) => {
    dispatch({ type: 'SET_FILTERS', payload: filters });
  }, []);

  const openSearch = useCallback(() => {
    dispatch({ type: 'SET_OPEN', payload: true });
  }, []);

  const closeSearch = useCallback(() => {
    dispatch({ type: 'SET_OPEN', payload: false });
  }, []);

  const addRecentSearch = useCallback((query: string) => {
    dispatch({ type: 'ADD_RECENT_SEARCH', payload: query });
  }, []);

  const contextValue: SearchContextValue = {
    state,
    dispatch,
    search,
    searchWithData,
    clearSearch,
    setQuery,
    setFilters,
    openSearch,
    closeSearch,
    addRecentSearch,
  };

  return (
    <SearchContext.Provider value={contextValue}>
      {children}
    </SearchContext.Provider>
  );
}

// Custom hook to use search context
export function useSearch(): SearchContextValue {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
}

// Custom hook for search keyboard shortcuts
export function useSearchShortcuts() {
  const { openSearch, closeSearch, state } = useSearch();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + K to open search
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        openSearch();
      }
      
      // Escape to close search
      if (event.key === 'Escape' && state.isOpen) {
        event.preventDefault();
        closeSearch();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [openSearch, closeSearch, state.isOpen]);
}