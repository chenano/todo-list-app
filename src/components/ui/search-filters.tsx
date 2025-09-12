'use client';

import React from 'react';
import { Filter, X, Calendar, Tag, CheckSquare, List } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Separator } from '@/components/ui/separator';
import type { SearchFilters } from '@/types';

export interface SearchFiltersProps {
  filters: SearchFilters;
  onFiltersChange: (filters: Partial<SearchFilters>) => void;
  onClearFilters: () => void;
  className?: string;
  availableLists?: Array<{ id: string; name: string }>;
}

export function SearchFiltersComponent({
  filters,
  onFiltersChange,
  onClearFilters,
  className,
  availableLists = [],
}: SearchFiltersProps) {
  const hasActiveFilters = Object.values(filters).some(value => {
    if (typeof value === 'string') return value !== 'all';
    if (typeof value === 'object' && value !== null) return true;
    return false;
  });

  const activeFilterCount = [
    filters.type !== 'all' ? 1 : 0,
    filters.priority !== 'all' ? 1 : 0,
    filters.completed !== 'all' ? 1 : 0,
    filters.dateRange ? 1 : 0,
    filters.listId ? 1 : 0,
  ].reduce((sum, count) => sum + count, 0);

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Filter trigger button */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              'h-8 gap-2',
              hasActiveFilters && 'border-primary text-primary'
            )}
          >
            <Filter className="h-3 w-3" />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-4 w-4 p-0 text-xs">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4" align="start">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Search Filters</h4>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearFilters}
                  className="h-auto p-1 text-xs"
                >
                  Clear all
                </Button>
              )}
            </div>

            <Separator />

            {/* Content Type Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Content Type</label>
              <Select
                value={filters.type || 'all'}
                onValueChange={(value) => onFiltersChange({ type: value as any })}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="tasks">Tasks only</SelectItem>
                  <SelectItem value="lists">Lists only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Priority Filter (only for tasks) */}
            {filters.type !== 'lists' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Priority</label>
                <Select
                  value={filters.priority || 'all'}
                  onValueChange={(value) => onFiltersChange({ priority: value as any })}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All priorities</SelectItem>
                    <SelectItem value="high">High priority</SelectItem>
                    <SelectItem value="medium">Medium priority</SelectItem>
                    <SelectItem value="low">Low priority</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Completion Status Filter (only for tasks) */}
            {filters.type !== 'lists' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select
                  value={filters.completed || 'all'}
                  onValueChange={(value) => onFiltersChange({ completed: value as any })}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All tasks</SelectItem>
                    <SelectItem value="incomplete">Incomplete</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* List Filter */}
            {availableLists.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">List</label>
                <Select
                  value={filters.listId || 'all'}
                  onValueChange={(value) => 
                    onFiltersChange({ listId: value === 'all' ? undefined : value })
                  }
                >
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="All lists" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All lists</SelectItem>
                    {availableLists.map((list) => (
                      <SelectItem key={list.id} value={list.id}>
                        {list.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Date Range Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <DateRangeFilter
                dateRange={filters.dateRange}
                onDateRangeChange={(dateRange) => onFiltersChange({ dateRange })}
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Active filter badges */}
      {hasActiveFilters && (
        <div className="flex items-center gap-1">
          {filters.type !== 'all' && (
            <FilterBadge
              icon={filters.type === 'tasks' ? CheckSquare : List}
              label={filters.type === 'tasks' ? 'Tasks' : 'Lists'}
              onRemove={() => onFiltersChange({ type: 'all' })}
            />
          )}
          
          {filters.priority !== 'all' && (
            <FilterBadge
              icon={Tag}
              label={`${filters.priority} priority`}
              onRemove={() => onFiltersChange({ priority: 'all' })}
            />
          )}
          
          {filters.completed !== 'all' && (
            <FilterBadge
              icon={CheckSquare}
              label={filters.completed === 'completed' ? 'Completed' : 'Incomplete'}
              onRemove={() => onFiltersChange({ completed: 'all' })}
            />
          )}
          
          {filters.listId && (
            <FilterBadge
              icon={List}
              label={availableLists.find(l => l.id === filters.listId)?.name || 'List'}
              onRemove={() => onFiltersChange({ listId: undefined })}
            />
          )}
          
          {filters.dateRange && (
            <FilterBadge
              icon={Calendar}
              label="Date range"
              onRemove={() => onFiltersChange({ dateRange: undefined })}
            />
          )}
        </div>
      )}
    </div>
  );
}

interface FilterBadgeProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onRemove: () => void;
}

function FilterBadge({ icon: Icon, label, onRemove }: FilterBadgeProps) {
  return (
    <Badge variant="secondary" className="gap-1 pr-1">
      <Icon className="h-3 w-3" />
      <span className="text-xs">{label}</span>
      <Button
        variant="ghost"
        size="sm"
        onClick={onRemove}
        className="h-auto w-auto p-0.5 hover:bg-muted-foreground/20"
      >
        <X className="h-2.5 w-2.5" />
        <span className="sr-only">Remove {label} filter</span>
      </Button>
    </Badge>
  );
}

interface DateRangeFilterProps {
  dateRange?: SearchFilters['dateRange'];
  onDateRangeChange: (dateRange?: SearchFilters['dateRange']) => void;
}

function DateRangeFilter({ dateRange, onDateRangeChange }: DateRangeFilterProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const handleDateSelect = (date: Date | undefined, type: 'start' | 'end') => {
    if (!date) return;

    const dateString = format(date, 'yyyy-MM-dd');
    const currentRange = dateRange || { field: 'created_at' };

    if (type === 'start') {
      onDateRangeChange({
        ...currentRange,
        start: dateString,
      });
    } else {
      onDateRangeChange({
        ...currentRange,
        end: dateString,
      });
    }
  };

  const handleFieldChange = (field: 'created_at' | 'due_date') => {
    onDateRangeChange({
      ...dateRange,
      field,
    });
  };

  const handleClear = () => {
    onDateRangeChange(undefined);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'h-8 justify-start text-left font-normal',
            !dateRange && 'text-muted-foreground'
          )}
        >
          <Calendar className="mr-2 h-3 w-3" />
          {dateRange ? (
            <span>
              {dateRange.start && format(new Date(dateRange.start), 'MMM d')}
              {dateRange.start && dateRange.end && ' - '}
              {dateRange.end && format(new Date(dateRange.end), 'MMM d')}
            </span>
          ) : (
            'Select date range'
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Date Range</h4>
            {dateRange && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="h-auto p-1 text-xs"
              >
                Clear
              </Button>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium">Filter by</label>
            <Select
              value={dateRange?.field || 'created_at'}
              onValueChange={handleFieldChange}
            >
              <SelectTrigger className="h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">Created date</SelectItem>
                <SelectItem value="due_date">Due date</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs font-medium">From</label>
              <CalendarComponent
                mode="single"
                selected={dateRange?.start ? new Date(dateRange.start) : undefined}
                onSelect={(date) => handleDateSelect(date, 'start')}
                className="rounded-md border"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">To</label>
              <CalendarComponent
                mode="single"
                selected={dateRange?.end ? new Date(dateRange.end) : undefined}
                onSelect={(date) => handleDateSelect(date, 'end')}
                className="rounded-md border"
              />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}