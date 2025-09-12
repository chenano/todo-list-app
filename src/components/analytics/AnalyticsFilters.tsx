'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { AnalyticsFilter, List, Priority } from '@/types';
import { format, parseISO } from 'date-fns';

interface AnalyticsFiltersProps {
  filter: AnalyticsFilter;
  onFilterChange: (filter: AnalyticsFilter) => void;
  lists: List[];
  className?: string;
}

export function AnalyticsFilters({ 
  filter, 
  onFilterChange, 
  lists, 
  className 
}: AnalyticsFiltersProps) {
  const handleDateRangeChange = (field: 'start' | 'end', date: Date | undefined) => {
    if (!date) return;
    
    onFilterChange({
      ...filter,
      dateRange: {
        ...filter.dateRange,
        [field]: format(date, 'yyyy-MM-dd')
      }
    });
  };

  const handleListToggle = (listId: string, checked: boolean) => {
    const currentListIds = filter.listIds || [];
    
    if (checked) {
      onFilterChange({
        ...filter,
        listIds: [...currentListIds, listId]
      });
    } else {
      onFilterChange({
        ...filter,
        listIds: currentListIds.filter(id => id !== listId)
      });
    }
  };

  const handlePriorityToggle = (priority: Priority, checked: boolean) => {
    const currentPriorities = filter.priorities || [];
    
    if (checked) {
      onFilterChange({
        ...filter,
        priorities: [...currentPriorities, priority]
      });
    } else {
      onFilterChange({
        ...filter,
        priorities: currentPriorities.filter(p => p !== priority)
      });
    }
  };

  const handleCompletionStatusChange = (field: 'includeCompleted' | 'includeIncomplete', checked: boolean) => {
    onFilterChange({
      ...filter,
      [field]: checked
    });
  };

  const resetFilters = () => {
    onFilterChange({
      dateRange: filter.dateRange, // Keep date range
      includeCompleted: true,
      includeIncomplete: true
    });
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Date Range */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Date Range</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Start Date</Label>
            <DatePicker
              date={parseISO(filter.dateRange.start)}
              onDateChange={(date) => handleDateRangeChange('start', date)}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">End Date</Label>
            <DatePicker
              date={parseISO(filter.dateRange.end)}
              onDateChange={(date) => handleDateRangeChange('end', date)}
            />
          </div>
        </div>
      </div>

      {/* Task Status */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Task Status</Label>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="include-completed"
              checked={filter.includeCompleted !== false}
              onCheckedChange={(checked) => 
                handleCompletionStatusChange('includeCompleted', checked as boolean)
              }
            />
            <Label htmlFor="include-completed" className="text-sm">
              Include completed tasks
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="include-incomplete"
              checked={filter.includeIncomplete !== false}
              onCheckedChange={(checked) => 
                handleCompletionStatusChange('includeIncomplete', checked as boolean)
              }
            />
            <Label htmlFor="include-incomplete" className="text-sm">
              Include incomplete tasks
            </Label>
          </div>
        </div>
      </div>

      {/* Priority Filter */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Priority Levels</Label>
        <div className="space-y-2">
          {(['high', 'medium', 'low'] as Priority[]).map((priority) => (
            <div key={priority} className="flex items-center space-x-2">
              <Checkbox
                id={`priority-${priority}`}
                checked={!filter.priorities || filter.priorities.includes(priority)}
                onCheckedChange={(checked) => 
                  handlePriorityToggle(priority, checked as boolean)
                }
              />
              <Label htmlFor={`priority-${priority}`} className="text-sm capitalize">
                {priority} priority
              </Label>
              <div className={`w-3 h-3 rounded-full ${
                priority === 'high' ? 'bg-red-500' :
                priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
              }`} />
            </div>
          ))}
        </div>
      </div>

      {/* List Filter */}
      {lists.length > 0 && (
        <div className="space-y-3">
          <Label className="text-sm font-medium">Lists</Label>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {lists.map((list) => (
              <div key={list.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`list-${list.id}`}
                  checked={!filter.listIds || filter.listIds.includes(list.id)}
                  onCheckedChange={(checked) => 
                    handleListToggle(list.id, checked as boolean)
                  }
                />
                <Label htmlFor={`list-${list.id}`} className="text-sm">
                  {list.name}
                </Label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-4 border-t">
        <Button onClick={resetFilters} variant="outline" size="sm">
          Reset Filters
        </Button>
        <div className="text-xs text-muted-foreground flex items-center">
          Filters are applied automatically
        </div>
      </div>
    </div>
  );
}