'use client';

import { useState } from 'react';
import { 
  Check, 
  X, 
  Trash2, 
  Move, 
  Calendar, 
  Flag,
  MoreHorizontal,
  CheckCircle,
  Circle,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { BulkDeleteDialog } from '@/components/ui/bulk-delete-dialog';
import { cn } from '@/lib/utils';
import { useBulkSelection } from '@/contexts/BulkSelectionContext';
import { Task, Priority } from '@/lib/supabase/types';

export interface BulkActionBarProps {
  tasks: Task[];
  availableLists?: Array<{ id: string; name: string }>;
  className?: string;
  onSuccess?: () => void; // Callback for successful operations
  onError?: (error: string) => void; // Callback for errors
  // Bulk operation callbacks
  onBulkComplete?: (taskIds: string[]) => Promise<any>;
  onBulkUncomplete?: (taskIds: string[]) => Promise<any>;
  onBulkDelete?: (taskIds: string[]) => Promise<any>;
  onBulkMove?: (taskIds: string[], targetListId: string) => Promise<any>;
  onBulkUpdatePriority?: (taskIds: string[], priority: Priority) => Promise<any>;
  onBulkUpdateDueDate?: (taskIds: string[], dueDate: string | null) => Promise<any>;
}

export function BulkActionBar({
  tasks,
  availableLists = [],
  className,
  onSuccess,
  onError,
  onBulkComplete,
  onBulkUncomplete,
  onBulkDelete,
  onBulkMove,
  onBulkUpdatePriority,
  onBulkUpdateDueDate,
}: BulkActionBarProps) {
  const { state, actions } = useBulkSelection();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const selectedTasks = actions.getSelectedTasks(tasks);
  const selectedCount = actions.getSelectedCount();

  // Don't render if no tasks are selected
  if (!state.isSelectionMode || selectedCount === 0) {
    return null;
  }

  // Calculate stats about selected tasks
  const completedCount = selectedTasks.filter(task => task.completed).length;
  const incompleteCount = selectedTasks.filter(task => !task.completed).length;
  const hasCompleted = completedCount > 0;
  const hasIncomplete = incompleteCount > 0;

  const handleBulkAction = async (action: () => Promise<any>) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    
    try {
      await action();
      actions.deselectAll();
      onSuccess?.();
    } catch (error) {
      console.error('Bulk action failed:', error);
      onError?.(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleComplete = () => {
    if (incompleteCount === 0 || !onBulkComplete) return;
    const incompleteTaskIds = selectedTasks
      .filter(task => !task.completed)
      .map(task => task.id);
    handleBulkAction(() => onBulkComplete(incompleteTaskIds));
  };

  const handleUncomplete = () => {
    if (completedCount === 0 || !onBulkUncomplete) return;
    const completedTaskIds = selectedTasks
      .filter(task => task.completed)
      .map(task => task.id);
    handleBulkAction(() => onBulkUncomplete(completedTaskIds));
  };

  const handleDeleteConfirm = async () => {
    if (!onBulkDelete) return;
    const selectedTaskIds = selectedTasks.map(task => task.id);
    await handleBulkAction(() => onBulkDelete(selectedTaskIds));
    setShowDeleteDialog(false);
  };

  const handleMove = (targetListId: string) => {
    if (!onBulkMove) return;
    const selectedTaskIds = selectedTasks.map(task => task.id);
    handleBulkAction(() => onBulkMove(selectedTaskIds, targetListId));
  };

  const handleUpdatePriority = (priority: Priority) => {
    if (!onBulkUpdatePriority) return;
    const selectedTaskIds = selectedTasks.map(task => task.id);
    handleBulkAction(() => onBulkUpdatePriority(selectedTaskIds, priority));
  };

  const handleUpdateDueDate = (dueDate: string | null) => {
    if (!onBulkUpdateDueDate) return;
    const selectedTaskIds = selectedTasks.map(task => task.id);
    handleBulkAction(() => onBulkUpdateDueDate(selectedTaskIds, dueDate));
  };

  const handleCancel = () => {
    actions.exitSelectionMode();
  };

  return (
    <Card className={cn(
      'fixed bottom-4 left-4 right-4 z-50 shadow-lg border-2 md:left-6 md:right-6',
      'animate-in slide-in-from-bottom-2 duration-200',
      className
    )}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          {/* Selection Info */}
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="font-medium">
              {selectedCount} selected
            </Badge>
            
            {hasCompleted && hasIncomplete && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <span>{completedCount} completed</span>
                <span>•</span>
                <span>{incompleteCount} incomplete</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Quick Actions */}
            <div className="flex items-center gap-1">
              {/* Complete/Uncomplete */}
              {hasIncomplete && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleComplete}
                  disabled={isProcessing}
                  className="h-9 px-3"
                >
                  {isProcessing ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-1" />
                  )}
                  Complete
                  {incompleteCount > 1 && (
                    <Badge variant="secondary" className="ml-1 h-5 text-xs">
                      {incompleteCount}
                    </Badge>
                  )}
                </Button>
              )}

              {hasCompleted && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleUncomplete}
                  disabled={isProcessing}
                  className="h-9 px-3"
                >
                  {isProcessing ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Circle className="h-4 w-4 mr-1" />
                  )}
                  Undo
                  {completedCount > 1 && (
                    <Badge variant="secondary" className="ml-1 h-5 text-xs">
                      {completedCount}
                    </Badge>
                  )}
                </Button>
              )}

              {/* Delete */}
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowDeleteDialog(true)}
                disabled={isProcessing}
                className="h-9 px-3 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </div>

            {/* More Actions Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isProcessing}
                  className="h-9 px-3"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {/* Move to List */}
                {availableLists.length > 0 && (
                  <>
                    <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                      Move to List
                    </div>
                    {availableLists.map((list) => (
                      <DropdownMenuItem
                        key={list.id}
                        onClick={() => handleMove(list.id)}
                        className="pl-4"
                      >
                        <Move className="mr-2 h-4 w-4" />
                        {list.name}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                  </>
                )}

                {/* Update Priority */}
                <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                  Set Priority
                </div>
                <DropdownMenuItem onClick={() => handleUpdatePriority('high')}>
                  <Flag className="mr-2 h-4 w-4 text-red-500" />
                  High Priority
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleUpdatePriority('medium')}>
                  <Flag className="mr-2 h-4 w-4 text-yellow-500" />
                  Medium Priority
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleUpdatePriority('low')}>
                  <Flag className="mr-2 h-4 w-4 text-green-500" />
                  Low Priority
                </DropdownMenuItem>
                <DropdownMenuSeparator />

                {/* Clear Due Date */}
                <DropdownMenuItem onClick={() => handleUpdateDueDate(null)}>
                  <Calendar className="mr-2 h-4 w-4" />
                  Clear Due Date
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Cancel */}
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCancel}
              disabled={isProcessing}
              className="h-9 px-3"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>

      {/* Bulk Delete Confirmation Dialog */}
      <BulkDeleteDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        taskCount={selectedCount}
        onConfirm={handleDeleteConfirm}
        isProcessing={isProcessing}
      />
    </Card>
  );
}

export default BulkActionBar;