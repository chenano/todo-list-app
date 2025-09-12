'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Task } from '@/lib/supabase/types';
import { TaskFilters, TaskSort } from '@/lib/validations';
import { TaskItem } from './TaskItem';
import { TaskFilterSort, QuickFilters } from './TaskFilterSort';
import { BulkActionBar } from './BulkActionBar';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Circle, AlertCircle, CheckSquare, Square } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTaskFilters } from '@/hooks/useTaskFilters';
import { getTaskCounts } from '@/lib/task-filters';
import { SwipeHint } from '@/components/ui/swipe-hint';
import { useBulkSelection } from '@/contexts/BulkSelectionContext';
import { Priority } from '@/lib/supabase/types';
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut';
import { performanceMonitor } from '@/lib/performance';

interface TaskListProps {
  tasks: Task[];
  loading?: boolean;
  error?: string | null;
  filters?: TaskFilters;
  sort?: TaskSort;
  onFiltersChange?: (filters: TaskFilters) => void;
  onSortChange?: (sort: TaskSort) => void;
  onToggleComplete?: (taskId: string) => void;
  onEditTask?: (task: Task) => void;
  onDeleteTask?: (taskId: string) => void;
  className?: string;
  emptyMessage?: string;
  emptyDescription?: string;
  showFilters?: boolean;
  showQuickFilters?: boolean;
  compactFilters?: boolean;
  initialFilters?: Partial<TaskFilters>;
  initialSort?: Partial<TaskSort>;
  // Bulk operations
  enableBulkSelection?: boolean;
  availableLists?: Array<{ id: string; name: string }>;
  onBulkComplete?: (taskIds: string[]) => Promise<any>;
  onBulkUncomplete?: (taskIds: string[]) => Promise<any>;
  onBulkDelete?: (taskIds: string[]) => Promise<any>;
  onBulkMove?: (taskIds: string[], targetListId: string) => Promise<any>;
  onBulkUpdatePriority?: (taskIds: string[], priority: Priority) => Promise<any>;
  onBulkUpdateDueDate?: (taskIds: string[], dueDate: string | null) => Promise<any>;
}

