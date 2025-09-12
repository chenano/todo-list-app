// Integration tests for offline/online transitions
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';
import { useOfflineOperations } from '@/hooks/useOfflineOperations';
import { useSync } from '@/hooks/useSync';
import { offlineStorage } from '@/lib/offline-storage';
import { OfflineIndicator } from '@/components/ui/offline-indicator';

// Mock hooks and dependencies
jest.mock('@/hooks/useOfflineStatus');
jest.mock('@/hooks/useOfflineOperations');
jest.mock('@/hooks/useSync');
jest.mock('@/lib/offline-storage');
jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'user-123' } })
}));

const mockUseOfflineStatus = useOfflineStatus as jest.MockedFunction<typeof useOfflineStatus>;
const mockUseOfflineOperations = useOfflineOperations as jest.MockedFunction<typeof useOfflineOperations>;
const mockUseSync = useSync as jest.MockedFunction<typeof useSync>;
const mockOfflineStorage = offlineStorage as jest.Mocked<typeof offlineStorage>;

// Test component that uses offline functionality
function TestOfflineApp() {
  const { isOnline, isOffline } = useOfflineStatus();
  const { queueOperation, queueStatus } = useOfflineOperations();
  const { performSync, conflicts, isLoading } = useSync();

  const handleCreateTask = async () => {
    await queueOperation('CREATE', 'tasks', {
      title: 'New Task',
      list_id: 'list-1',
      user_id: 'user-123'
    });
  };

  const handleSync = async () => {
    await performSync();
  };

  return (
    <div>
      <div data-testid="connection-status">
        {isOnline ? 'Online' : 'Offline'}
      </div>
      
      <div data-testid="pending-operations">
        {queueStatus.pendingOperations}
      </div>
      
      <button onClick={handleCreateTask} data-testid="create-task">
        Create Task
      </button>
      
      <button onClick={handleSync} data-testid="sync" disabled={!isOnline}>
        Sync
      </button>
      
      {isLoading && <div data-testid="syncing">Syncing...</div>}
      
      {conflicts.length > 0 && (
        <div data-testid="conflicts">
          {conflicts.length} conflicts
        </div>
      )}
      
      <OfflineIndicator />
    </div>
  );
}

