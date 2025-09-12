// Background sync utilities for offline operations
import { useCallback, useEffect } from 'react';

export class BackgroundSync {
  private static instance: BackgroundSync;
  private syncInProgress = false;
  private syncCallbacks: Set<() => Promise<void>> = new Set();

  static getInstance(): BackgroundSync {
    if (!BackgroundSync.instance) {
      BackgroundSync.instance = new BackgroundSync();
    }
    return BackgroundSync.instance;
  }

  // Register a sync callback
  registerSyncCallback(callback: () => Promise<void>): () => void {
    this.syncCallbacks.add(callback);
    
    // Return unregister function
    return () => {
      this.syncCallbacks.delete(callback);
    };
  }

  // Request background sync
  async requestSync(tag: string = 'sync-offline-operations'): Promise<void> {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await (registration as any).sync.register(tag);
        console.log('Background sync registered:', tag);
      } catch (error) {
        console.error('Failed to register background sync:', error);
        // Fallback to immediate sync if background sync is not available
        this.performSync();
      }
    } else {
      // Background sync not supported, perform immediate sync
      this.performSync();
    }
  }

  // Perform sync operation
  async performSync(): Promise<void> {
    if (this.syncInProgress) {
      return;
    }

    this.syncInProgress = true;

    try {
      // Execute all registered sync callbacks
      const syncPromises = Array.from(this.syncCallbacks).map(callback => 
        callback().catch(error => {
          console.error('Sync callback failed:', error);
          return Promise.resolve(); // Don't let one failure stop others
        })
      );

      await Promise.all(syncPromises);
      console.log('Background sync completed successfully');
    } catch (error) {
      console.error('Background sync failed:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  // Check if sync is in progress
  isSyncInProgress(): boolean {
    return this.syncInProgress;
  }

  // Setup periodic sync fallback for browsers without background sync
  setupPeriodicSync(intervalMs: number = 30000): () => void {
    const interval = setInterval(() => {
      if (navigator.onLine && !this.syncInProgress) {
        this.performSync();
      }
    }, intervalMs);

    return () => clearInterval(interval);
  }

  // Setup visibility change sync
  setupVisibilitySync(): () => void {
    const handleVisibilityChange = () => {
      if (!document.hidden && navigator.onLine && !this.syncInProgress) {
        this.performSync();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }

  // Setup online event sync
  setupOnlineSync(): () => void {
    const handleOnline = () => {
      if (!this.syncInProgress) {
        // Small delay to ensure connection is stable
        setTimeout(() => this.performSync(), 1000);
      }
    };

    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }

  // Setup all sync triggers
  setupAllSyncTriggers(): () => void {
    const cleanupFunctions = [
      this.setupPeriodicSync(),
      this.setupVisibilitySync(),
      this.setupOnlineSync()
    ];

    return () => {
      cleanupFunctions.forEach(cleanup => cleanup());
    };
  }
}

// Hook for using background sync
export function useBackgroundSync() {
  const backgroundSync = BackgroundSync.getInstance();

  const registerSyncCallback = useCallback((callback: () => Promise<void>) => {
    return backgroundSync.registerSyncCallback(callback);
  }, [backgroundSync]);

  const requestSync = useCallback(async (tag?: string) => {
    await backgroundSync.requestSync(tag);
  }, [backgroundSync]);

  const performSync = useCallback(async () => {
    await backgroundSync.performSync();
  }, [backgroundSync]);

  const isSyncInProgress = useCallback(() => {
    return backgroundSync.isSyncInProgress();
  }, [backgroundSync]);

  // Setup sync triggers on mount
  useEffect(() => {
    const cleanup = backgroundSync.setupAllSyncTriggers();
    return cleanup;
  }, [backgroundSync]);

  return {
    registerSyncCallback,
    requestSync,
    performSync,
    isSyncInProgress
  };
}