'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { SearchBar } from '@/components/ui/search-bar';
import { SearchResults } from '@/components/ui/search-results';
import { SearchFiltersComponent } from '@/components/ui/search-filters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSearch } from '@/hooks/useSearch';
import { useLists } from '@/hooks/useLists';
import { useAllTasks } from '@/hooks/useTasks';
import type { SearchResult, Task, List } from '@/types';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const { lists } = useLists();
  const { tasks: allTasks } = useAllTasks();
  
  const [mode, setMode] = useState<'server' | 'client'>('server');
  
  const {
    query,
    results,
    loading,
    error,
    filters,
    suggestions,
    recentSearches,
    setQuery,
    setFilters,
    search,
    searchWithData,
    clearSearch,
    hasResults,
    isEmpty,
  } = useSearch({
    mode,
    debounceMs: 300,
    minQueryLength: 1,
    maxResults: 50,
    enableSuggestions: true,
  });

  // Set initial query from URL params
  useEffect(() => {
    if (initialQuery && initialQuery !== query) {
      setQuery(initialQuery);
    }
  }, [initialQuery, query, setQuery]);

  // Handle result click
  const handleResultClick = (result: SearchResult) => {
    const { type, item } = result;
    
    if (type === 'task') {
      const task = item as Task;
      window.location.href = `/dashboard/lists/${task.list_id}?task=${task.id}`;
    } else {
      const list = item as List;
      window.location.href = `/dashboard/lists/${list.id}`;
    }
  };

  // Handle suggestion select
  const handleSuggestionSelect = (suggestion: string) => {
    setQuery(suggestion);
  };

  // Handle filter changes
  const handleFiltersChange = (newFilters: Partial<typeof filters>) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({
      type: 'all',
      priority: 'all',
      completed: 'all',
      dateRange: undefined,
      listId: undefined,
    });
  };

  // Handle mode toggle
  const handleModeToggle = () => {
    const newMode = mode === 'server' ? 'client' : 'server';
    setMode(newMode);
    
    if (newMode === 'client' && query) {
      // Perform client-side search with current data
      const allItems = [...allTasks, ...lists];
      searchWithData(allItems);
    } else if (newMode === 'server' && query) {
      // Perform server-side search
      search();
    }
  };

  // Available lists for filter
  const availableLists = lists.map(list => ({
    id: list.id,
    name: list.name,
  }));

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="space-y-6">
        {/* Page header */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Search</h1>
          <p className="text-muted-foreground">
            Find tasks and lists across your workspace
          </p>
        </div>

        {/* Search interface */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Search your content</CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Mode:</span>
                <button
                  onClick={handleModeToggle}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  {mode === 'server' ? 'Server' : 'Client'}
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search bar */}
            <SearchBar
              value={query}
              onChange={setQuery}
              onClear={clearSearch}
              placeholder="Search tasks and lists..."
              suggestions={suggestions}
              recentSearches={recentSearches}
              loading={loading}
              onSuggestionSelect={handleSuggestionSelect}
              autoFocus
            />

            {/* Filters */}
            <SearchFiltersComponent
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onClearFilters={handleClearFilters}
              availableLists={availableLists}
            />

            {/* Search stats */}
            {query && (
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div>
                  {loading ? (
                    'Searching...'
                  ) : hasResults ? (
                    `Found ${results.length} result${results.length === 1 ? '' : 's'} for "${query}"`
                  ) : isEmpty ? (
                    `No results found for "${query}"`
                  ) : null}
                </div>
                {mode === 'client' && (
                  <div className="text-xs">
                    Searching {allTasks.length} tasks and {lists.length} lists locally
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Search results */}
        {query && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Results</CardTitle>
            </CardHeader>
            <CardContent>
              <SearchResults
                results={results}
                loading={loading}
                error={error}
                onResultClick={handleResultClick}
                emptyMessage={`No results found for "${query}"`}
              />
            </CardContent>
          </Card>
        )}

        {/* Recent searches */}
        {!query && recentSearches.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent searches</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((search) => (
                  <button
                    key={search}
                    onClick={() => setQuery(search)}
                    className="px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded-md transition-colors"
                  >
                    {search}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search tips */}
        {!query && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Search tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <h4 className="font-medium">Search syntax</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Search by task title or description</li>
                    <li>• Search by list name</li>
                    <li>• Use filters to narrow results</li>
                    <li>• Search is case-insensitive</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Keyboard shortcuts</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• <kbd className="px-1 py-0.5 bg-muted rounded text-xs">⌘K</kbd> Open search dialog</li>
                    <li>• <kbd className="px-1 py-0.5 bg-muted rounded text-xs">↵</kbd> Select result</li>
                    <li>• <kbd className="px-1 py-0.5 bg-muted rounded text-xs">↑↓</kbd> Navigate results</li>
                    <li>• <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Esc</kbd> Close search</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}