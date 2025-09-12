// Tests for offline storage utilities
import { offlineStorage, type OfflineOperation } from '../offline-storage';
import type { List, Task } from '@/types';

// Mock IndexedDB
const mockDB = {
  transaction: jest.fn(),
  objectStoreNames: {
    contains: jest.fn()
  },
  createObjectStore: jest.fn(),
  close: jest.fn()
};

const mockTransaction = {
  objectStore: jest.fn(),
  oncomplete: null as any,
  onerror: null as any
};

const mockStore = {
  put: jest.fn(),
  get: jest.fn(),
  delete: jest.fn(),
  getAll: jest.fn(),
  count: jest.fn(),
  clear: jest.fn(),
  createIndex: jest.fn(),
  index: jest.fn()
};

const mockIndex = {
  getAll: jest.fn(),
  openCursor: jest.fn()
};

const mockRequest = {
  onsuccess: null as any,
  onerror: null as any,
  result: null as any
};

// Mock IndexedDB API
Object.defineProperty(window, 'indexedDB', {
  value: {
    open: jest.fn()
  }
});

describe('OfflineStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock implementations
    mockTransaction.objectStore.mockReturnValue(mockStore);
    mockStore.index.mockReturnValue(mockIndex);
    mockDB.transaction.mockReturnValue(mockTransaction);
    
    // Mock successful operations
    mockStore.put.mockReturnValue(mockRequest);
    mockStore.get.mockReturnValue(mockRequest);
    mockStore.delete.mockReturnValue(mockRequest);
    mockStore.getAll.mockReturnValue(mockRequest);
    mockStore.count.mockReturnValue(mockRequest);
    mockStore.clear.mockReturnValue(mockRequest);
    mockIndex.getAll.mockReturnValue(mockRequest);
    mockIndex.openCursor.mockReturnValue(mockRequest);

    // Mock IndexedDB open
    (window.indexedDB.open as jest.Mock).mockImplementation(() => {
      const request = {
        onsuccess: null as any,
        onerror: null as any,
        onupgradeneeded: null as any,
        result: mockDB
      };
      
      // Simulate successful open
      setTimeout(() => {
        if (request.onsuccess) {
          request.onsuccess();
        }
      }, 0);
      
      return request;
    });
  });

  describe('initialization', () => {
    it('should initialize database successfully', async () => {
      await expect(offlineStorage.init()).resolves.toBeUndefined();
    });

    it('should handle database open error', async () => {
      (window.indexedDB.open as jest.Mock).mockImplementation(() => {
        const request = {
          onsuccess: null as any,
          onerror: null as any,
          onupgradeneeded: null as any,
          result: null
        };
        
        setTimeout(() => {
          if (request.onerror) {
            request.onerror();
          }
        }, 0);
        
        return request;
      });

      await expect(offlineStorage.init()).rejects.toThrow('Failed to open IndexedDB');
    });
  });

  describe('lists operations', () => {
    const mockList: List = {
      id: 'list-1',
      user_id: 'user-1',
      name: 'Test List',
      description: 'Test Description',
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z'
    };

    beforeEach(async () => {
      await offlineStorage.init();
    });

    it('should save a list', async () => {
      // Mock successful put operation
      setTimeout(() => {
        if (mockRequest.onsuccess) {
          mockRequest.onsuccess();
        }
      }, 0);

      await expect(offlineStorage.saveList(mockList)).resolves.toBeUndefined();
      expect(mockStore.put).toHaveBeenCalledWith({
        ...mockList,
        _offline_updated: expect.any(Number)
      });
    });

    it('should get lists for user', async () => {
      const mockLists = [mockList];
      
      // Mock successful getAll operation
      setTimeout(() => {
        mockRequest.result = mockLists;
        if (mockRequest.onsuccess) {
          mockRequest.onsuccess();
        }
      }, 0);

      const result = await offlineStorage.getLists('user-1');
      expect(result).toEqual(mockLists);
      expect(mockIndex.getAll).toHaveBeenCalledWith('user-1');
    });

    it('should delete a list and its tasks', async () => {
      // Mock successful delete operations
      setTimeout(() => {
        if (mockRequest.onsuccess) {
          mockRequest.onsuccess();
        }
      }, 0);

      setTimeout(() => {
        if (mockTransaction.oncomplete) {
          mockTransaction.oncomplete();
        }
      }, 10);

      await expect(offlineStorage.deleteList('list-1')).resolves.toBeUndefined();
      expect(mockStore.delete).toHaveBeenCalledWith('list-1');
    });

    it('should handle save list error', async () => {
      // Mock error
      setTimeout(() => {
        if (mockRequest.onerror) {
          mockRequest.onerror();
        }
      }, 0);

      await expect(offlineStorage.saveList(mockList)).rejects.toThrow('Failed to save list to offline storage');
    });
  });

  describe('tasks operations', () => {
    const mockTask: Task = {
      id: 'task-1',
      list_id: 'list-1',
      user_id: 'user-1',
      title: 'Test Task',
      description: 'Test Description',
      completed: false,
      priority: 'medium',
      due_date: '2023-12-31',
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z'
    };

    beforeEach(async () => {
      await offlineStorage.init();
    });

    it('should save a task', async () => {
      // Mock successful put operation
      setTimeout(() => {
        if (mockRequest.onsuccess) {
          mockRequest.onsuccess();
        }
      }, 0);

      await expect(offlineStorage.saveTask(mockTask)).resolves.toBeUndefined();
      expect(mockStore.put).toHaveBeenCalledWith({
        ...mockTask,
        _offline_updated: expect.any(Number)
      });
    });

    it('should get tasks by list ID', async () => {
      const mockTasks = [mockTask];
      
      // Mock successful getAll operation
      setTimeout(() => {
        mockRequest.result = mockTasks;
        if (mockRequest.onsuccess) {
          mockRequest.onsuccess();
        }
      }, 0);

      const result = await offlineStorage.getTasks('list-1');
      expect(result).toEqual(mockTasks);
      expect(mockIndex.getAll).toHaveBeenCalledWith('list-1');
    });

    it('should get tasks by user ID', async () => {
      const mockTasks = [mockTask];
      
      // Mock successful getAll operation
      setTimeout(() => {
        mockRequest.result = mockTasks;
        if (mockRequest.onsuccess) {
          mockRequest.onsuccess();
        }
      }, 0);

      const result = await offlineStorage.getTasks(undefined, 'user-1');
      expect(result).toEqual(mockTasks);
      expect(mockIndex.getAll).toHaveBeenCalledWith('user-1');
    });

    it('should delete a task', async () => {
      // Mock successful delete operation
      setTimeout(() => {
        if (mockRequest.onsuccess) {
          mockRequest.onsuccess();
        }
      }, 0);

      await expect(offlineStorage.deleteTask('task-1')).resolves.toBeUndefined();
      expect(mockStore.delete).toHaveBeenCalledWith('task-1');
    });
  });

  describe('operations queue', () => {
    const mockOperation: Omit<OfflineOperation, 'id' | 'timestamp' | 'retryCount'> = {
      type: 'CREATE',
      table: 'tasks',
      data: { title: 'New Task' }
    };

    beforeEach(async () => {
      await offlineStorage.init();
    });

    it('should queue an operation', async () => {
      // Mock successful put operation
      setTimeout(() => {
        if (mockRequest.onsuccess) {
          mockRequest.onsuccess();
        }
      }, 0);

      const operationId = await offlineStorage.queueOperation(mockOperation);
      expect(operationId).toMatch(/^offline_\d+_/);
      expect(mockStore.put).toHaveBeenCalledWith({
        ...mockOperation,
        id: operationId,
        timestamp: expect.any(Number),
        retryCount: 0
      });
    });

    it('should get queued operations', async () => {
      const mockOperations: OfflineOperation[] = [{
        ...mockOperation,
        id: 'op-1',
        timestamp: Date.now(),
        retryCount: 0
      }];
      
      // Mock successful getAll operation
      setTimeout(() => {
        mockRequest.result = mockOperations;
        if (mockRequest.onsuccess) {
          mockRequest.onsuccess();
        }
      }, 0);

      const result = await offlineStorage.getQueuedOperations();
      expect(result).toEqual(mockOperations);
      expect(mockIndex.getAll).toHaveBeenCalled();
    });

    it('should remove an operation', async () => {
      // Mock successful delete operation
      setTimeout(() => {
        if (mockRequest.onsuccess) {
          mockRequest.onsuccess();
        }
      }, 0);

      await expect(offlineStorage.removeOperation('op-1')).resolves.toBeUndefined();
      expect(mockStore.delete).toHaveBeenCalledWith('op-1');
    });

    it('should update operation retry count', async () => {
      const existingOperation: OfflineOperation = {
        ...mockOperation,
        id: 'op-1',
        timestamp: Date.now(),
        retryCount: 0
      };

      // Mock get operation
      setTimeout(() => {
        mockRequest.result = existingOperation;
        if (mockRequest.onsuccess) {
          mockRequest.onsuccess();
        }
      }, 0);

      // Mock put operation
      const putRequest = { ...mockRequest };
      mockStore.put.mockReturnValue(putRequest);
      setTimeout(() => {
        if (putRequest.onsuccess) {
          putRequest.onsuccess();
        }
      }, 10);

      await expect(offlineStorage.updateOperationRetry('op-1', 'Network error')).resolves.toBeUndefined();
      expect(mockStore.put).toHaveBeenCalledWith({
        ...existingOperation,
        retryCount: 1,
        error: 'Network error'
      });
    });
  });

  describe('metadata operations', () => {
    beforeEach(async () => {
      await offlineStorage.init();
    });

    it('should set metadata', async () => {
      // Mock successful put operation
      setTimeout(() => {
        if (mockRequest.onsuccess) {
          mockRequest.onsuccess();
        }
      }, 0);

      await expect(offlineStorage.setMetadata('lastSync', Date.now())).resolves.toBeUndefined();
      expect(mockStore.put).toHaveBeenCalledWith({
        key: 'lastSync',
        value: expect.any(Number)
      });
    });

    it('should get metadata', async () => {
      const mockValue = Date.now();
      
      // Mock successful get operation
      setTimeout(() => {
        mockRequest.result = { key: 'lastSync', value: mockValue };
        if (mockRequest.onsuccess) {
          mockRequest.onsuccess();
        }
      }, 0);

      const result = await offlineStorage.getMetadata('lastSync');
      expect(result).toBe(mockValue);
      expect(mockStore.get).toHaveBeenCalledWith('lastSync');
    });

    it('should return undefined for missing metadata', async () => {
      // Mock get operation with no result
      setTimeout(() => {
        mockRequest.result = undefined;
        if (mockRequest.onsuccess) {
          mockRequest.onsuccess();
        }
      }, 0);

      const result = await offlineStorage.getMetadata('nonexistent');
      expect(result).toBeUndefined();
    });
  });

  describe('utility methods', () => {
    beforeEach(async () => {
      await offlineStorage.init();
    });

    it('should clear all data', async () => {
      // Mock successful clear operations
      setTimeout(() => {
        if (mockTransaction.oncomplete) {
          mockTransaction.oncomplete();
        }
      }, 0);

      await expect(offlineStorage.clearAllData()).resolves.toBeUndefined();
      expect(mockStore.clear).toHaveBeenCalledTimes(4); // 4 stores
    });

    it('should get storage size', async () => {
      // Mock count operations
      const countRequests = [
        { ...mockRequest, result: 5 },  // lists
        { ...mockRequest, result: 10 }, // tasks
        { ...mockRequest, result: 2 }   // operations
      ];

      mockStore.count
        .mockReturnValueOnce(countRequests[0])
        .mockReturnValueOnce(countRequests[1])
        .mockReturnValueOnce(countRequests[2]);

      // Simulate successful count operations
      setTimeout(() => {
        countRequests.forEach(req => {
          if (req.onsuccess) {
            req.onsuccess();
          }
        });
      }, 0);

      const result = await offlineStorage.getStorageSize();
      expect(result).toEqual({
        lists: 5,
        tasks: 10,
        operations: 2
      });
    });
  });
});