export const TaskList = React.memo(function TaskList({
  tasks,
  loading = false,
  error = null,
  filters: externalFilters,
  sort: externalSort,
  onFiltersChange: externalOnFiltersChange,
  onSortChange: externalOnSortChange,
  onToggleComplete,
  onEditTask,
  onDeleteTask,
  className = '',
  emptyMessage = 'No tasks found',
  emptyDescription = 'Create your first task to get started.',
  showFilters = false,
  showQuickFilters = false,
  compactFilters = false,
  initialFilters,
  initialSort,
  // Bulk operations
  enableBulkSelection = false,
  availableLists = [],
  onBulkComplete,
  onBulkUncomplete,
  onBulkDelete,
  onBulkMove,
  onBulkUpdatePriority,
  onBulkUpdateDueDate,
}: TaskListProps) {
  // Keyboard navigation state
  const [focusedTaskIndex, setFocusedTaskIndex] = useState<number>(-1);
  // Use internal filter state if external filters are not provided
  const internalFilterHook = useTaskFilters(initialFilters, initialSort);
  
  const filters = externalFilters || internalFilterHook.filters;
  const sort = externalSort || internalFilterHook.sort;
  const onFiltersChange = externalOnFiltersChange || internalFilterHook.setFilters;
  const onSortChange = externalOnSortChange || internalFilterHook.setSort;
  const hasActiveFilters = internalFilterHook.hasActiveFilters;
  const hasCustomSort = internalFilterHook.hasCustomSort;
  
  // Apply filters and sorting to tasks with memoization
  const filteredAndSortedTasks = useMemo(() => {
    const endMeasure = performanceMonitor.startMeasure('task-filtering');
    const result = internalFilterHook.applyFiltersAndSort(tasks);
    endMeasure();
    return result;
  }, [internalFilterHook, tasks]);
  
  const taskCounts = useMemo(() => {
    const endMeasure = performanceMonitor.startMeasure('task-counting');
    const result = getTaskCounts(tasks);
    endMeasure();
    return result;
  }, [tasks]);

  // Bulk selection context (only used if enableBulkSelection is true)
  const bulkSelection = enableBulkSelection ? useBulkSelection() : null;
  const isSelectionMode = bulkSelection?.state.isSelectionMode ?? false;
  const selectedCount = bulkSelection?.actions.getSelectedCount() ?? 0;

  // Get task IDs for range selection with memoization
  const allTaskIds = useMemo(() => 
    filteredAndSortedTasks.map(task => task.id), 
    [filteredAndSortedTasks]
  );

  // Keyboard navigation handlers
  const handleFocusNext = useCallback(() => {
    if (filteredAndSortedTasks.length === 0) return;
    setFocusedTaskIndex(prev => 
      prev < filteredAndSortedTasks.length - 1 ? prev + 1 : prev
    );
  }, [filteredAndSortedTasks.length]);

  const handleFocusPrevious = useCallback(() => {
    if (filteredAndSortedTasks.length === 0) return;
    setFocusedTaskIndex(prev => prev > 0 ? prev - 1 : prev);
  }, []);

  const handleFocusFirst = useCallback(() => {
    if (filteredAndSortedTasks.length > 0) {
      setFocusedTaskIndex(0);
    }
  }, [filteredAndSortedTasks.length]);

  const handleFocusLast = useCallback(() => {
    if (filteredAndSortedTasks.length > 0) {
      setFocusedTaskIndex(filteredAndSortedTasks.length - 1);
    }
  }, [filteredAndSortedTasks.length]);

  // Reset focus when tasks change
  useEffect(() => {
    if (focusedTaskIndex >= filteredAndSortedTasks.length) {
      setFocusedTaskIndex(filteredAndSortedTasks.length > 0 ? 0 : -1);
    }
  }, [filteredAndSortedTasks.length, focusedTaskIndex]);

  // Keyboard shortcuts for task navigation
  useKeyboardShortcut({
    key: 'ArrowDown',
    modifiers: [],
    context: 'list',
    description: 'Focus next task',
    action: handleFocusNext,
  });

  useKeyboardShortcut({
    key: 'ArrowUp',
    modifiers: [],
    context: 'list',
    description: 'Focus previous task',
    action: handleFocusPrevious,
  });

  useKeyboardShortcut({
    key: 'Home',
    modifiers: [],
    context: 'list',
    description: 'Focus first task',
    action: handleFocusFirst,
  });

  useKeyboardShortcut({
    key: 'End',
    modifiers: [],
    context: 'list',
    description: 'Focus last task',
    action: handleFocusLast,
  });

  // Auto-focus first task when list loads
  useEffect(() => {
    if (filteredAndSortedTasks.length > 0 && focusedTaskIndex === -1) {
      setFocusedTaskIndex(0);
    }
  }, [filteredAndSortedTasks.length, focusedTaskIndex]);

  // Group filtered tasks by completion status for better organization with memoization
  const { completedTasks, incompleteTasks } = useMemo(() => {
    const completed = filteredAndSortedTasks.filter(task => task.completed);
    const incomplete = filteredAndSortedTasks.filter(task => !task.completed);
    return { completedTasks: completed, incompleteTasks: incomplete };
  }, [filteredAndSortedTasks]);

  // Determine if we should show sections (only if not filtering by status)
  const showSections = completedTasks.length > 0 && incompleteTasks.length > 0 && 
                      (!filters.status || filters.status === 'all');

  // Handle select all/none
  const handleSelectAll = useCallback(() => {
    if (!bulkSelection) return;
    const allSelected = allTaskIds.every(id => bulkSelection.actions.isTaskSelected(id));
    if (allSelected) {
      bulkSelection.actions.deselectAll();
    } else {
      bulkSelection.actions.selectAll(allTaskIds);
    }
  }, [bulkSelection, allTaskIds]);

  const allSelected = bulkSelection ? allTaskIds.every(id => bulkSelection.actions.isTaskSelected(id)) : false;
  const someSelected = bulkSelection ? allTaskIds.some(id => bulkSelection.actions.isTaskSelected(id)) : false;

  // Performance monitoring for render
  const renderStartTime = performance.now();
  
  useEffect(() => {
    const renderTime = performance.now() - renderStartTime;
    performanceMonitor.recordMetric({
      name: 'task-list-render',
      value: renderTime,
      timestamp: Date.now(),
      metadata: {
        taskCount: filteredAndSortedTasks.length,
        hasFilters: hasActiveFilters,
        hasCustomSort: hasCustomSort,
      },
    });
  });

  // Conditional rendering based on state
  // Loading state
  if (loading) {
    return (
      <div className={cn('flex items-center justify-center py-8', className)}>
        <div className="flex items-center gap-2 text-muted-foreground">
          <LoadingSpinner size="sm" />
          <span>Loading tasks...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className={cn('border-destructive/50', className)}>
        <CardContent className="flex items-center gap-3 p-6">
          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
          <div>
            <p className="font-medium text-destructive">Error loading tasks</p>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty state - check both original tasks and filtered tasks
  const showEmptyState = tasks.length === 0 || filteredAndSortedTasks.length === 0;
  const isFiltered = hasActiveFilters || hasCustomSort;
  
  if (showEmptyState) {
    const message = tasks.length === 0 ? emptyMessage : 'No tasks match your filters';
    const description = tasks.length === 0 ? emptyDescription : 'Try adjusting your filters to see more tasks.';
    
    return (
      <div className={className}>
        {/* Show filters even when empty if enabled */}
        {showFilters && tasks.length > 0 && (
          <div className="space-y-4 mb-6">
            {showQuickFilters && (
              <QuickFilters
                onApplyPreset={(presetFilters, presetSort) => {
                  onFiltersChange(presetFilters);
                  onSortChange(presetSort);
                }}
                currentFilters={filters}
                currentSort={sort}
              />
            )}
            <TaskFilterSort
              filters={filters}
              sort={sort}
              onFiltersChange={onFiltersChange}
              onSortChange={onSortChange}
              onClearFilters={internalFilterHook.clearAllFilters}
              onResetSort={internalFilterHook.resetSort}
              onReset={internalFilterHook.reset}
              hasActiveFilters={hasActiveFilters}
              hasCustomSort={hasCustomSort}
              taskCounts={taskCounts}
              compact={compactFilters}
            />
          </div>
        )}
        
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-3 mb-4">
              {filters?.status === 'completed' ? (
                <CheckCircle className="h-6 w-6 text-muted-foreground" />
              ) : (
                <Circle className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <h3 className="font-medium text-lg mb-2">{message}</h3>
            <p className="text-muted-foreground text-sm max-w-sm">
              {description}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Swipe Hint for Mobile */}
      {filteredAndSortedTasks.length > 0 && !isSelectionMode && <SwipeHint />}
      
      {/* Bulk Selection Controls */}
      {enableBulkSelection && filteredAndSortedTasks.length > 0 && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSelectAll}
            className="h-9"
          >
            {allSelected ? (
              <>
                <CheckSquare className="h-4 w-4 mr-2" />
                Deselect All
              </>
            ) : (
              <>
                <Square className="h-4 w-4 mr-2" />
                Select All
              </>
            )}
          </Button>
          
          {isSelectionMode && (
            <div className="text-sm text-muted-foreground">
              {selectedCount} of {filteredAndSortedTasks.length} selected
            </div>
          )}
        </div>
      )}
      
      {/* Filter and Sort Controls */}
      {showFilters && (
        <div className="space-y-4">
          {showQuickFilters && (
            <QuickFilters
              onApplyPreset={(presetFilters, presetSort) => {
                onFiltersChange(presetFilters);
                onSortChange(presetSort);
              }}
              currentFilters={filters}
              currentSort={sort}
            />
          )}
          <TaskFilterSort
            filters={filters}
            sort={sort}
            onFiltersChange={onFiltersChange}
            onSortChange={onSortChange}
            onClearFilters={internalFilterHook.clearAllFilters}
            onResetSort={internalFilterHook.resetSort}
            onReset={internalFilterHook.reset}
            hasActiveFilters={hasActiveFilters}
            hasCustomSort={hasCustomSort}
            taskCounts={taskCounts}
            compact={compactFilters}
          />
        </div>
      )}

      {/* Task List */}
      <div className="space-y-3">
        {showSections ? (
          <>
            {/* Incomplete Tasks Section */}
            {incompleteTasks.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Circle className="h-4 w-4" />
                  <span>To Do ({incompleteTasks.length})</span>
                </div>
                {incompleteTasks.map((task, index) => {
                  const taskIndex = filteredAndSortedTasks.findIndex(t => t.id === task.id);
                  return (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onToggleComplete={onToggleComplete}
                      onEdit={onEditTask}
                      onDelete={onDeleteTask}
                      allTaskIds={allTaskIds}
                      enableBulkSelection={enableBulkSelection}
                      isFocused={taskIndex === focusedTaskIndex}
                      onFocus={() => setFocusedTaskIndex(taskIndex)}
                    />
                  );
                })}
              </div>
            )}

            {/* Completed Tasks Section */}
            {completedTasks.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <CheckCircle className="h-4 w-4" />
                  <span>Completed ({completedTasks.length})</span>
                </div>
                {completedTasks.map((task, index) => {
                  const taskIndex = filteredAndSortedTasks.findIndex(t => t.id === task.id);
                  return (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onToggleComplete={onToggleComplete}
                      onEdit={onEditTask}
                      onDelete={onDeleteTask}
                      allTaskIds={allTaskIds}
                      enableBulkSelection={enableBulkSelection}
                      isFocused={taskIndex === focusedTaskIndex}
                      onFocus={() => setFocusedTaskIndex(taskIndex)}
                    />
                  );
                })}
              </div>
            )}
          </>
        ) : (
          // No sections - show all filtered tasks in order
          <>
            {filteredAndSortedTasks.map((task, index) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggleComplete={onToggleComplete}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
                allTaskIds={allTaskIds}
                enableBulkSelection={enableBulkSelection}
                isFocused={index === focusedTaskIndex}
                onFocus={() => setFocusedTaskIndex(index)}
              />
            ))}
          </>
        )}

        {/* Summary */}
        {filteredAndSortedTasks.length > 0 && (
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t">
            <span>
              {isFiltered && (
                <>
                  {filteredAndSortedTasks.length} of {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
                </>
              )}
              {!isFiltered && (
                <>
                  {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'} total
                </>
              )}
            </span>
            {completedTasks.length > 0 && (
              <span>
                {completedTasks.length} completed ({Math.round((completedTasks.length / filteredAndSortedTasks.length) * 100)}%)
              </span>
            )}
          </div>
        )}
      </div>

      {/* Bulk Action Bar */}
      {enableBulkSelection && (
        <BulkActionBar
          tasks={filteredAndSortedTasks}
          availableLists={availableLists}
          onBulkComplete={onBulkComplete}
          onBulkUncomplete={onBulkUncomplete}
          onBulkDelete={onBulkDelete}
          onBulkMove={onBulkMove}
          onBulkUpdatePriority={onBulkUpdatePriority}
          onBulkUpdateDueDate={onBulkUpdateDueDate}
          onSuccess={() => {
            // Trigger a refresh of the task list
            // This could be handled by the parent component
          }}
          onError={(error) => {
            // Handle error display
            console.error('Bulk operation failed:', error);
          }}
        />
      )}
    </div>
  );
});

export default TaskList;