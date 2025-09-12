// Tests for sync manager
import { SyncManager } from '../sync-manager';
import { offlineStorage } from '../offline-storage';
import { createClient } from '@/lib/supabase/client';
import type { List, Task } from '@/types';

// Mock dependencies
jest.mock('../offline-storage');
jest.mock('@/lib/supabase/client');

const mockOfflineStorage = offlineStorage as jest.Mocked<typeof offlineStorage>;
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

const mockSupabase = {
  from: jest.fn(),
  select: jest.fn(),
  insert: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  eq: jest.fn(),
  gte: jest.fn()
};

describe('SyncManager', () => {
  let syncManager: SyncManager;

  beforeEach(() => {
    jest.clearAllMocks();
    syncManager = new SyncManager();
    
    // Setup Supabase mock
    mockCreateClient.mockReturnValue(mockSupabase as any);
    
    // Setup chainable methods
    mockSupabase.from.mockReturnValue(mockSupabase);
    mockSupabase.select.mockReturnValue(mockSupabase);
    mockSupabase.insert.mockReturnValue(mockSupabase);
    mockSupabase.update.mockReturnValue(mockSupabase);
    mockSupabase.delete.mockReturnValue(mockSupabase);
    mockSupabase.eq.mockReturnValue(mockSupabase);
    mockSupabase.gte.mockReturnValue(mockSupabase);
  });

  describe('performSync', () => {
    const userId = 'user-123';
    const mockList: List = {
      id: 'list-1',
      user_id: userId,
      name: 'Test List',
      description: 'Test Description',
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z'
    };

    const mockTask: Task = {
      id: 'task-1',
      list_id: 'list-1',
      user_id: userId,
      title: 'Test Task',
      description: 'Test Description',
      completed: false,
      priority: 'medium',
      due_date: '2023-12-31',
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z'
    };

    beforeEach(() => {
      // Mock offline storage methods
      mockOfflineStorage.getMetadata.mockResolvedValue(0);
      mockOfflineStorage.setMetadata.mockResolvedValue();
      mockOfflineStorage.getLists.mockResolvedValue([]);
      mockOfflineStorage.getTasks.mockResolvedValue([]);
      mockOfflineStorage.getQueuedOperations.mockResolvedValue([]);
      mockOfflineStorage.saveList.mockResolvedValue();
      mockOfflineStorage.saveTask.mockResolvedValue();
    });

    it('should perform successful sync without conflicts', async () => {
      // Mock successful remote data fetch
      mockSupabase.select.mockResolvedValueOnce({ data: [mockList], error: null });
      mockSupabase.select.mockResolvedValueOnce({ data: [mockTask], error: null });

      const result = await syncManager.performSync(userId);

      expect(result.success).toBe(true);
      expect(result.conflicts).toHaveLength(0);
      expect(result.synced).toBe(2); // 1 list + 1 task
      expect(result.failed).toBe(0);
      expect(mockOfflineStorage.setMetadata).toHaveBeenCalledWith('lastSync', expect.any(Number));
    });

    it('should handle remote fetch errors', async () => {
      // Mock error in remote data fetch
      mockSupabase.select.mockResolvedValueOnce({ 
        data: null, 
        error: { message: 'Network error' } 
      });

      const result = await syncManager.performSync(userId);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Failed to fetch remote lists: Network error');
    });

    it('should detect and handle conflicts', async () => {
      const remoteList = { ...mockList, name: 'Remote Name', updated_at: '2023-01-02T00:00:00Z' };
      const localList = { 
        ...mockList, 
        name: 'Local Name', 
        updated_at: '2023-01-01T00:00:00Z',
        _offline_updated: Date.now()
      };

      // Mock remote data with conflicts
      mockSupabase.select.mockResolvedValueOnce({ data: [remoteList], error: null });
      mockSupabase.select.mockResolvedValueOnce({ data: [], error: null });
      
      // Mock local data
      mockOfflineStorage.getLists.mockResolvedValue([localList]);

      const result = await syncManager.performSync(userId);

      expect(result.conflicts.length).toBeGreaterThan(0);
      expect(result.conflicts[0].type).toBe('list');
      expect(result.conflicts[0].conflictFields).toContain('name');
    });

    it('should push local operations to remote', async () => {
      const operation = {
        id: 'op-1',
        type: 'CREATE' as const,
        table: 'lists' as const,
        data: { name: 'New List', user_id: userId },
        timestamp: Date.now(),
        retryCount: 0
      };

      // Mock no remote changes
      mockSupabase.select.mockResolvedValue({ data: [], error: null });
      
      // Mock local operations
      mockOfflineStorage.getQueuedOperations.mockResolvedValue([operation]);
      mockOfflineStorage.removeOperation.mockResolvedValue();
      
      // Mock successful insert
      mockSupabase.insert.mockResolvedValue({ error: null });

      const result = await syncManager.performSync(userId);

      expect(result.success).toBe(true);
      expect(result.synced).toBe(1);
      expect(mockSupabase.insert).toHaveBeenCalledWith([{
        name: 'New List',
        description: undefined,
        user_id: userId
      }]);
      expect(mockOfflineStorage.removeOperation).toHaveBeenCalledWith('op-1');
    });

    it('should handle operation failures', async () => {
      const operation = {
        id: 'op-1',
        type: 'CREATE' as const,
        table: 'lists' as const,
        data: { name: 'New List', user_id: userId },
        timestamp: Date.now(),
        retryCount: 0
      };

      // Mock no remote changes
      mockSupabase.select.mockResolvedValue({ data: [], error: null });
      
      // Mock local operations
      mockOfflineStorage.getQueuedOperations.mockResolvedValue([operation]);
      mockOfflineStorage.updateOperationRetry.mockResolvedValue();
      
      // Mock failed insert
      mockSupabase.insert.mockResolvedValue({ error: { message: 'Insert failed' } });

      const result = await syncManager.performSync(userId);

      expect(result.success).toBe(true); // Sync continues despite operation failures
      expect(result.failed).toBe(1);
      expect(result.errors).toContain('Failed to sync operation op-1: Insert failed');
      expect(mockOfflineStorage.updateOperationRetry).toHaveBeenCalledWith('op-1', 'Insert failed');
    });

    it('should prevent concurrent syncs', async () => {
      // Start first sync
      const syncPromise1 = syncManager.performSync(userId);
      
      // Try to start second sync
      await expect(syncManager.performSync(userId)).rejects.toThrow('Sync already in progress');
      
      // Wait for first sync to complete
      await syncPromise1;
    });
  });

  describe('conflict detection', () => {
    it('should detect list conflicts correctly', async () => {
      const userId = 'user-123';
      const remoteList: List = {
        id: 'list-1',
        user_id: userId,
        name: 'Remote Name',
        description: 'Remote Description',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-02T00:00:00Z'
      };

      const localList = {
        ...remoteList,
        name: 'Local Name',
        description: 'Local Description',
        updated_at: '2023-01-01T00:00:00Z',
        _offline_updated: Date.now()
      };

      // Mock data
      mockSupabase.select.mockResolvedValueOnce({ data: [remoteList], error: null });
      mockSupabase.select.mockResolvedValueOnce({ data: [], error: null });
      mockOfflineStorage.getLists.mockResolvedValue([localList]);
      mockOfflineStorage.getQueuedOperations.mockResolvedValue([]);

      const result = await syncManager.performSync(userId);

      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0].type).toBe('list');
      expect(result.conflicts[0].conflictFields).toEqual(['name', 'description']);
      expect(result.conflicts[0].localData).toEqual(localList);
      expect(result.conflicts[0].remoteData).toEqual(remoteList);
    });

    it('should detect task conflicts correctly', async () => {
      const userId = 'user-123';
      const remoteTask: Task = {
        id: 'task-1',
        list_id: 'list-1',
        user_id: userId,
        title: 'Remote Title',
        description: 'Remote Description',
        completed: true,
        priority: 'high',
        due_date: '2023-12-31',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-02T00:00:00Z'
      };

      const localTask = {
        ...remoteTask,
        title: 'Local Title',
        completed: false,
        priority: 'low' as const,
        updated_at: '2023-01-01T00:00:00Z',
        _offline_updated: Date.now()
      };

      // Mock data
      mockSupabase.select.mockResolvedValueOnce({ data: [], error: null });
      mockSupabase.select.mockResolvedValueOnce({ data: [remoteTask], error: null });
      mockOfflineStorage.getLists.mockResolvedValue([]);
      mockOfflineStorage.getTasks.mockResolvedValue([localTask]);
      mockOfflineStorage.getQueuedOperations.mockResolvedValue([]);

      const result = await syncManager.performSync(userId);

      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0].type).toBe('task');
      expect(result.conflicts[0].conflictFields).toEqual(['title', 'completed', 'priority']);
    });

    it('should not detect conflicts when only one side is modified', async () => {
      const userId = 'user-123';
      const remoteList: List = {
        id: 'list-1',
        user_id: userId,
        name: 'Updated Name',
        description: 'Test Description',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-02T00:00:00Z'
      };

      const localList = {
        ...remoteList,
        name: 'Original Name',
        updated_at: '2023-01-01T00:00:00Z'
        // No _offline_updated, so not modified locally
      };

      // Mock data
      mockSupabase.select.mockResolvedValueOnce({ data: [remoteList], error: null });
      mockSupabase.select.mockResolvedValueOnce({ data: [], error: null });
      mockOfflineStorage.getLists.mockResolvedValue([localList]);
      mockOfflineStorage.getQueuedOperations.mockResolvedValue([]);

      const result = await syncManager.performSync(userId);

      expect(result.conflicts).toHaveLength(0);
      expect(result.synced).toBe(1); // Should update local with remote
      expect(mockOfflineStorage.saveList).toHaveBeenCalledWith(remoteList);
    });
  });

  describe('getSyncStatus', () => {
    it('should return sync status', async () => {
      const userId = 'user-123';
      const lastSync = Date.now();
      const operations = [
        { id: 'op-1', type: 'CREATE', table: 'lists', data: {}, timestamp: Date.now(), retryCount: 0 }
      ];

      mockOfflineStorage.getMetadata.mockResolvedValue(lastSync);
      mockOfflineStorage.getQueuedOperations.mockResolvedValue(operations as any);

      const status = await syncManager.getSyncStatus(userId);

      expect(status).toEqual({
        lastSync: new Date(lastSync),
        pendingOperations: 1,
        hasConflicts: false
      });
    });
  });

  describe('isSyncInProgress', () => {
    it('should return sync progress status', () => {
      expect(syncManager.isSyncInProgress()).toBe(false);
    });
  });
});