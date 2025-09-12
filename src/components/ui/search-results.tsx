'use client';

import React from 'react';
import { FileText, CheckSquare, Calendar, AlertCircle, List } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { highlightMatches } from '@/lib/search';
import type { SearchResult, Task, List as ListType } from '@/types';

export interface SearchResultsProps {
  results: SearchResult[];
  loading?: boolean;
  error?: string | null;
  onResultClick?: (result: SearchResult) => void;
  className?: string;
  emptyMessage?: string;
  maxResults?: number;
}

export function SearchResults({
  results,
  loading = false,
  error = null,
  onResultClick,
  className,
  emptyMessage = 'No results found',
  maxResults,
}: SearchResultsProps) {
  const displayResults = maxResults ? results.slice(0, maxResults) : results;

  if (loading) {
    return (
      <div className={cn('space-y-2', className)}>
        {Array.from({ length: 3 }).map((_, index) => (
          <SearchResultSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('flex items-center justify-center py-8', className)}>
        <div className="text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (displayResults.length === 0) {
    return (
      <div className={cn('flex items-center justify-center py-8', className)}>
        <div className="text-center">
          <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      {displayResults.map((result, index) => (
        <SearchResultItem
          key={`${result.type}-${result.item.id}-${index}`}
          result={result}
          onClick={() => onResultClick?.(result)}
        />
      ))}
      {maxResults && results.length > maxResults && (
        <div className="pt-2 text-center">
          <p className="text-sm text-muted-foreground">
            Showing {maxResults} of {results.length} results
          </p>
        </div>
      )}
    </div>
  );
}

interface SearchResultItemProps {
  result: SearchResult;
  onClick?: () => void;
}

function SearchResultItem({ result, onClick }: SearchResultItemProps) {
  const { type, item, matches, listName, score } = result;
  const isTask = type === 'task';
  const task = isTask ? (item as Task) : null;
  const list = !isTask ? (item as ListType) : null;

  const title = isTask ? task!.title : list!.name;
  const description = isTask ? task?.description : list?.description;

  // Highlight matches in title and description
  const titleMatches = matches.filter(m => m.field === 'title' || m.field === 'name');
  const descriptionMatches = matches.filter(m => m.field === 'description');

  const highlightedTitle = titleMatches.length > 0 
    ? highlightMatches(title, titleMatches)
    : title;

  const highlightedDescription = description && descriptionMatches.length > 0
    ? highlightMatches(description, descriptionMatches)
    : description;

  return (
    <Card
      className={cn(
        'cursor-pointer p-3 transition-colors hover:bg-muted/50',
        onClick && 'hover:shadow-sm'
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="mt-0.5 flex-shrink-0">
          {isTask ? (
            <CheckSquare 
              className={cn(
                'h-4 w-4',
                task?.completed ? 'text-green-600' : 'text-muted-foreground'
              )} 
            />
          ) : (
            <List className="h-4 w-4 text-muted-foreground" />
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              {/* Title */}
              <h3 
                className="font-medium text-sm leading-5"
                dangerouslySetInnerHTML={{ __html: highlightedTitle }}
              />
              
              {/* Description */}
              {highlightedDescription && (
                <p 
                  className="mt-1 text-xs text-muted-foreground line-clamp-2"
                  dangerouslySetInnerHTML={{ __html: highlightedDescription }}
                />
              )}

              {/* Metadata */}
              <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                {/* Type indicator */}
                <Badge variant="outline" className="px-1.5 py-0.5 text-xs">
                  {isTask ? 'Task' : 'List'}
                </Badge>

                {/* List name for tasks */}
                {isTask && listName && (
                  <>
                    <span>•</span>
                    <span className="truncate">{listName}</span>
                  </>
                )}

                {/* Task-specific metadata */}
                {isTask && task && (
                  <>
                    {/* Priority */}
                    <span>•</span>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        'px-1.5 py-0.5 text-xs',
                        task.priority === 'high' && 'border-red-200 text-red-700',
                        task.priority === 'medium' && 'border-yellow-200 text-yellow-700',
                        task.priority === 'low' && 'border-green-200 text-green-700'
                      )}
                    >
                      {task.priority}
                    </Badge>

                    {/* Due date */}
                    {task.due_date && (
                      <>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {format(new Date(task.due_date), 'MMM d')}
                          </span>
                        </div>
                      </>
                    )}

                    {/* Completion status */}
                    {task.completed && (
                      <>
                        <span>•</span>
                        <Badge variant="outline" className="px-1.5 py-0.5 text-xs text-green-700 border-green-200">
                          Completed
                        </Badge>
                      </>
                    )}
                  </>
                )}

                {/* Search score (for debugging) */}
                {process.env.NODE_ENV === 'development' && score && (
                  <>
                    <span>•</span>
                    <span className="text-xs opacity-50">
                      Score: {score.toFixed(2)}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

function SearchResultSkeleton() {
  return (
    <Card className="p-3">
      <div className="flex items-start gap-3">
        <Skeleton className="mt-0.5 h-4 w-4 flex-shrink-0" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-full" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-14" />
          </div>
        </div>
      </div>
    </Card>
  );
}

// Quick search results for dropdown/modal
export interface QuickSearchResultsProps extends Omit<SearchResultsProps, 'className'> {
  compact?: boolean;
}

export function QuickSearchResults({
  results,
  loading,
  error,
  onResultClick,
  emptyMessage = 'No results found',
  maxResults = 5,
  compact = true,
}: QuickSearchResultsProps) {
  if (loading) {
    return (
      <div className="space-y-1 p-2">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="flex items-center gap-2 p-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 flex-1" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <AlertCircle className="mx-auto h-6 w-6 text-muted-foreground" />
        <p className="mt-1 text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="p-4 text-center">
        <FileText className="mx-auto h-6 w-6 text-muted-foreground" />
        <p className="mt-1 text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  const displayResults = results.slice(0, maxResults);

  return (
    <div className="max-h-80 overflow-y-auto">
      {displayResults.map((result, index) => {
        const isTask = result.type === 'task';
        const item = result.item;
        const title = isTask ? (item as Task).title : (item as ListType).name;
        
        return (
          <button
            key={`${result.type}-${item.id}-${index}`}
            type="button"
            onClick={() => onResultClick?.(result)}
            className="flex w-full items-center gap-3 p-2 text-left hover:bg-accent hover:text-accent-foreground"
          >
            {isTask ? (
              <CheckSquare className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
            ) : (
              <List className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{title}</p>
              {result.listName && isTask && (
                <p className="truncate text-xs text-muted-foreground">
                  in {result.listName}
                </p>
              )}
            </div>
            <Badge variant="outline" className="px-1.5 py-0.5 text-xs">
              {isTask ? 'Task' : 'List'}
            </Badge>
          </button>
        );
      })}
      
      {results.length > maxResults && (
        <div className="border-t p-2 text-center">
          <p className="text-xs text-muted-foreground">
            +{results.length - maxResults} more results
          </p>
        </div>
      )}
    </div>
  );
}