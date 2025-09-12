'use client';

import React, { useMemo, useCallback, forwardRef } from 'react';
import { FixedSizeList as List } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';
import { Task } from '@/types';
import { TaskItem } from './TaskItem';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { cn } from '@/lib/utils';

interface VirtualTaskListProps {
  tasks: Task[];
  loading?: boolean;
  hasNextPage?: boolean;
  isNextPageLoading?: boolean;
  loadNextPage?: () => Promise<void>;
  onToggleComplete?: (taskId: string) => void;
  onEditTask?: (task: Task) => void;
  onDeleteTask?: (taskId: string) => void;
  className?: string;
  height?: number;
  itemHeight?: number;
  // Bulk operations
  enableBulkSelection?: boolean;
  allTaskIds?: string[];
}

interface TaskItemRendererProps {
  index: number;
  style: React.CSSProperties;
  data: {
    tasks: Task[];
    onToggleComplete?: (taskId: string) => void;
    onEditTask?: (task: Task) => void;
    onDeleteTask?: (taskId: string) => void;
    enableBulkSelection?: boolean;
    allTaskIds?: string[];
    isItemLoaded: (index: number) => boolean;
  };
}

const TaskItemRenderer = ({ index, style, data }: any) => {
  const {
    tasks,
    onToggleComplete,
    onEditTask,
    onDeleteTask,
    enableBulkSelection,
    allTaskIds,
    isItemLoaded,
  } = data;

  // Show loading placeholder if item is not loaded
  if (!isItemLoaded(index)) {
    return (
      <div style={style} className="flex items-center justify-center p-4">
        <LoadingSpinner size="sm" />
        <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
      </div>
    );
  }

  const task = tasks[index];
  if (!task) {
    return <div style={style} />;
  }

  return (
    <div style={style} className="px-1">
      <TaskItem
        task={task}
        onToggleComplete={onToggleComplete}
        onEdit={onEditTask}
        onDelete={onDeleteTask}
        allTaskIds={allTaskIds}
        enableBulkSelection={enableBulkSelection}
      />
    </div>
  );
};

export const VirtualTaskList = forwardRef<HTMLDivElement, VirtualTaskListProps>(
  (
    {
      tasks,
      loading = false,
      hasNextPage = false,
      isNextPageLoading = false,
      loadNextPage,
      onToggleComplete,
      onEditTask,
      onDeleteTask,
      className,
      height = 600,
      itemHeight = 80,
      enableBulkSelection = false,
      allTaskIds = [],
    },
    ref
  ) => {
    // Calculate total item count including loading items
    const itemCount = hasNextPage ? tasks.length + 1 : tasks.length;

    // Check if an item is loaded
    const isItemLoaded = useCallback(
      (index: number) => {
        return !!tasks[index];
      },
      [tasks]
    );

    // Load more items when needed
    const loadMoreItems = useCallback(
      async (startIndex: number, stopIndex: number) => {
        if (loadNextPage && !isNextPageLoading) {
          await loadNextPage();
        }
      },
      [loadNextPage, isNextPageLoading]
    );

    // Memoize item data to prevent unnecessary re-renders
    const itemData = useMemo(
      () => ({
        tasks,
        onToggleComplete,
        onEditTask,
        onDeleteTask,
        enableBulkSelection,
        allTaskIds,
        isItemLoaded,
      }),
      [
        tasks,
        onToggleComplete,
        onEditTask,
        onDeleteTask,
        enableBulkSelection,
        allTaskIds,
        isItemLoaded,
      ]
    );

    if (loading && tasks.length === 0) {
      return (
        <div className={cn('flex items-center justify-center py-8', className)}>
          <div className="flex items-center gap-2 text-muted-foreground">
            <LoadingSpinner size="sm" />
            <span>Loading tasks...</span>
          </div>
        </div>
      );
    }

    if (tasks.length === 0) {
      return (
        <div className={cn('flex items-center justify-center py-8', className)}>
          <div className="text-center text-muted-foreground">
            <p>No tasks found</p>
          </div>
        </div>
      );
    }

    return (
      <div ref={ref} className={cn('w-full', className)}>
        <InfiniteLoader
          isItemLoaded={isItemLoaded}
          itemCount={itemCount}
          loadMoreItems={loadMoreItems}
        >
          {({ onItemsRendered, ref: infiniteRef }) => (
            <List
              ref={infiniteRef}
              height={height}
              width="100%"
              itemCount={itemCount}
              itemSize={itemHeight}
              itemData={itemData}
              onItemsRendered={onItemsRendered}
              overscanCount={5}
              className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
            >
              {TaskItemRenderer}
            </List>
          )}
        </InfiniteLoader>
      </div>
    );
  }
);

VirtualTaskList.displayName = 'VirtualTaskList';