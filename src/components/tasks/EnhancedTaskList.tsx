'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Task } from '@/lib/supabase/types';
import { TaskFilters, TaskSort } from '@/lib/validations';
import { TaskList } from './TaskList';
import { VirtualTaskList } from './VirtualTaskList';
import { useInfiniteScroll } from '@/hooks/usePagination';
import { taskService } from '@/lib/tasks';
import { performanceMonitor } from '@/lib/performance';
import { Priority } from '@/lib/supabase/types';

interface EnhancedTaskListProps {
  listId?: string;
  tasks?: Task[];
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
  // Performance options
  enableVirtualScrolling?: boolean;
  virtualScrollThreshold?: number;
  pageSize?: number;
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

export function EnhancedTaskList({
  listId,
  tasks: externalTasks,
  loading: externalLoading = false,
  error: externalError = null,
  filters,
  sort,
  onFiltersChange,
  onSortChange,
  onToggleComplete,
  onEditTask,
  onDeleteTask,
  className,
  emptyMessage,
  emptyDescription,
  showFilters = false,
  showQuickFilters = false,
  compactFilters = false,
  initialFilters,
  initialSort,
  // Performance options
  enableVirtualScrolling = false,
  virtualScrollThreshold = 100,
  pageSize = 50,
  // Bulk operations
  enableBulkSelection = false,
  availableLists = [],
  onBulkComplete,
  onBulkUncomplete,
  onBulkDelete,
  onBulkMove,
  onBulkUpdatePriority,
  onBulkUpdateDueDate,
}: EnhancedTaskListProps) {
  const [internalTasks, setInternalTasks] = useState<Task[]>([]);
  const [internalLoading, setInternalLoading] = useState(false);
  const [internalError, setInternalError] = useState<string | null>(null);

  // Use infinite scroll for pagination when virtual scrolling is enabled
  const infiniteScroll = useInfiniteScroll<Task>({ initialPageSize: pageSize });

  // Determine if we should use virtual scrolling
  const shouldUseVirtualScrolling = useMemo(() => {
    const taskCount = externalTasks?.length || internalTasks.length || infiniteScroll.items.length;
    return enableVirtualScrolling && taskCount >= virtualScrollThreshold;
  }, [enableVirtualScrolling, virtualScrollThreshold, externalTasks?.length, internalTasks.length, infiniteScroll.items.length]);

  // Fetch function for infinite scroll
  const fetchTasks = useCallback(async (page: number, pageSize: number) => {
    if (!listId) return { data: [], hasMore: false };

    const endMeasure = performanceMonitor.startMeasure('database-query');
    
    try {
      const result = await taskService.getTasksByListId(
        listId,
        filters,
        sort,
        { page, pageSize }
      );

      endMeasure();

      if (result.error) {
        return { data: [], hasMore: false, error: result.error.message };
      }

      return {
        data: result.data || [],
        hasMore: result.hasMore || false,
      };
    } catch (error) {
      endMeasure();
      return {
        data: [],
        hasMore: false,
        error: error instanceof Error ? error.message : 'Failed to fetch tasks',
      };
    }
  }, [listId, filters, sort]);

  // Load more items for infinite scroll
  const loadNextPage = useCallback(async () => {
    if (!shouldUseVirtualScrolling || !listId) return;
    await infiniteScroll.loadMore(fetchTasks);
  }, [shouldUseVirtualScrolling, listId, infiniteScroll, fetchTasks]);

  // Refresh data when filters or sort change
  useEffect(() => {
    if (shouldUseVirtualScrolling && listId) {
      infiniteScroll.refresh(fetchTasks);
    }
  }, [shouldUseVirtualScrolling, listId, filters, sort, infiniteScroll, fetchTasks]);

  // Fetch tasks when not using external tasks and not using virtual scrolling
  useEffect(() => {
    if (externalTasks || shouldUseVirtualScrolling || !listId) return;

    const fetchInternalTasks = async () => {
      setInternalLoading(true);
      setInternalError(null);

      const endMeasure = performanceMonitor.startMeasure('database-query');
      
      try {
        const result = await taskService.getTasksByListId(listId, filters, sort);
        
        endMeasure();

        if (result.error) {
          setInternalError(result.error.message);
        } else {
          setInternalTasks(result.data || []);
        }
      } catch (error) {
        endMeasure();
        setInternalError(error instanceof Error ? error.message : 'Failed to fetch tasks');
      } finally {
        setInternalLoading(false);
      }
    };

    fetchInternalTasks();
  }, [externalTasks, shouldUseVirtualScrolling, listId, filters, sort]);

  // Determine which data to use
  const tasks = useMemo(() => {
    if (externalTasks) return externalTasks;
    if (shouldUseVirtualScrolling) return infiniteScroll.items;
    return internalTasks;
  }, [externalTasks, shouldUseVirtualScrolling, infiniteScroll.items, internalTasks]);

  const loading = useMemo(() => {
    if (externalTasks) return externalLoading;
    if (shouldUseVirtualScrolling) return infiniteScroll.isLoading && infiniteScroll.items.length === 0;
    return internalLoading;
  }, [externalTasks, externalLoading, shouldUseVirtualScrolling, infiniteScroll.isLoading, infiniteScroll.items.length, internalLoading]);

  const error = useMemo(() => {
    if (externalTasks) return externalError;
    if (shouldUseVirtualScrolling) return infiniteScroll.error;
    return internalError;
  }, [externalTasks, externalError, shouldUseVirtualScrolling, infiniteScroll.error, internalError]);

  // Memoize task IDs for bulk operations
  const allTaskIds = useMemo(() => tasks.map(task => task.id), [tasks]);

  // Performance monitoring for render
  const renderStartTime = performance.now();
  
  useEffect(() => {
    const renderTime = performance.now() - renderStartTime;
    performanceMonitor.recordMetric({
      name: 'task-list-render',
      value: renderTime,
      timestamp: Date.now(),
      metadata: {
        taskCount: tasks.length,
        virtualScrolling: shouldUseVirtualScrolling,
      },
    });
  });

  if (shouldUseVirtualScrolling) {
    return (
      <div className={className}>
        {/* Filters and controls */}
        {showFilters && (
          <div className="mb-6">
            <TaskList
              tasks={[]} // Empty tasks to only show filters
              loading={false}
              showFilters={true}
              showQuickFilters={showQuickFilters}
              compactFilters={compactFilters}
              filters={filters}
              sort={sort}
              onFiltersChange={onFiltersChange}
              onSortChange={onSortChange}
              initialFilters={initialFilters}
              initialSort={initialSort}
            />
          </div>
        )}

        {/* Virtual scrolling task list */}
        <VirtualTaskList
          tasks={tasks}
          loading={loading}
          hasNextPage={infiniteScroll.hasNextPage}
          isNextPageLoading={infiniteScroll.isLoading}
          loadNextPage={loadNextPage}
          onToggleComplete={onToggleComplete}
          onEditTask={onEditTask}
          onDeleteTask={onDeleteTask}
          enableBulkSelection={enableBulkSelection}
          allTaskIds={allTaskIds}
          height={600}
          itemHeight={80}
        />

        {error && (
          <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}
      </div>
    );
  }

  // Use regular TaskList for smaller lists
  return (
    <TaskList
      tasks={tasks}
      loading={loading}
      error={error}
      filters={filters}
      sort={sort}
      onFiltersChange={onFiltersChange}
      onSortChange={onSortChange}
      onToggleComplete={onToggleComplete}
      onEditTask={onEditTask}
      onDeleteTask={onDeleteTask}
      className={className}
      emptyMessage={emptyMessage}
      emptyDescription={emptyDescription}
      showFilters={showFilters}
      showQuickFilters={showQuickFilters}
      compactFilters={compactFilters}
      initialFilters={initialFilters}
      initialSort={initialSort}
      enableBulkSelection={enableBulkSelection}
      availableLists={availableLists}
      onBulkComplete={onBulkComplete}
      onBulkUncomplete={onBulkUncomplete}
      onBulkDelete={onBulkDelete}
      onBulkMove={onBulkMove}
      onBulkUpdatePriority={onBulkUpdatePriority}
      onBulkUpdateDueDate={onBulkUpdateDueDate}
    />
  );
}