'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { SearchBar } from '@/components/ui/search-bar';
import { QuickSearchResults } from '@/components/ui/search-results';
import { SearchFiltersComponent } from '@/components/ui/search-filters';
import { useSearch } from '@/hooks/useSearch';
import { useLists } from '@/hooks/useLists';
import type { SearchResult, Task, List } from '@/types';

export interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const router = useRouter();
  const { lists } = useLists();
  const [showFilters, setShowFilters] = useState(false);
  
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
    clearSearch,
    search,
  } = useSearch({
    mode: 'server',
    debounceMs: 300,
    minQueryLength: 1,
    maxResults: 10,
    enableSuggestions: true,
  });

  // Clear search when dialog closes
  useEffect(() => {
    if (!open) {
      clearSearch();
      setShowFilters(false);
    }
  }, [open, clearSearch]);

  // Handle result click
  const handleResultClick = (result: SearchResult) => {
    const { type, item } = result;
    
    if (type === 'task') {
      const task = item as Task;
      router.push(`/dashboard/lists/${task.list_id}?task=${task.id}`);
    } else {
      const list = item as List;
      router.push(`/dashboard/lists/${list.id}`);
    }
    
    onOpenChange(false);
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

  // Available lists for filter
  const availableLists = lists.map(list => ({
    id: list.id,
    name: list.name,
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0">
        <div className="flex flex-col max-h-[80vh]">
          {/* Search header */}
          <div className="border-b p-4 space-y-3">
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
              showSuggestions={!showFilters}
            />
            
            {/* Filters toggle and filters */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {showFilters ? 'Hide filters' : 'Show filters'}
              </button>
              
              {query && (
                <div className="text-xs text-muted-foreground">
                  {loading ? 'Searching...' : `${results.length} results`}
                </div>
              )}
            </div>
            
            {showFilters && (
              <SearchFiltersComponent
                filters={filters}
                onFiltersChange={handleFiltersChange}
                onClearFilters={handleClearFilters}
                availableLists={availableLists}
              />
            )}
          </div>

          {/* Search results */}
          <div className="flex-1 overflow-hidden">
            {query ? (
              <div className="h-full overflow-y-auto">
                <QuickSearchResults
                  results={results}
                  loading={loading}
                  error={error}
                  onResultClick={handleResultClick}
                  emptyMessage="No tasks or lists found"
                  maxResults={20}
                />
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="space-y-2">
                  <h3 className="font-medium">Search your tasks and lists</h3>
                  <p className="text-sm text-muted-foreground">
                    Start typing to find tasks, lists, and more
                  </p>
                </div>
                
                {recentSearches.length > 0 && (
                  <div className="mt-6 space-y-2">
                    <h4 className="text-sm font-medium text-left">Recent searches</h4>
                    <div className="flex flex-wrap gap-2">
                      {recentSearches.slice(0, 5).map((search) => (
                        <button
                          key={search}
                          type="button"
                          onClick={() => setQuery(search)}
                          className="px-2 py-1 text-xs bg-muted hover:bg-muted/80 rounded-md transition-colors"
                        >
                          {search}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer with keyboard shortcuts */}
          <div className="border-t p-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">↵</kbd>
                  <span>to select</span>
                </div>
                <div className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">↑↓</kbd>
                  <span>to navigate</span>
                </div>
                <div className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">esc</kbd>
                  <span>to close</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Hook for global search dialog
export function useSearchDialog() {
  const [isOpen, setIsOpen] = useState(false);

  const openSearch = () => setIsOpen(true);
  const closeSearch = () => setIsOpen(false);

  return {
    isOpen,
    openSearch,
    closeSearch,
  };
}