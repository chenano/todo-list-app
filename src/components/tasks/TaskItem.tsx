'use client';

import { useState } from 'react';
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

interface TaskItemProps {
  task: Task;
  onToggleComplete?: (taskId: string) => void;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  className?: string;
}

export function TaskItem({
  task,
  onToggleComplete,
  onEdit,
  onDelete,
  className = '',
}: TaskItemProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [swipeAction, setSwipeAction] = useState<'complete' | 'delete' | null>(null);

  const handleToggleComplete = async () => {
    if (isToggling || !onToggleComplete) return;
    
    setIsToggling(true);
    try {
      await onToggleComplete(task.id);
    } finally {
      setIsToggling(false);
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

  const formatDueDate = (dateString: string) => {
    const date = new Date(dateString);
    
    if (isToday(date)) {
      return 'Today';
    } else if (isTomorrow(date)) {
      return 'Tomorrow';
    } else {
      return format(date, 'MMM d, yyyy');
    }
  };

  const getDueDateColor = (dateString: string) => {
    if (task.completed) return 'text-muted-foreground';
    
    const date = new Date(dateString);
    
    if (isPast(date) && !isToday(date)) {
      return 'text-destructive';
    } else if (isToday(date)) {
      return 'text-orange-600';
    } else if (isTomorrow(date)) {
      return 'text-yellow-600';
    }
    
    return 'text-muted-foreground';
  };

  return (
    <div className="relative">
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
        className={cn(
          'group hover:shadow-sm transition-all duration-200 touch-pan-y',
          task.completed && 'opacity-75',
          swipeAction && 'scale-95 opacity-50',
          className
        )}
        {...swipeGesture}
      >
        <CardContent className="p-4 md:p-3">
        <div className="flex items-start gap-3">
          {/* Checkbox */}
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
                  {task.due_date && (
                    <div className={cn(
                      'flex items-center gap-1 text-xs',
                      getDueDateColor(task.due_date)
                    )}>
                      <Calendar className="h-3 w-3" />
                      <span>{formatDueDate(task.due_date)}</span>
                    </div>
                  )}

                  {/* Created time */}
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>
                      {format(new Date(task.created_at), 'MMM d')}
                    </span>
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
}

export default TaskItem;