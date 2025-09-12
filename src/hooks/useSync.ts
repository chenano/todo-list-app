// Hook for managing synchronization with conflict resolution
import { useState, useCallback, useEffect } from 'react';
import { syncManager, type SyncResult, type SyncConflict, type ConflictResolution } from '@/lib/sync-manager';
import { useAuth } from './useAuth';
import { useOfflineStatus } from './useOfflineStatus';

export interface SyncState {
  isLoading: boolean;
  result: SyncResult | null;
  conflicts: SyncConflict[];
  error: string | null;
}

export function useSync() {
  const [syncState, setSyncState] = useState<SyncState>({
    isLoading: false,
    result: null,
    conflicts: [],
    error: null
  });

  const { user } = useAuth();
  const { isOnline } = useOfflineStatus();

  // Perform manual sync
  const performSync = useCallback(async (): Promise<SyncResult | null> => {
    if (!user || !isOnline) {
      return null;
    }

    setSyncState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      result: null
    }));

    try {
      const result = await syncManager.performSync(user.id);
      
      setSyncState(prev => ({
        ...prev,
        isLoading: false,
        result,
        conflicts: result.conflicts,
        error: result.success ? null : 'Sync completed with errors'
      }));

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown sync error';
      
      setSyncState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
        result: null
      }));

      return null;
    }
  }, [user, isOnline]);

  // Resolve conflicts
  const resolveConflicts = useCallback(async (resolutions: ConflictResolution[]): Promise<void> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    setSyncState(prev => ({
      ...prev,
      isLoading: true,
      error: null
    }));

    try {
      // Apply resolutions through sync manager
      for (const resolution of resolutions) {
        const conflict = syncState.conflicts.find(c => c.id === resolution.conflictId);
        if (conflict) {
          // Apply the resolution (this would be implemented in sync manager)
          // For now, we'll just remove the conflict from state
        }
      }

      // Perform another sync to ensure everything is up to date
      await performSync();

      setSyncState(prev => ({
        ...prev,
        conflicts: [],
        isLoading: false
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to resolve conflicts';
      
      setSyncState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));

      throw error;
    }
  }, [user, syncState.conflicts, performSync]);

  // Get sync status
  const getSyncStatus = useCallback(async () => {
    if (!user) {
      return null;
    }

    try {
      return await syncManager.getSyncStatus(user.id);
    } catch (error) {
      console.error('Failed to get sync status:', error);
      return null;
    }
  }, [user]);

  // Clear sync state
  const clearSyncState = useCallback(() => {
    setSyncState({
      isLoading: false,
      result: null,
      conflicts: [],
      error: null
    });
  }, []);

  // Auto-sync when coming online
  useEffect(() => {
    const handleAutoSync = () => {
      if (isOnline && user && !syncState.isLoading) {
        // Small delay to ensure connection is stable
        setTimeout(() => {
          performSync();
        }, 2000);
      }
    };

    window.addEventListener('app-online', handleAutoSync);

    return () => {
      window.removeEventListener('app-online', handleAutoSync);
    };
  }, [isOnline, user, syncState.isLoading, performSync]);

  // Register conflict resolvers
  useEffect(() => {
    // Register default conflict resolvers
    syncManager.registerConflictResolver('list', async (conflict) => {
      // Default: use most recent change
      const useLocal = conflict.localTimestamp > conflict.remoteTimestamp;
      return {
        conflictId: conflict.id,
        resolution: useLocal ? 'local' : 'remote'
      };
    });

    syncManager.registerConflictResolver('task', async (conflict) => {
      // Default: use most recent change
      const useLocal = conflict.localTimestamp > conflict.remoteTimestamp;
      return {
        conflictId: conflict.id,
        resolution: useLocal ? 'local' : 'remote'
      };
    });
  }, []);

  return {
    ...syncState,
    performSync,
    resolveConflicts,
    getSyncStatus,
    clearSyncState,
    canSync: isOnline && !!user && !syncState.isLoading,
    isSyncInProgress: syncManager.isSyncInProgress()
  };
}