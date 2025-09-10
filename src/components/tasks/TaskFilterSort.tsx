'use client';

import React, { useState } from 'react';
import { TaskFilters as TaskFiltersType, TaskSort as TaskSortType } from '../../types';
import { TaskFilters } from './TaskFilters';
import { TaskSort, TaskSortCompact } from './TaskSort';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { ChevronDown, ChevronUp, Settings2, X } from 'lucide-react';

interface TaskFilterSortProps {
  filters: TaskFiltersType;
  sort: TaskSortType;
  onFiltersChange: (filters: TaskFiltersType) => void;
  onSortChange: (sort: TaskSortType) => void;
  onClearFilters: () => void;
  onResetSort: () => void;
  onReset: () => void;
  hasActiveFilters: boolean;
  hasCustomSort: boolean;
  taskCounts?: {
    total: number;
    completed: number;
    incomplete: number;
    overdue: number;
    byPriority: {
      high: number;
      medium: number;
      low: number;
    };
  };
  compact?: boolean;
  defaultOpen?: boolean;
  className?: string;
}

export function TaskFilterSort({
  filters,
  sort,
  onFiltersChange,
  onSortChange,
  onClearFilters,
  onResetSort,
  onReset,
  hasActiveFilters,
  hasCustomSort,
  taskCounts,
  compact = false,
  defaultOpen = false,
  className = '',
}: TaskFilterSortProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const hasAnyCustomization = hasActiveFilters || hasCustomSort;

  if (compact) {
    return (
      <div className={`flex flex-col gap-3 p-3 bg-muted/50 rounded-lg border sm:flex-row sm:items-center sm:justify-between ${className}`}>
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="flex items-center gap-2 min-w-0">
            <Settings2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="text-sm font-medium text-foreground hidden sm:inline">Sort & Filter</span>
            {hasAnyCustomization && (
              <Badge variant="secondary" className="text-xs">
                {[hasActiveFilters && 'Filtered', hasCustomSort && 'Sorted'].filter(Boolean).join(', ')}
              </Badge>
            )}
          </div>
          
          <div className="min-w-0 flex-1">
            <TaskSortCompact
              sort={sort}
              onSortChange={onSortChange}
              onResetSort={onResetSort}
              hasCustomSort={hasCustomSort}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 justify-end">
          {hasAnyCustomization && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="h-8 px-2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3 sm:mr-1" />
              <span className="hidden sm:inline">Reset</span>
            </Button>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsOpen(!isOpen)}
            className="h-8 px-2"
          >
            {isOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between"
          >
            <div className="flex items-center gap-2">
              <Settings2 className="h-4 w-4" />
              <span>Filter & Sort Tasks</span>
              {hasAnyCustomization && (
                <Badge variant="secondary" className="text-xs">
                  {[hasActiveFilters && 'Filtered', hasCustomSort && 'Sorted'].filter(Boolean).join(', ')}
                </Badge>
              )}
            </div>
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent className="space-y-4">
          <TaskFilters
            filters={filters}
            onFiltersChange={onFiltersChange}
            onClearFilters={onClearFilters}
            hasActiveFilters={hasActiveFilters}
            taskCounts={taskCounts}
          />

          <TaskSort
            sort={sort}
            onSortChange={onSortChange}
            onResetSort={onResetSort}
            hasCustomSort={hasCustomSort}
          />

          {hasAnyCustomization && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                onClick={onReset}
                className="text-gray-600 hover:text-gray-900"
              >
                <X className="h-4 w-4 mr-2" />
                Reset All Filters & Sort
              </Button>
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

/**
 * Quick filter buttons for common filter presets
 */
interface QuickFiltersProps {
  onApplyPreset: (filters: TaskFiltersType, sort: TaskSortType) => void;
  currentFilters: TaskFiltersType;
  currentSort: TaskSortType;
  className?: string;
}

export function QuickFilters({
  onApplyPreset,
  currentFilters,
  currentSort,
  className = '',
}: QuickFiltersProps) {
  const presets = [
    {
      name: 'All',
      filters: { status: 'all' as const, priority: 'all' as const, overdue: false },
      sort: { field: 'created_at' as const, direction: 'desc' as const },
    },
    {
      name: 'To Do',
      filters: { status: 'incomplete' as const, priority: 'all' as const, overdue: false },
      sort: { field: 'created_at' as const, direction: 'desc' as const },
    },
    {
      name: 'Done',
      filters: { status: 'completed' as const, priority: 'all' as const, overdue: false },
      sort: { field: 'created_at' as const, direction: 'desc' as const },
    },
    {
      name: 'High Priority',
      filters: { status: 'incomplete' as const, priority: 'high' as const, overdue: false },
      sort: { field: 'due_date' as const, direction: 'asc' as const },
    },
    {
      name: 'Overdue',
      filters: { status: 'incomplete' as const, priority: 'all' as const, overdue: true },
      sort: { field: 'due_date' as const, direction: 'asc' as const },
    },
  ];

  const isPresetActive = (preset: typeof presets[0]) => {
    return (
      currentFilters.status === preset.filters.status &&
      currentFilters.priority === preset.filters.priority &&
      currentFilters.overdue === preset.filters.overdue &&
      currentSort.field === preset.sort.field &&
      currentSort.direction === preset.sort.direction
    );
  };

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {presets.map((preset) => (
        <Button
          key={preset.name}
          variant={isPresetActive(preset) ? 'default' : 'outline'}
          size="sm"
          onClick={() => onApplyPreset(preset.filters, preset.sort)}
          className="text-xs h-8 px-3 flex-shrink-0"
        >
          {preset.name}
        </Button>
      ))}
    </div>
  );
}