'use client';

import { Task } from '@/lib/supabase/types';
import { TaskFilters, TaskSort } from '@/lib/validations';
import { TaskItem } from './TaskItem';
import { TaskFilterSort, QuickFilters } from './TaskFilterSort';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Circle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTaskFilters } from '@/hooks/useTaskFilters';
import { getTaskCounts } from '@/lib/task-filters';
import { SwipeHint } from '@/components/ui/swipe-hint';

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
}

export function TaskList({
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
}: TaskListProps) {
  // Use internal filter state if external filters are not provided
  const internalFilterHook = useTaskFilters(initialFilters, initialSort);
  
  const filters = externalFilters || internalFilterHook.filters;
  const sort = externalSort || internalFilterHook.sort;
  const onFiltersChange = externalOnFiltersChange || internalFilterHook.setFilters;
  const onSortChange = externalOnSortChange || internalFilterHook.setSort;
  const hasActiveFilters = internalFilterHook.hasActiveFilters;
  const hasCustomSort = internalFilterHook.hasCustomSort;
  
  // Apply filters and sorting to tasks
  const filteredAndSortedTasks = internalFilterHook.applyFiltersAndSort(tasks);
  const taskCounts = getTaskCounts(tasks);
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

  // Group filtered tasks by completion status for better organization
  const completedTasks = filteredAndSortedTasks.filter(task => task.completed);
  const incompleteTasks = filteredAndSortedTasks.filter(task => !task.completed);

  // Determine if we should show sections (only if not filtering by status)
  const showSections = completedTasks.length > 0 && incompleteTasks.length > 0 && 
                      (!filters.status || filters.status === 'all');

  return (
    <div className={cn('space-y-6', className)}>
      {/* Swipe Hint for Mobile */}
      {filteredAndSortedTasks.length > 0 && <SwipeHint />}
      
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
                {incompleteTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggleComplete={onToggleComplete}
                    onEdit={onEditTask}
                    onDelete={onDeleteTask}
                  />
                ))}
              </div>
            )}

            {/* Completed Tasks Section */}
            {completedTasks.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <CheckCircle className="h-4 w-4" />
                  <span>Completed ({completedTasks.length})</span>
                </div>
                {completedTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggleComplete={onToggleComplete}
                    onEdit={onEditTask}
                    onDelete={onDeleteTask}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          // No sections - show all filtered tasks in order
          <>
            {filteredAndSortedTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggleComplete={onToggleComplete}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
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
    </div>
  );
}

export default TaskList;