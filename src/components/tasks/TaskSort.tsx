'use client';

import React from 'react';
import { TaskSort as TaskSortType } from '../../types';
import { getSortOptions, getDefaultSort } from '../../lib/task-filters';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ArrowUpDown, ArrowUp, ArrowDown, RotateCcw } from 'lucide-react';

interface TaskSortProps {
  sort: TaskSortType;
  onSortChange: (sort: TaskSortType) => void;
  onResetSort: () => void;
  hasCustomSort: boolean;
  className?: string;
}

export function TaskSort({
  sort,
  onSortChange,
  onResetSort,
  hasCustomSort,
  className = '',
}: TaskSortProps) {
  const sortOptions = getSortOptions();

  const handleFieldChange = (value: string) => {
    onSortChange({
      ...sort,
      field: value as TaskSortType['field'],
    });
  };

  const handleDirectionToggle = () => {
    onSortChange({
      ...sort,
      direction: sort.direction === 'asc' ? 'desc' : 'asc',
    });
  };

  const getSortFieldLabel = (field: string) => {
    const option = sortOptions.find(opt => opt.value === field);
    return option?.label || field;
  };

  const getDirectionIcon = () => {
    if (sort.direction === 'asc') {
      return <ArrowUp className="h-4 w-4" />;
    }
    return <ArrowDown className="h-4 w-4" />;
  };

  const getDirectionLabel = () => {
    return sort.direction === 'asc' ? 'Ascending' : 'Descending';
  };

  return (
    <div className={`flex flex-col gap-4 p-4 bg-gray-50 rounded-lg border ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-4 w-4 text-gray-600" />
          <h3 className="font-medium text-gray-900">Sort</h3>
          {hasCustomSort && (
            <Badge variant="secondary" className="text-xs">
              Custom
            </Badge>
          )}
        </div>
        {hasCustomSort && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onResetSort}
            className="h-8 px-2 text-gray-600 hover:text-gray-900"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Reset
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Sort Field */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Sort by</label>
          <Select value={sort.field} onValueChange={handleFieldChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select field" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sort Direction */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Direction</label>
          <Button
            variant="outline"
            onClick={handleDirectionToggle}
            className="w-full justify-start"
          >
            {getDirectionIcon()}
            <span className="ml-2">{getDirectionLabel()}</span>
          </Button>
        </div>
      </div>

      {/* Current Sort Display */}
      <div className="flex items-center gap-2 pt-2 border-t text-sm text-gray-600">
        <span>Sorting by:</span>
        <Badge variant="outline" className="text-xs">
          {getSortFieldLabel(sort.field)} ({getDirectionLabel()})
        </Badge>
      </div>
    </div>
  );
}

/**
 * Compact version of TaskSort for mobile or inline use
 */
export function TaskSortCompact({
  sort,
  onSortChange,
  onResetSort,
  hasCustomSort,
  className = '',
}: TaskSortProps) {
  const sortOptions = getSortOptions();

  const handleFieldChange = (value: string) => {
    onSortChange({
      ...sort,
      field: value as TaskSortType['field'],
    });
  };

  const handleDirectionToggle = () => {
    onSortChange({
      ...sort,
      direction: sort.direction === 'asc' ? 'desc' : 'asc',
    });
  };

  const getDirectionIcon = () => {
    if (sort.direction === 'asc') {
      return <ArrowUp className="h-3 w-3" />;
    }
    return <ArrowDown className="h-3 w-3" />;
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Select value={sort.field} onValueChange={handleFieldChange}>
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {sortOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        variant="outline"
        size="sm"
        onClick={handleDirectionToggle}
        className="px-2"
      >
        {getDirectionIcon()}
      </Button>

      {hasCustomSort && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onResetSort}
          className="px-2 text-gray-500 hover:text-gray-700"
        >
          <RotateCcw className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}