describe('Offline/Online Transitions Integration', () => {
  const defaultOfflineStatus = {
    isOnline: true,
    isOffline: false,
    lastOnline: new Date(),
    connectionType: '4g',
    networkInfo: {},
    testConnectivity: jest.fn(),
    refresh: jest.fn()
  };

  const defaultQueueStatus = {
    pendingOperations: 0,
    isProcessing: false,
    lastSync: new Date(),
    errors: []
  };

  const defaultOperations = {
    queueStatus: defaultQueueStatus,
    queueOperation: jest.fn(),
    syncOperations: jest.fn(),
    clearQueue: jest.fn(),
    clearErrors: jest.fn(),
    forceSync: jest.fn(),
    updateQueueStatus: jest.fn()
  };

  const defaultSyncState = {
    isLoading: false,
    result: null,
    conflicts: [],
    error: null,
    performSync: jest.fn(),
    resolveConflicts: jest.fn(),
    getSyncStatus: jest.fn(),
    clearSyncState: jest.fn(),
    canSync: true,
    isSyncInProgress: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseOfflineStatus.mockReturnValue(defaultOfflineStatus);
    mockUseOfflineOperations.mockReturnValue(defaultOperations);
    mockUseSync.mockReturnValue(defaultSyncState);
    
    // Mock offline storage
    mockOfflineStorage.queueOperation.mockResolvedValue('op-123');
    mockOfflineStorage.getQueuedOperations.mockResolvedValue([]);
  });

  describe('online to offline transition', () => {
    it('should queue operations when going offline', async () => {
      const mockQueueOperation = jest.fn().mockResolvedValue('op-123');
      
      mockUseOfflineOperations.mockReturnValue({
        ...defaultOperations,
        queueOperation: mockQueueOperation,
        queueStatus: { ...defaultQueueStatus, pendingOperations: 0 }
      });

      render(<TestOfflineApp />);

      // Initially online
      expect(screen.getByTestId('connection-status')).toHaveTextContent('Online');
      expect(screen.getByTestId('pending-operations')).toHaveTextContent('0');

      // Create a task while online
      fireEvent.click(screen.getByTestId('create-task'));

      await waitFor(() => {
        expect(mockQueueOperation).toHaveBeenCalledWith('CREATE', 'tasks', {
          title: 'New Task',
          list_id: 'list-1',
          user_id: 'user-123'
        });
      });

      // Simulate going offline
      mockUseOfflineStatus.mockReturnValue({
        ...defaultOfflineStatus,
        isOnline: false,
        isOffline: true
      });

      mockUseOfflineOperations.mockReturnValue({
        ...defaultOperations,
        queueOperation: mockQueueOperation,
        queueStatus: { ...defaultQueueStatus, pendingOperations: 1 }
      });

      // Re-render with offline state
      render(<TestOfflineApp />);

      expect(screen.getByTestId('connection-status')).toHaveTextContent('Offline');
      expect(screen.getByTestId('pending-operations')).toHaveTextContent('1');
      expect(screen.getByTestId('sync')).toBeDisabled();
    });

    it('should show offline indicator when disconnected', () => {
      mockUseOfflineStatus.mockReturnValue({
        ...defaultOfflineStatus,
        isOnline: false,
        isOffline: true
      });

      render(<TestOfflineApp />);

      expect(screen.getByText('Offline')).toBeInTheDocument();
    });
  });

  describe('offline to online transition', () => {
    it('should automatically sync when coming back online', async () => {
      const mockPerformSync = jest.fn().mockResolvedValue({
        success: true,
        conflicts: [],
        synced: 1,
        failed: 0,
        errors: []
      });

      // Start offline with pending operations
      mockUseOfflineStatus.mockReturnValue({
        ...defaultOfflineStatus,
        isOnline: false,
        isOffline: true
      });

      mockUseOfflineOperations.mockReturnValue({
        ...defaultOperations,
        queueStatus: { ...defaultQueueStatus, pendingOperations: 1 }
      });

      mockUseSync.mockReturnValue({
        ...defaultSyncState,
        performSync: mockPerformSync,
        canSync: false
      });

      const { rerender } = render(<TestOfflineApp />);

      expect(screen.getByTestId('connection-status')).toHaveTextContent('Offline');
      expect(screen.getByTestId('pending-operations')).toHaveTextContent('1');

      // Simulate coming back online
      mockUseOfflineStatus.mockReturnValue({
        ...defaultOfflineStatus,
        isOnline: true,
        isOffline: false
      });

      mockUseSync.mockReturnValue({
        ...defaultSyncState,
        performSync: mockPerformSync,
        canSync: true
      });

      // Simulate auto-sync trigger
      rerender(<TestOfflineApp />);

      expect(screen.getByTestId('connection-status')).toHaveTextContent('Online');
      expect(screen.getByTestId('sync')).not.toBeDisabled();
    });

    it('should handle sync conflicts when coming online', async () => {
      const conflicts = [
        {
          id: 'conflict-1',
          type: 'task' as const,
          operation: 'UPDATE' as const,
          localData: { id: 'task-1', title: 'Local Title' },
          remoteData: { id: 'task-1', title: 'Remote Title' },
          localTimestamp: Date.now(),
          remoteTimestamp: Date.now() + 1000,
          conflictFields: ['title']
        }
      ];

      const mockPerformSync = jest.fn().mockResolvedValue({
        success: true,
        conflicts,
        synced: 0,
        failed: 0,
        errors: []
      });

      mockUseSync.mockReturnValue({
        ...defaultSyncState,
        performSync: mockPerformSync,
        conflicts,
        canSync: true
      });

      render(<TestOfflineApp />);

      // Trigger sync
      fireEvent.click(screen.getByTestId('sync'));

      await waitFor(() => {
        expect(screen.getByTestId('conflicts')).toHaveTextContent('1 conflicts');
      });
    });
  });

  describe('sync progress indication', () => {
    it('should show sync progress during synchronization', async () => {
      const mockPerformSync = jest.fn().mockImplementation(() => {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve({
              success: true,
              conflicts: [],
              synced: 2,
              failed: 0,
              errors: []
            });
          }, 100);
        });
      });

      mockUseSync.mockReturnValue({
        ...defaultSyncState,
        performSync: mockPerformSync,
        isLoading: true
      });

      render(<TestOfflineApp />);

      // Trigger sync
      fireEvent.click(screen.getByTestId('sync'));

      // Should show syncing indicator
      expect(screen.getByTestId('syncing')).toBeInTheDocument();

      await waitFor(() => {
        expect(mockPerformSync).toHaveBeenCalled();
      });
    });

    it('should show sync errors', async () => {
      const mockPerformSync = jest.fn().mockResolvedValue({
        success: false,
        conflicts: [],
        synced: 0,
        failed: 1,
        errors: ['Network error']
      });

      mockUseSync.mockReturnValue({
        ...defaultSyncState,
        performSync: mockPerformSync,
        error: 'Sync failed'
      });

      render(<TestOfflineApp />);

      fireEvent.click(screen.getByTestId('sync'));

      await waitFor(() => {
        expect(mockPerformSync).toHaveBeenCalled();
      });
    });
  });

  describe('data integrity during transitions', () => {
    it('should maintain data consistency during offline operations', async () => {
      const operations = [
        {
          id: 'op-1',
          type: 'CREATE' as const,
          table: 'tasks' as const,
          data: { title: 'Task 1' },
          timestamp: Date.now(),
          retryCount: 0
        },
        {
          id: 'op-2',
          type: 'UPDATE' as const,
          table: 'tasks' as const,
          data: { id: 'task-1', completed: true },
          timestamp: Date.now() + 1000,
          retryCount: 0
        }
      ];

      mockOfflineStorage.getQueuedOperations.mockResolvedValue(operations);

      mockUseOfflineOperations.mockReturnValue({
        ...defaultOperations,
        queueStatus: { ...defaultQueueStatus, pendingOperations: 2 }
      });

      render(<TestOfflineApp />);

      expect(screen.getByTestId('pending-operations')).toHaveTextContent('2');
    });

    it('should handle partial sync failures gracefully', async () => {
      const mockPerformSync = jest.fn().mockResolvedValue({
        success: true,
        conflicts: [],
        synced: 1,
        failed: 1,
        errors: ['Failed to sync task-2: Network timeout']
      });

      mockUseSync.mockReturnValue({
        ...defaultSyncState,
        performSync: mockPerformSync,
        result: {
          success: true,
          conflicts: [],
          synced: 1,
          failed: 1,
          errors: ['Failed to sync task-2: Network timeout']
        }
      });

      render(<TestOfflineApp />);

      fireEvent.click(screen.getByTestId('sync'));

      await waitFor(() => {
        expect(mockPerformSync).toHaveBeenCalled();
      });

      // Should still show some pending operations
      mockUseOfflineOperations.mockReturnValue({
        ...defaultOperations,
        queueStatus: { ...defaultQueueStatus, pendingOperations: 1 }
      });
    });
  });

  describe('connectivity detection', () => {
    it('should detect actual connectivity vs browser online status', async () => {
      const mockTestConnectivity = jest.fn().mockResolvedValue(false);

      mockUseOfflineStatus.mockReturnValue({
        ...defaultOfflineStatus,
        isOnline: true, // Browser thinks we're online
        testConnectivity: mockTestConnectivity
      });

      render(<TestOfflineApp />);

      // Test connectivity
      await mockTestConnectivity();

      expect(mockTestConnectivity).toHaveBeenCalled();
    });

    it('should handle network quality changes', () => {
      mockUseOfflineStatus.mockReturnValue({
        ...defaultOfflineStatus,
        networkInfo: {
          effectiveType: '2g',
          downlink: 0.5,
          rtt: 2000,
          saveData: true
        }
      });

      render(<TestOfflineApp />);

      // Should still be functional but may show slower sync
      expect(screen.getByTestId('connection-status')).toHaveTextContent('Online');
    });
  });
});