'use client';

import { useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { List } from '@/lib/supabase/types';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';

interface DeleteListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  list: (List & { task_count: number }) | null;
  onConfirm: (listId: string) => Promise<void>;
  isLoading?: boolean;
}

export function DeleteListDialog({
  open,
  onOpenChange,
  list,
  onConfirm,
  isLoading = false,
}: DeleteListDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    if (!list || isDeleting || isLoading) return;

    try {
      setIsDeleting(true);
      await onConfirm(list.id);
      onOpenChange(false);
    } catch (error) {
      console.error('Error deleting list:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    if (isDeleting || isLoading) return;
    onOpenChange(false);
  };

  if (!list) return null;

  const hasWarning = list.task_count > 0;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete List
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              Are you sure you want to delete the list{' '}
              <span className="font-semibold">"{list.name}"</span>?
            </p>
            
            {hasWarning && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <span className="font-medium text-destructive">Warning</span>
                </div>
                <p className="text-sm">
                  This list contains{' '}
                  <Badge variant="destructive" className="mx-1">
                    {list.task_count} {list.task_count === 1 ? 'task' : 'tasks'}
                  </Badge>
                  that will also be permanently deleted.
                </p>
              </div>
            )}
            
            <p className="text-sm font-medium">
              This action cannot be undone.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <AlertDialogFooter>
          <AlertDialogCancel 
            onClick={handleCancel}
            disabled={isDeleting || isLoading}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isDeleting || isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {(isDeleting || isLoading) && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Delete List
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default DeleteListDialog;