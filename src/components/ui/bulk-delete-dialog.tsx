'use client';

import { useState } from 'react';
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
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BulkDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskCount: number;
  onConfirm: () => Promise<void>;
  isProcessing?: boolean;
  className?: string;
}

export function BulkDeleteDialog({
  open,
  onOpenChange,
  taskCount,
  onConfirm,
  isProcessing = false,
  className,
}: BulkDeleteDialogProps) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');

  const handleConfirm = async () => {
    setStatus('processing');
    setProgress(0);

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      await onConfirm();

      clearInterval(progressInterval);
      setProgress(100);
      setStatus('success');

      // Close dialog after showing success
      setTimeout(() => {
        onOpenChange(false);
        setStatus('idle');
        setProgress(0);
      }, 1500);
    } catch (error) {
      setStatus('error');
      setProgress(0);
    }
  };

  const handleCancel = () => {
    if (!isProcessing) {
      onOpenChange(false);
      setStatus('idle');
      setProgress(0);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className={cn('sm:max-w-md', className)}>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {status === 'processing' && (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
            )}
            {status === 'success' && <CheckCircle className="h-4 w-4 text-green-600" />}
            {status === 'error' && <XCircle className="h-4 w-4 text-red-600" />}
            {status === 'idle' && <AlertTriangle className="h-4 w-4 text-orange-600" />}
            
            {status === 'idle' && 'Delete Tasks'}
            {status === 'processing' && 'Deleting Tasks...'}
            {status === 'success' && 'Tasks Deleted'}
            {status === 'error' && 'Delete Failed'}
          </AlertDialogTitle>
          
          <AlertDialogDescription>
            {status === 'idle' && (
              <>
                Are you sure you want to delete {taskCount} {taskCount === 1 ? 'task' : 'tasks'}? 
                This action cannot be undone.
              </>
            )}
            {status === 'processing' && (
              <>
                Deleting {taskCount} {taskCount === 1 ? 'task' : 'tasks'}...
                <div className="mt-3 space-y-2">
                  <Progress value={progress} className="h-2" />
                  <div className="text-xs text-muted-foreground text-center">
                    {Math.round(progress)}% complete
                  </div>
                </div>
              </>
            )}
            {status === 'success' && (
              <>
                Successfully deleted {taskCount} {taskCount === 1 ? 'task' : 'tasks'}.
              </>
            )}
            {status === 'error' && (
              <>
                Failed to delete some tasks. Please try again.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <AlertDialogFooter>
          {status === 'idle' && (
            <>
              <AlertDialogCancel onClick={handleCancel}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirm}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete {taskCount === 1 ? 'Task' : 'Tasks'}
              </AlertDialogAction>
            </>
          )}
          
          {status === 'processing' && (
            <Button variant="outline" disabled className="w-full">
              Deleting...
            </Button>
          )}
          
          {status === 'error' && (
            <>
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleConfirm} variant="destructive">
                Try Again
              </Button>
            </>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default BulkDeleteDialog;