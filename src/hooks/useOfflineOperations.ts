// Hook for managing offline operations queue
import { useState, useEffect, useCallback, useRef } from 'react';
import { offlineStorage, type OfflineOperation } from '@/lib/offline-storage';
import { useOfflineStatus } from './useOfflineStatus';
import { useAuth } from './useAuth';
import { createClient } from '@/lib/supabase/client';
import type { List, Task } from '@/types';

export interface OperationQueueStatus {
  pendingOperations: number;
  isProcessing: boolean;
  lastSync: Date | null;
  errors: string[];
}

export function useOfflineOperations() {
  const [queueStatus, setQueueStatus] = useState<OperationQueueStatus>({
    pendingOperations: 0,
    isProcessing: false,
    lastSync: null,
    errors: []
  });

  const { isOnline } = useOfflineStatus();
  const { user } = useAuth();
  const supabase = createClient();
  const syncInProgress = useRef(false);
  const retryTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Queue an operation for offline sync
  const queueOperation = useCallback(async (
    type: OfflineOperation['type'],
    table: OfflineOperation['table'],
    data: any,
    originalId?: string
  ): Promise<string> => {
    try {
      const operationId = await offlineStorage.queueOperation({
        type,
        table,
        data,
        originalId
      });

      // Update queue status
      await updateQueueStatus();

      // If online, try to sync immediately
      if (isOnline && !syncInProgress.current) {
        syncOperations();
      }

      return operationId;
    } catch (error) {
      console.error('Failed to queue operation:', error);
      throw error;
    }
  }, [isOnline]);

  // Update queue status
  const updateQueueStatus = useCallback(async () => {
    try {
      const operations = await offlineStorage.getQueuedOperations();
      const lastSyncTime = await offlineStorage.getMetadata('lastSync');
      
      setQueueStatus(prev => ({
        ...prev,
        pendingOperations: operations.length,
        lastSync: lastSyncTime ? new Date(lastSyncTime) : null,
        errors: operations
          .filter(op => op.error)
          .map(op => `${op.type} ${op.table}: ${op.error}`)
          .slice(0, 5) // Show only last 5 errors
      }));
    } catch (error) {
      console.error('Failed to update queue status:', error);
    }
  }, []);

  // Sync all queued operations
  const syncOperations = useCallback(async (): Promise<void> => {
    if (syncInProgress.current || !isOnline || !user) {
      return;
    }

    syncInProgress.current = true;
    setQueueStatus(prev => ({ ...prev, isProcessing: true, errors: [] }));

    try {
      const operations = await offlineStorage.getQueuedOperations();
      const errors: string[] = [];

      for (const operation of operations) {
        try {
          await processOperation(operation);
          await offlineStorage.removeOperation(operation.id);
        } catch (error) {
          console.error(`Failed to sync operation ${operation.id}:`, error);
          
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`${operation.type} ${operation.table}: ${errorMessage}`);

          // Update retry count
          await offlineStorage.updateOperationRetry(operation.id, errorMessage);

          // Schedule retry with exponential backoff
          const retryDelay = Math.min(1000 * Math.pow(2, operation.retryCount), 30000);
          const timeoutId = setTimeout(() => {
            retryTimeouts.current.delete(operation.id);
            if (isOnline) {
              syncOperations();
            }
          }, retryDelay);

          retryTimeouts.current.set(operation.id, timeoutId);

          // Remove operations that have failed too many times
          if (operation.retryCount >= 5) {
            await offlineStorage.removeOperation(operation.id);
            console.warn(`Removing operation ${operation.id} after 5 failed attempts`);
          }
        }
      }

      // Update last sync time
      await offlineStorage.setMetadata('lastSync', Date.now());

      setQueueStatus(prev => ({
        ...prev,
        errors: errors.slice(0, 5),
        lastSync: new Date()
      }));

    } catch (error) {
      console.error('Failed to sync operations:', error);
      setQueueStatus(prev => ({
        ...prev,
        errors: [...prev.errors, 'Sync failed: ' + (error instanceof Error ? error.message : 'Unknown error')]
      }));
    } finally {
      syncInProgress.current = false;
      setQueueStatus(prev => ({ ...prev, isProcessing: false }));
      await updateQueueStatus();
    }
  }, [isOnline, user]);

  // Process a single operation
  const processOperation = async (operation: OfflineOperation): Promise<void> => {
    const { type, table, data, originalId } = operation;

    switch (table) {
      case 'lists':
        await processListOperation(type, data, originalId);
        break;
      case 'tasks':
        await processTaskOperation(type, data, originalId);
        break;
      default:
        throw new Error(`Unknown table: ${table}`);
    }
  };

  // Process list operations
  const processListOperation = async (
    type: OfflineOperation['type'],
    data: Partial<List>,
    originalId?: string
  ): Promise<void> => {
    switch (type) {
      case 'CREATE': {
        const { error } = await supabase
          .from('lists')
          .insert([{
            name: data.name!,
            description: data.description,
            user_id: user!.id
          }]);
        
        if (error) throw error;
        break;
      }
      case 'UPDATE': {
        const { error } = await supabase
          .from('lists')
          .update({
            name: data.name,
            description: data.description
          })
          .eq('id', originalId || data.id);
        
        if (error) throw error;
        break;
      }
      case 'DELETE': {
        const { error } = await supabase
          .from('lists')
          .delete()
          .eq('id', originalId || data.id);
        
        if (error) throw error;
        break;
      }
    }
  };

  // Process task operations
  const processTaskOperation = async (
    type: OfflineOperation['type'],
    data: Partial<Task>,
    originalId?: string
  ): Promise<void> => {
    switch (type) {
      case 'CREATE': {
        const { error } = await supabase
          .from('tasks')
          .insert([{
            title: data.title!,
            description: data.description,
            completed: data.completed || false,
            priority: data.priority || 'medium',
            due_date: data.due_date,
            list_id: data.list_id!,
            user_id: user!.id
          }]);
        
        if (error) throw error;
        break;
      }
      case 'UPDATE': {
        const updateData: any = {};
        if (data.title !== undefined) updateData.title = data.title;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.completed !== undefined) updateData.completed = data.completed;
        if (data.priority !== undefined) updateData.priority = data.priority;
        if (data.due_date !== undefined) updateData.due_date = data.due_date;
        if (data.list_id !== undefined) updateData.list_id = data.list_id;

        const { error } = await supabase
          .from('tasks')
          .update(updateData)
          .eq('id', originalId || data.id);
        
        if (error) throw error;
        break;
      }
      case 'DELETE': {
        const { error } = await supabase
          .from('tasks')
          .delete()
          .eq('id', originalId || data.id);
        
        if (error) throw error;
        break;
      }
    }
  };

  // Clear all queued operations
  const clearQueue = useCallback(async (): Promise<void> => {
    try {
      const operations = await offlineStorage.getQueuedOperations();
      for (const operation of operations) {
        await offlineStorage.removeOperation(operation.id);
      }
      await updateQueueStatus();
    } catch (error) {
      console.error('Failed to clear operation queue:', error);
    }
  }, [updateQueueStatus]);

  // Clear errors
  const clearErrors = useCallback(() => {
    setQueueStatus(prev => ({ ...prev, errors: [] }));
  }, []);

  // Force sync
  const forceSync = useCallback(async (): Promise<void> => {
    if (isOnline) {
      await syncOperations();
    }
  }, [isOnline, syncOperations]);

  // Listen for service worker messages
  useEffect(() => {
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      const { type, operation } = event.data;

      switch (type) {
        case 'QUEUE_OFFLINE_OPERATION':
          // Operation was queued by service worker
          updateQueueStatus();
          break;
        case 'SYNC_OFFLINE_OPERATIONS':
          // Service worker requests sync
          if (isOnline) {
            syncOperations();
          }
          break;
      }
    };

    navigator.serviceWorker?.addEventListener('message', handleServiceWorkerMessage);

    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleServiceWorkerMessage);
    };
  }, [isOnline, syncOperations, updateQueueStatus]);

  // Auto-sync when coming online
  useEffect(() => {
    const handleOnline = () => {
      if (!syncInProgress.current) {
        syncOperations();
      }
    };

    window.addEventListener('app-online', handleOnline);

    return () => {
      window.removeEventListener('app-online', handleOnline);
    };
  }, [syncOperations]);

  // Initial queue status update
  useEffect(() => {
    updateQueueStatus();
  }, [updateQueueStatus]);

  // Cleanup retry timeouts
  useEffect(() => {
    return () => {
      retryTimeouts.current.forEach(timeout => clearTimeout(timeout));
      retryTimeouts.current.clear();
    };
  }, []);

  return {
    queueStatus,
    queueOperation,
    syncOperations,
    clearQueue,
    clearErrors,
    forceSync,
    updateQueueStatus
  };
}