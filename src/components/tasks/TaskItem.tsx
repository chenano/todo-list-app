'use client';

import React, { useState, useRef, useMemo, useCallback } from 'react';
import { MoreHorizontal, Edit, Trash2, Calendar, Clock, Check, X } from 'lucide-react';
import { Task } from '@/lib/supabase/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PriorityBadge } from '@/components/ui/priority-select';
import { cn } from '@/lib/utils';
import { format, isToday, isTomorrow, isPast } from 'date-fns';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import { useBulkSelection } from '@/contexts/BulkSelectionContext';
import { TaskShortcuts } from '@/components/keyboard';
import { performanceMonitor } from '@/lib/performance';

interface TaskItemProps {
  task: Task;
  onToggleComplete?: (taskId: string) => void;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  className?: string;
  allTaskIds?: string[]; // For range selection
  enableBulkSelection?: boolean;
  isFocused?: boolean; // For keyboard navigation
  onFocus?: () => void;
}

export const TaskItem = React.memo(function TaskItem({
  task,
  onToggleComplete,
  onEdit,
  onDelete,
  className = '',
  allTaskIds = [],
  enableBulkSelection = false,
  isFocused = false,
  onFocus,
}: TaskItemProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [swipeAction, setSwipeAction] = useState<'complete' | 'delete' | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Bulk selection context (only used if enableBulkSelection is true)
  const bulkSelection = enableBulkSelection ? useBulkSelection() : null;
  const isSelected = bulkSelection?.actions.isTaskSelected(task.id) ?? false;
  const isSelectionMode = bulkSelection?.state.isSelectionMode ?? false;

  const handleToggleComplete = useCallback(async () => {
    if (isToggling || !onToggleComplete) return;
    
    setIsToggling(true);
    const endMeasure = performanceMonitor.startMeasure('task-toggle-complete');
    try {
      await onToggleComplete(task.id);
    } finally {
      endMeasure();
      setIsToggling(false);
    }
  }, [isToggling, onToggleComplete, task.id]);

  const handleSelectionToggle = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!bulkSelection) return;

    // Handle shift+click for range selection
    if (e?.shiftKey && bulkSelection.state.lastSelectedId && allTaskIds.length > 0) {
      bulkSelection.actions.selectRange(
        bulkSelection.state.lastSelectedId,
        task.id,
        allTaskIds
      );
    } else {
      bulkSelection.actions.toggleTask(task.id);
    }
  };

  const handleCheckboxChange = () => {
    handleSelectionToggle();
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Focus this task for keyboard navigation
    if (onFocus) {
      onFocus();
    }
    
    // If in selection mode, clicking the card should toggle selection
    if (isSelectionMode && bulkSelection) {
      e.preventDefault();
      handleSelectionToggle(e);
    }
  };

  const handleKeyboardEdit = () => {
    if (onEdit) {
      onEdit(task);
    }
  };

  const handleKeyboardDelete = () => {
    if (onDelete) {
      onDelete(task.id);
    }
  };

  const handleKeyboardToggle = () => {
    handleToggleComplete();
  };

  const handleLongPress = () => {
    // Long press to enter selection mode and select this task
    if (bulkSelection && !isSelectionMode) {
      bulkSelection.actions.selectTask(task.id);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    if (onEdit) {
      onEdit(task);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    if (onDelete) {
      onDelete(task.id);
    }
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // Swipe gesture handlers
  const handleSwipeComplete = () => {
    if (onToggleComplete && !task.completed) {
      setSwipeAction('complete');
      setTimeout(() => {
        handleToggleComplete();
        setSwipeAction(null);
      }, 300);
    }
  };

  const handleSwipeDelete = () => {
    if (onDelete) {
      setSwipeAction('delete');
      setTimeout(() => {
        onDelete(task.id);
        setSwipeAction(null);
      }, 300);
    }
  };

  const swipeGesture = useSwipeGesture({
    onSwipeRight: handleSwipeComplete,
    onSwipeLeft: handleSwipeDelete,
    threshold: 80,
    preventScroll: true,
  });

  const dueDateInfo = useMemo(() => {
    if (!task.due_date) return null;
    
    const date = new Date(task.due_date);
    
    let formattedDate: string;
    if (isToday(date)) {
      formattedDate = 'Today';
    } else if (isTomorrow(date)) {
      formattedDate = 'Tomorrow';
    } else {
      formattedDate = format(date, 'MMM d, yyyy');
    }
    
    let color: string;
    if (task.completed) {
      color = 'text-muted-foreground';
    } else if (isPast(date) && !isToday(date)) {
      color = 'text-destructive';
    } else if (isToday(date)) {
      color = 'text-orange-600';
    } else if (isTomorrow(date)) {
      color = 'text-yellow-600';
    } else {
      color = 'text-muted-foreground';
    }
    
    return { formattedDate, color };
  }, [task.due_date, task.completed]);

  const createdDate = useMemo(() => {
    return format(new Date(task.created_at), 'MMM d');
  }, [task.created_at]);

  return (
    <div className="relative">
      {/* Keyboard shortcuts for this task when focused */}
      {isFocused && (
        <TaskShortcuts
          taskId={task.id}
          onToggleComplete={handleKeyboardToggle}
          onEdit={handleKeyboardEdit}
          onDelete={handleKeyboardDelete}
        />
      )}
      
      {/* Swipe action indicators */}
      {swipeAction && (
        <div className={cn(
          'absolute inset-0 flex items-center justify-center rounded-lg z-10 transition-all duration-300',
          swipeAction === 'complete' && 'bg-green-500 text-white',
          swipeAction === 'delete' && 'bg-red-500 text-white'
        )}>
          {swipeAction === 'complete' && (
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5" />
              <span className="font-medium">Completed!</span>
            </div>
          )}
          {swipeAction === 'delete' && (
            <div className="flex items-center gap-2">
              <X className="h-5 w-5" />
              <span className="font-medium">Deleted!</span>
            </div>
          )}
        </div>
      )}

      <Card 
        ref={cardRef}
        className={cn(
          'group hover:shadow-sm transition-all duration-200 touch-pan-y',
          task.completed && 'opacity-75',
          swipeAction && 'scale-95 opacity-50',
          isSelected && 'ring-2 ring-primary bg-primary/5',
          isSelectionMode && 'cursor-pointer',
          isFocused && 'ring-2 ring-blue-500 bg-blue-50/50',
          className
        )}
        {...swipeGesture}
        onClick={handleCardClick}
        tabIndex={isFocused ? 0 : -1}
      >
        <CardContent className="p-4 md:p-3">
        <div className="flex items-start gap-3">
          {/* Selection Checkbox (shown in selection mode) */}
          {enableBulkSelection && isSelectionMode && (
            <div className="flex-shrink-0 mt-0.5">
              <Checkbox
                checked={isSelected}
                onCheckedChange={handleCheckboxChange}
                className="h-5 w-5 md:h-4 md:w-4"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}

          {/* Task Completion Checkbox (hidden in selection mode) */}
          {(!isSelectionMode || !enableBulkSelection) && (
            <div className="flex-shrink-0 mt-0.5">
              <Checkbox
                checked={task.completed}
                onCheckedChange={handleToggleComplete}
                disabled={isToggling}
                className={cn(
                  'transition-all duration-200 h-5 w-5 md:h-4 md:w-4',
                  task.completed && 'data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600'
                )}
              />
            </div>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h4 className={cn(
                  'font-medium text-sm leading-5 break-words',
                  task.completed && 'line-through text-muted-foreground'
                )}>
                  {task.title}
                </h4>
                
                {task.description && (
                  <p className={cn(
                    'text-sm text-muted-foreground mt-1 break-words',
                    task.completed && 'line-through'
                  )}>
                    {task.description}
                  </p>
                )}

                {/* Metadata */}
                <div className="flex items-center gap-3 mt-2">
                  {/* Priority */}
                  <PriorityBadge 
                    priority={task.priority} 
                    className={cn(
                      'text-xs',
                      task.completed && 'opacity-60'
                    )}
                  />

                  {/* Due Date */}
                  {dueDateInfo && (
                    <div className={cn(
                      'flex items-center gap-1 text-xs',
                      dueDateInfo.color
                    )}>
                      <Calendar className="h-3 w-3" />
                      <span>{dueDateInfo.formattedDate}</span>
                    </div>
                  )}

                  {/* Created time */}
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{createdDate}</span>
                  </div>
                </div>
              </div>

              {/* Actions Menu */}
              {(onEdit || onDelete) && (
                <div className="flex-shrink-0">
                  <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-9 w-9 p-0 opacity-0 group-hover:opacity-100 transition-opacity touch:opacity-100 md:h-8 md:w-8"
                        onClick={handleMenuClick}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      {onEdit && (
                        <DropdownMenuItem onClick={handleEdit} className="py-3 md:py-2">
                          <Edit className="mr-2 h-4 w-4" />
                          Edit task
                        </DropdownMenuItem>
                      )}
                      {onDelete && (
                        <DropdownMenuItem 
                          onClick={handleDelete}
                          className="text-destructive focus:text-destructive py-3 md:py-2"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete task
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
    </div>
  );
});

export default TaskItem;