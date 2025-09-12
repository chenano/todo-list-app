// IndexedDB utilities for offline data storage
import type { List, Task } from '@/types';

const DB_NAME = 'TodoAppOfflineDB';
const DB_VERSION = 1;

// Store names
const STORES = {
  LISTS: 'lists',
  TASKS: 'tasks',
  OPERATIONS: 'operations',
  METADATA: 'metadata'
} as const;

export interface OfflineOperation {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  table: 'lists' | 'tasks';
  data: any;
  originalId?: string;
  timestamp: number;
  retryCount: number;
  error?: string;
}

export interface OfflineMetadata {
  lastSync: number;
  userId: string;
  version: number;
}

class OfflineStorage {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  async init(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create lists store
        if (!db.objectStoreNames.contains(STORES.LISTS)) {
          const listsStore = db.createObjectStore(STORES.LISTS, { keyPath: 'id' });
          listsStore.createIndex('user_id', 'user_id', { unique: false });
          listsStore.createIndex('updated_at', 'updated_at', { unique: false });
        }

        // Create tasks store
        if (!db.objectStoreNames.contains(STORES.TASKS)) {
          const tasksStore = db.createObjectStore(STORES.TASKS, { keyPath: 'id' });
          tasksStore.createIndex('list_id', 'list_id', { unique: false });
          tasksStore.createIndex('user_id', 'user_id', { unique: false });
          tasksStore.createIndex('updated_at', 'updated_at', { unique: false });
        }

        // Create operations queue store
        if (!db.objectStoreNames.contains(STORES.OPERATIONS)) {
          const operationsStore = db.createObjectStore(STORES.OPERATIONS, { keyPath: 'id' });
          operationsStore.createIndex('timestamp', 'timestamp', { unique: false });
          operationsStore.createIndex('table', 'table', { unique: false });
        }

        // Create metadata store
        if (!db.objectStoreNames.contains(STORES.METADATA)) {
          db.createObjectStore(STORES.METADATA, { keyPath: 'key' });
        }
      };
    });

    return this.initPromise;
  }

  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init();
    }
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    return this.db;
  }

  // Lists operations
  async getLists(userId: string): Promise<List[]> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.LISTS], 'readonly');
      const store = transaction.objectStore(STORES.LISTS);
      const index = store.index('user_id');
      const request = index.getAll(userId);

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        reject(new Error('Failed to get lists from offline storage'));
      };
    });
  }

  async saveList(list: List): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.LISTS], 'readwrite');
      const store = transaction.objectStore(STORES.LISTS);
      const request = store.put({ ...list, _offline_updated: Date.now() });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to save list to offline storage'));
    });
  }

  async deleteList(listId: string): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.LISTS, STORES.TASKS], 'readwrite');
      
      // Delete the list
      const listsStore = transaction.objectStore(STORES.LISTS);
      listsStore.delete(listId);

      // Delete all tasks in the list
      const tasksStore = transaction.objectStore(STORES.TASKS);
      const index = tasksStore.index('list_id');
      const request = index.openCursor(listId);

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(new Error('Failed to delete list from offline storage'));
    });
  }

  // Tasks operations
  async getTasks(listId?: string, userId?: string): Promise<Task[]> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.TASKS], 'readonly');
      const store = transaction.objectStore(STORES.TASKS);
      
      let request: IDBRequest;
      if (listId) {
        const index = store.index('list_id');
        request = index.getAll(listId);
      } else if (userId) {
        const index = store.index('user_id');
        request = index.getAll(userId);
      } else {
        request = store.getAll();
      }

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        reject(new Error('Failed to get tasks from offline storage'));
      };
    });
  }

  async saveTask(task: Task): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.TASKS], 'readwrite');
      const store = transaction.objectStore(STORES.TASKS);
      const request = store.put({ ...task, _offline_updated: Date.now() });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to save task to offline storage'));
    });
  }

  async deleteTask(taskId: string): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.TASKS], 'readwrite');
      const store = transaction.objectStore(STORES.TASKS);
      const request = store.delete(taskId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to delete task from offline storage'));
    });
  }

  // Operations queue
  async queueOperation(operation: Omit<OfflineOperation, 'id' | 'timestamp' | 'retryCount'>): Promise<string> {
    const db = await this.ensureDB();
    const operationWithId: OfflineOperation = {
      ...operation,
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retryCount: 0
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.OPERATIONS], 'readwrite');
      const store = transaction.objectStore(STORES.OPERATIONS);
      const request = store.put(operationWithId);

      request.onsuccess = () => resolve(operationWithId.id);
      request.onerror = () => reject(new Error('Failed to queue operation'));
    });
  }

  async getQueuedOperations(): Promise<OfflineOperation[]> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.OPERATIONS], 'readonly');
      const store = transaction.objectStore(STORES.OPERATIONS);
      const index = store.index('timestamp');
      const request = index.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        reject(new Error('Failed to get queued operations'));
      };
    });
  }

  async removeOperation(operationId: string): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.OPERATIONS], 'readwrite');
      const store = transaction.objectStore(STORES.OPERATIONS);
      const request = store.delete(operationId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to remove operation'));
    });
  }

  async updateOperationRetry(operationId: string, error?: string): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.OPERATIONS], 'readwrite');
      const store = transaction.objectStore(STORES.OPERATIONS);
      const getRequest = store.get(operationId);

      getRequest.onsuccess = () => {
        const operation = getRequest.result;
        if (operation) {
          operation.retryCount += 1;
          if (error) {
            operation.error = error;
          }
          
          const putRequest = store.put(operation);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(new Error('Failed to update operation retry count'));
        } else {
          reject(new Error('Operation not found'));
        }
      };

      getRequest.onerror = () => {
        reject(new Error('Failed to get operation for retry update'));
      };
    });
  }

  // Metadata operations
  async getMetadata(key: string): Promise<any> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.METADATA], 'readonly');
      const store = transaction.objectStore(STORES.METADATA);
      const request = store.get(key);

      request.onsuccess = () => {
        resolve(request.result?.value);
      };

      request.onerror = () => {
        reject(new Error('Failed to get metadata'));
      };
    });
  }

  async setMetadata(key: string, value: any): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.METADATA], 'readwrite');
      const store = transaction.objectStore(STORES.METADATA);
      const request = store.put({ key, value });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to set metadata'));
    });
  }

  // Utility methods
  async clearAllData(): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.LISTS, STORES.TASKS, STORES.OPERATIONS, STORES.METADATA], 'readwrite');
      
      const stores = [STORES.LISTS, STORES.TASKS, STORES.OPERATIONS, STORES.METADATA];
      stores.forEach(storeName => {
        transaction.objectStore(storeName).clear();
      });

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(new Error('Failed to clear offline data'));
    });
  }

  async getStorageSize(): Promise<{ lists: number; tasks: number; operations: number }> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.LISTS, STORES.TASKS, STORES.OPERATIONS], 'readonly');
      const results = { lists: 0, tasks: 0, operations: 0 };
      let completed = 0;

      const checkComplete = () => {
        completed++;
        if (completed === 3) {
          resolve(results);
        }
      };

      // Count lists
      const listsRequest = transaction.objectStore(STORES.LISTS).count();
      listsRequest.onsuccess = () => {
        results.lists = listsRequest.result;
        checkComplete();
      };
      listsRequest.onerror = () => reject(new Error('Failed to count lists'));

      // Count tasks
      const tasksRequest = transaction.objectStore(STORES.TASKS).count();
      tasksRequest.onsuccess = () => {
        results.tasks = tasksRequest.result;
        checkComplete();
      };
      tasksRequest.onerror = () => reject(new Error('Failed to count tasks'));

      // Count operations
      const operationsRequest = transaction.objectStore(STORES.OPERATIONS).count();
      operationsRequest.onsuccess = () => {
        results.operations = operationsRequest.result;
        checkComplete();
      };
      operationsRequest.onerror = () => reject(new Error('Failed to count operations'));
    });
  }
}

// Singleton instance
export const offlineStorage = new OfflineStorage();