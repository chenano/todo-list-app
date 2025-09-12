import { useState, useCallback } from 'react';
import { taskService } from '@/lib/tasks';
import { Task, Priority } from '@/lib/supabase/types';
import { DatabaseError } from '@/types';
import { useOptimisticUpdates } from '@/lib/optimistic-updates';

export interface BulkOperationResult {
  success: boolean;
  updatedTasks?: Task[];
  error?: DatabaseError;
  partialSuccess?: boolean;
  successCount?: number;
  failureCount?: number;
}

export interface UseBulkOperationsReturn {
  bulkComplete: (taskIds: string[]) => Promise<BulkOperationResult>;
  bulkUncomplete: (taskIds: string[]) => Promise<BulkOperationResult>;
  bulkDelete: (taskIds: string[]) => Promise<BulkOperationResult>;
  bulkMove: (taskIds: string[], targetListId: string) => Promise<BulkOperationResult>;
  bulkUpdatePriority: (taskIds: string[], priority: Priority) => Promise<BulkOperationResult>;
  bulkUpdateDueDate: (taskIds: string[], dueDate: string | null) => Promise<BulkOperationResult>;
  isProcessing: boolean;
  error: DatabaseError | null;
  clearError: () => void;
}

export function useBulkOperations(): UseBulkOperationsReturn {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<DatabaseError | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const executeOperation = useCallback(async <T>(
    operation: () => Promise<{ data: T | null; error: DatabaseError | null }>,
    taskIds: string[]
  ): Promise<BulkOperationResult> => {
    setIsProcessing(true);
    setError(null);

    try {
      const result = await operation();

      if (result.error) {
        setError(result.error);
        return {
          success: false,
          error: result.error,
          successCount: 0,
          failureCount: taskIds.length,
        };
      }

      return {
        success: true,
        updatedTasks: result.data as Task[],
        successCount: taskIds.length,
        failureCount: 0,
      };
    } catch (err) {
      const error = {
        message: err instanceof Error ? err.message : 'Unknown error occurred',
        code: '500',
      };
      setError(error);
      return {
        success: false,
        error,
        successCount: 0,
        failureCount: taskIds.length,
      };
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const executeDeleteOperation = useCallback(async (
    operation: () => Promise<{ error: DatabaseError | null }>,
    taskIds: string[]
  ): Promise<BulkOperationResult> => {
    setIsProcessing(true);
    setError(null);

    try {
      const result = await operation();

      if (result.error) {
        setError(result.error);
        return {
          success: false,
          error: result.error,
          successCount: 0,
          failureCount: taskIds.length,
        };
      }

      return {
        success: true,
        successCount: taskIds.length,
        failureCount: 0,
      };
    } catch (err) {
      const error = {
        message: err instanceof Error ? err.message : 'Unknown error occurred',
        code: '500',
      };
      setError(error);
      return {
        success: false,
        error,
        successCount: 0,
        failureCount: taskIds.length,
      };
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const bulkComplete = useCallback(async (taskIds: string[]): Promise<BulkOperationResult> => {
    return executeOperation(
      () => taskService.bulkCompleteTask(taskIds),
      taskIds
    );
  }, [executeOperation]);

  const bulkUncomplete = useCallback(async (taskIds: string[]): Promise<BulkOperationResult> => {
    return executeOperation(
      () => taskService.bulkUncompleteTask(taskIds),
      taskIds
    );
  }, [executeOperation]);

  const bulkDelete = useCallback(async (taskIds: string[]): Promise<BulkOperationResult> => {
    return executeDeleteOperation(
      () => taskService.bulkDeleteTasks(taskIds),
      taskIds
    );
  }, [executeDeleteOperation]);

  const bulkMove = useCallback(async (taskIds: string[], targetListId: string): Promise<BulkOperationResult> => {
    return executeOperation(
      () => taskService.bulkMoveTasks(taskIds, targetListId),
      taskIds
    );
  }, [executeOperation]);

  const bulkUpdatePriority = useCallback(async (taskIds: string[], priority: Priority): Promise<BulkOperationResult> => {
    return executeOperation(
      () => taskService.bulkUpdateTaskPriority(taskIds, priority),
      taskIds
    );
  }, [executeOperation]);

  const bulkUpdateDueDate = useCallback(async (taskIds: string[], dueDate: string | null): Promise<BulkOperationResult> => {
    return executeOperation(
      () => taskService.bulkUpdateTaskDueDate(taskIds, dueDate),
      taskIds
    );
  }, [executeOperation]);

  return {
    bulkComplete,
    bulkUncomplete,
    bulkDelete,
    bulkMove,
    bulkUpdatePriority,
    bulkUpdateDueDate,
    isProcessing,
    error,
    clearError,
  };
}