'use client';

import React from 'react';
import { TaskFilters as TaskFiltersType } from '../../types';
import { getFilterOptions } from '../../lib/task-filters';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { X, Filter } from 'lucide-react';

interface TaskFiltersProps {
  filters: TaskFiltersType;
  onFiltersChange: (filters: TaskFiltersType) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
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
  className?: string;
}

export function TaskFilters({
  filters,
  onFiltersChange,
  onClearFilters,
  hasActiveFilters,
  taskCounts,
  className = '',
}: TaskFiltersProps) {
  const filterOptions = getFilterOptions();

  const handleStatusChange = (value: string) => {
    onFiltersChange({
      ...filters,
      status: value as TaskFiltersType['status'],
    });
  };

  const handlePriorityChange = (value: string) => {
    onFiltersChange({
      ...filters,
      priority: value as TaskFiltersType['priority'],
    });
  };

  const handleOverdueChange = (checked: boolean) => {
    onFiltersChange({
      ...filters,
      overdue: checked,
    });
  };

  const getStatusLabel = (value: string) => {
    const option = filterOptions.status.find(opt => opt.value === value);
    if (!option || !taskCounts) return option?.label || value;
    
    switch (value) {
      case 'completed':
        return `${option.label} (${taskCounts.completed})`;
      case 'incomplete':
        return `${option.label} (${taskCounts.incomplete})`;
      default:
        return `${option.label} (${taskCounts.total})`;
    }
  };

  const getPriorityLabel = (value: string) => {
    const option = filterOptions.priority.find(opt => opt.value === value);
    if (!option || !taskCounts) return option?.label || value;
    
    switch (value) {
      case 'high':
        return `${option.label} (${taskCounts.byPriority.high})`;
      case 'medium':
        return `${option.label} (${taskCounts.byPriority.medium})`;
      case 'low':
        return `${option.label} (${taskCounts.byPriority.low})`;
      default:
        return `${option.label} (${taskCounts.total})`;
    }
  };

  return (
    <div className={`flex flex-col gap-4 p-4 bg-gray-50 rounded-lg border ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-600" />
          <h3 className="font-medium text-gray-900">Filters</h3>
          {hasActiveFilters && (
            <Badge variant="secondary" className="text-xs">
              Active
            </Badge>
          )}
        </div>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="h-8 px-2 text-gray-600 hover:text-gray-900"
          >
            <X className="h-3 w-3 mr-1" />
            Clear
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Status Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Status</label>
          <Select value={filters.status || 'all'} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {filterOptions.status.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {getStatusLabel(option.value)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Priority Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Priority</label>
          <Select value={filters.priority || 'all'} onValueChange={handlePriorityChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent>
              {filterOptions.priority.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {getPriorityLabel(option.value)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Overdue Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Special Filters</label>
          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id="overdue"
              checked={filters.overdue || false}
              onCheckedChange={handleOverdueChange}
            />
            <label
              htmlFor="overdue"
              className="text-sm text-gray-700 cursor-pointer"
            >
              Overdue only
              {taskCounts && taskCounts.overdue > 0 && (
                <span className="ml-1 text-red-600 font-medium">
                  ({taskCounts.overdue})
                </span>
              )}
            </label>
          </div>
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 pt-2 border-t">
          <span className="text-xs text-gray-600">Active filters:</span>
          {filters.status && filters.status !== 'all' && (
            <Badge variant="outline" className="text-xs">
              Status: {filterOptions.status.find(opt => opt.value === filters.status)?.label}
            </Badge>
          )}
          {filters.priority && filters.priority !== 'all' && (
            <Badge variant="outline" className="text-xs">
              Priority: {filterOptions.priority.find(opt => opt.value === filters.priority)?.label}
            </Badge>
          )}
          {filters.overdue && (
            <Badge variant="outline" className="text-xs text-red-600">
              Overdue
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}