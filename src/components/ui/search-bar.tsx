'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Clock, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  placeholder?: string;
  suggestions?: string[];
  recentSearches?: string[];
  loading?: boolean;
  className?: string;
  showSuggestions?: boolean;
  onSuggestionSelect?: (suggestion: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  autoFocus?: boolean;
}

export function SearchBar({
  value,
  onChange,
  onClear,
  placeholder = 'Search tasks and lists...',
  suggestions = [],
  recentSearches = [],
  loading = false,
  className,
  showSuggestions = true,
  onSuggestionSelect,
  onFocus,
  onBlur,
  autoFocus = false,
}: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Combine suggestions and recent searches
  const allSuggestions = [
    ...suggestions,
    ...recentSearches.filter(search => 
      !suggestions.includes(search) && 
      search.toLowerCase().includes(value.toLowerCase())
    ),
  ].slice(0, 5);

  const showSuggestionsDropdown = showSuggestions && isFocused && (value.length > 0 || recentSearches.length > 0);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!showSuggestionsDropdown) return;

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setSelectedIndex(prev => 
            prev < allSuggestions.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          event.preventDefault();
          setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
          break;
        case 'Enter':
          event.preventDefault();
          if (selectedIndex >= 0 && allSuggestions[selectedIndex]) {
            handleSuggestionSelect(allSuggestions[selectedIndex]);
          }
          break;
        case 'Escape':
          setIsFocused(false);
          inputRef.current?.blur();
          break;
      }
    };

    if (isFocused) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isFocused, showSuggestionsDropdown, selectedIndex, allSuggestions]);

  // Reset selected index when suggestions change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [allSuggestions.length, value]);

  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
  };

  const handleBlur = (event: React.FocusEvent) => {
    // Delay blur to allow suggestion clicks
    setTimeout(() => {
      if (!suggestionsRef.current?.contains(document.activeElement)) {
        setIsFocused(false);
        onBlur?.();
      }
    }, 150);
  };

  const handleSuggestionSelect = (suggestion: string) => {
    onChange(suggestion);
    onSuggestionSelect?.(suggestion);
    setIsFocused(false);
    inputRef.current?.blur();
  };

  const handleClear = () => {
    onChange('');
    onClear();
    inputRef.current?.focus();
  };

  return (
    <div className={cn('relative w-full', className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className={cn(
            'pl-10 pr-10',
            loading && 'animate-pulse',
            isFocused && 'ring-2 ring-primary'
          )}
        />
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 p-0 hover:bg-muted"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Clear search</span>
          </Button>
        )}
      </div>

      {/* Suggestions dropdown */}
      {showSuggestionsDropdown && (
        <div
          ref={suggestionsRef}
          className="absolute top-full z-50 mt-1 w-full rounded-md border bg-popover p-1 shadow-md"
        >
          {value.length === 0 && recentSearches.length > 0 && (
            <>
              <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                Recent searches
              </div>
              {recentSearches.slice(0, 5).map((search, index) => (
                <button
                  key={`recent-${search}`}
                  type="button"
                  onClick={() => handleSuggestionSelect(search)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground',
                    selectedIndex === index && 'bg-accent text-accent-foreground'
                  )}
                >
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className="truncate">{search}</span>
                </button>
              ))}
            </>
          )}

          {value.length > 0 && allSuggestions.length > 0 && (
            <>
              {value.length === 0 && recentSearches.length > 0 && (
                <div className="my-1 border-t" />
              )}
              <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                Suggestions
              </div>
              {allSuggestions.map((suggestion, index) => {
                const isRecent = recentSearches.includes(suggestion);
                return (
                  <button
                    key={`suggestion-${suggestion}`}
                    type="button"
                    onClick={() => handleSuggestionSelect(suggestion)}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground',
                      selectedIndex === index && 'bg-accent text-accent-foreground'
                    )}
                  >
                    {isRecent ? (
                      <Clock className="h-3 w-3 text-muted-foreground" />
                    ) : (
                      <TrendingUp className="h-3 w-3 text-muted-foreground" />
                    )}
                    <span className="truncate">{suggestion}</span>
                  </button>
                );
              })}
            </>
          )}

          {value.length > 0 && allSuggestions.length === 0 && (
            <div className="px-2 py-3 text-center text-sm text-muted-foreground">
              No suggestions found
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Keyboard shortcut hint component
export function SearchShortcutHint({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-1 text-xs text-muted-foreground', className)}>
      <span>Press</span>
      <Badge variant="outline" className="px-1.5 py-0.5 text-xs">
        ⌘K
      </Badge>
      <span>to search</span>
    </div>
  );
}