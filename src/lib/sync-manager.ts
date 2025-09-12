// Sync manager for handling data synchronization and conflict resolution
import { createClient } from '@/lib/supabase/client';
import { offlineStorage, type OfflineOperation } from './offline-storage';
import type { List, Task } from '@/types';

export interface SyncConflict {
  id: string;
  type: 'list' | 'task';
  operation: 'UPDATE' | 'DELETE';
  localData: any;
  remoteData: any;
  localTimestamp: number;
  remoteTimestamp: number;
  conflictFields: string[];
}

export interface SyncResult {
  success: boolean;
  conflicts: SyncConflict[];
  synced: number;
  failed: number;
  errors: string[];
}

export interface ConflictResolution {
  conflictId: string;
  resolution: 'local' | 'remote' | 'merge';
  mergedData?: any;
}

export class SyncManager {
  private supabase = createClient();
  private syncInProgress = false;
  private conflictResolvers: Map<string, (conflict: SyncConflict) => Promise<ConflictResolution>> = new Map();

  // Register a conflict resolver for a specific conflict type
  registerConflictResolver(
    type: string,
    resolver: (conflict: SyncConflict) => Promise<ConflictResolution>
  ): void {
    this.conflictResolvers.set(type, resolver);
  }

  // Perform full synchronization
  async performSync(userId: string): Promise<SyncResult> {
    if (this.syncInProgress) {
      throw new Error('Sync already in progress');
    }

    this.syncInProgress = true;
    const result: SyncResult = {
      success: true,
      conflicts: [],
      synced: 0,
      failed: 0,
      errors: []
    };

    try {
      // Step 1: Pull remote changes and detect conflicts
      await this.pullRemoteChanges(userId, result);

      // Step 2: Push local changes
      await this.pushLocalChanges(result);

      // Step 3: Handle any remaining conflicts
      if (result.conflicts.length > 0) {
        await this.resolveConflicts(result.conflicts, result);
      }

      // Update last sync timestamp
      await offlineStorage.setMetadata('lastSync', Date.now());

    } catch (error) {
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : 'Unknown sync error');
    } finally {
      this.syncInProgress = false;
    }

    return result;
  }

  // Pull remote changes and detect conflicts
  private async pullRemoteChanges(userId: string, result: SyncResult): Promise<void> {
    const lastSync = await offlineStorage.getMetadata('lastSync') || 0;
    const lastSyncDate = new Date(lastSync).toISOString();

    // Fetch remote lists updated since last sync
    const { data: remoteLists, error: listsError } = await this.supabase
      .from('lists')
      .select('*')
      .eq('user_id', userId)
      .gte('updated_at', lastSyncDate);

    if (listsError) {
      throw new Error(`Failed to fetch remote lists: ${listsError.message}`);
    }

    // Fetch remote tasks updated since last sync
    const { data: remoteTasks, error: tasksError } = await this.supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .gte('updated_at', lastSyncDate);

    if (tasksError) {
      throw new Error(`Failed to fetch remote tasks: ${tasksError.message}`);
    }

    // Process remote lists
    if (remoteLists) {
      for (const remoteList of remoteLists) {
        await this.processRemoteList(remoteList, result);
      }
    }

    // Process remote tasks
    if (remoteTasks) {
      for (const remoteTask of remoteTasks) {
        await this.processRemoteTask(remoteTask, result);
      }
    }
  }

  // Process a remote list and detect conflicts
  private async processRemoteList(remoteList: List, result: SyncResult): Promise<void> {
    try {
      const localLists = await offlineStorage.getLists(remoteList.user_id);
      const localList = localLists.find(l => l.id === remoteList.id);

      if (!localList) {
        // New remote list, save locally
        await offlineStorage.saveList(remoteList);
        result.synced++;
        return;
      }

      // Check for conflicts
      const conflict = this.detectListConflict(localList, remoteList);
      if (conflict) {
        result.conflicts.push(conflict);
        return;
      }

      // No conflict, update local data
      if (new Date(remoteList.updated_at) > new Date(localList.updated_at)) {
        await offlineStorage.saveList(remoteList);
        result.synced++;
      }
    } catch (error) {
      result.failed++;
      result.errors.push(`Failed to process remote list ${remoteList.id}: ${error}`);
    }
  }

  // Process a remote task and detect conflicts
  private async processRemoteTask(remoteTask: Task, result: SyncResult): Promise<void> {
    try {
      const localTasks = await offlineStorage.getTasks(undefined, remoteTask.user_id);
      const localTask = localTasks.find(t => t.id === remoteTask.id);

      if (!localTask) {
        // New remote task, save locally
        await offlineStorage.saveTask(remoteTask);
        result.synced++;
        return;
      }

      // Check for conflicts
      const conflict = this.detectTaskConflict(localTask, remoteTask);
      if (conflict) {
        result.conflicts.push(conflict);
        return;
      }

      // No conflict, update local data
      if (new Date(remoteTask.updated_at) > new Date(localTask.updated_at)) {
        await offlineStorage.saveTask(remoteTask);
        result.synced++;
      }
    } catch (error) {
      result.failed++;
      result.errors.push(`Failed to process remote task ${remoteTask.id}: ${error}`);
    }
  }

  // Detect conflicts between local and remote lists
  private detectListConflict(localList: List, remoteList: List): SyncConflict | null {
    const localTimestamp = new Date(localList.updated_at).getTime();
    const remoteTimestamp = new Date(remoteList.updated_at).getTime();
    
    // Check if both have been modified since last sync
    const localModified = (localList as any)._offline_updated > localTimestamp;
    const remoteModified = remoteTimestamp > localTimestamp;

    if (!localModified || !remoteModified) {
      return null; // No conflict
    }

    // Detect conflicting fields
    const conflictFields: string[] = [];
    if (localList.name !== remoteList.name) conflictFields.push('name');
    if (localList.description !== remoteList.description) conflictFields.push('description');

    if (conflictFields.length === 0) {
      return null; // No actual conflicts
    }

    return {
      id: `list_${localList.id}_${Date.now()}`,
      type: 'list',
      operation: 'UPDATE',
      localData: localList,
      remoteData: remoteList,
      localTimestamp: (localList as any)._offline_updated || localTimestamp,
      remoteTimestamp,
      conflictFields
    };
  }

  // Detect conflicts between local and remote tasks
  private detectTaskConflict(localTask: Task, remoteTask: Task): SyncConflict | null {
    const localTimestamp = new Date(localTask.updated_at).getTime();
    const remoteTimestamp = new Date(remoteTask.updated_at).getTime();
    
    // Check if both have been modified since last sync
    const localModified = (localTask as any)._offline_updated > localTimestamp;
    const remoteModified = remoteTimestamp > localTimestamp;

    if (!localModified || !remoteModified) {
      return null; // No conflict
    }

    // Detect conflicting fields
    const conflictFields: string[] = [];
    if (localTask.title !== remoteTask.title) conflictFields.push('title');
    if (localTask.description !== remoteTask.description) conflictFields.push('description');
    if (localTask.completed !== remoteTask.completed) conflictFields.push('completed');
    if (localTask.priority !== remoteTask.priority) conflictFields.push('priority');
    if (localTask.due_date !== remoteTask.due_date) conflictFields.push('due_date');
    if (localTask.list_id !== remoteTask.list_id) conflictFields.push('list_id');

    if (conflictFields.length === 0) {
      return null; // No actual conflicts
    }

    return {
      id: `task_${localTask.id}_${Date.now()}`,
      type: 'task',
      operation: 'UPDATE',
      localData: localTask,
      remoteData: remoteTask,
      localTimestamp: (localTask as any)._offline_updated || localTimestamp,
      remoteTimestamp,
      conflictFields
    };
  }

  // Push local changes to remote
  private async pushLocalChanges(result: SyncResult): Promise<void> {
    const operations = await offlineStorage.getQueuedOperations();

    for (const operation of operations) {
      try {
        await this.processOperation(operation);
        await offlineStorage.removeOperation(operation.id);
        result.synced++;
      } catch (error) {
        result.failed++;
        result.errors.push(`Failed to sync operation ${operation.id}: ${error}`);
        
        // Update retry count
        await offlineStorage.updateOperationRetry(
          operation.id,
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
    }
  }

  // Process a single operation
  private async processOperation(operation: OfflineOperation): Promise<void> {
    const { type, table, data, originalId } = operation;

    switch (table) {
      case 'lists':
        await this.processListOperation(type, data, originalId);
        break;
      case 'tasks':
        await this.processTaskOperation(type, data, originalId);
        break;
      default:
        throw new Error(`Unknown table: ${table}`);
    }
  }

  // Process list operations
  private async processListOperation(
    type: OfflineOperation['type'],
    data: Partial<List>,
    originalId?: string
  ): Promise<void> {
    switch (type) {
      case 'CREATE': {
        const { error } = await this.supabase
          .from('lists')
          .insert([{
            name: data.name!,
            description: data.description,
            user_id: data.user_id!
          }]);
        
        if (error) throw error;
        break;
      }
      case 'UPDATE': {
        const { error } = await this.supabase
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
        const { error } = await this.supabase
          .from('lists')
          .delete()
          .eq('id', originalId || data.id);
        
        if (error) throw error;
        break;
      }
    }
  }

  // Process task operations
  private async processTaskOperation(
    type: OfflineOperation['type'],
    data: Partial<Task>,
    originalId?: string
  ): Promise<void> {
    switch (type) {
      case 'CREATE': {
        const { error } = await this.supabase
          .from('tasks')
          .insert([{
            title: data.title!,
            description: data.description,
            completed: data.completed || false,
            priority: data.priority || 'medium',
            due_date: data.due_date,
            list_id: data.list_id!,
            user_id: data.user_id!
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

        const { error } = await this.supabase
          .from('tasks')
          .update(updateData)
          .eq('id', originalId || data.id);
        
        if (error) throw error;
        break;
      }
      case 'DELETE': {
        const { error } = await this.supabase
          .from('tasks')
          .delete()
          .eq('id', originalId || data.id);
        
        if (error) throw error;
        break;
      }
    }
  }

  // Resolve conflicts using registered resolvers or default strategies
  private async resolveConflicts(conflicts: SyncConflict[], result: SyncResult): Promise<void> {
    for (const conflict of conflicts) {
      try {
        const resolver = this.conflictResolvers.get(conflict.type) || this.getDefaultResolver(conflict.type);
        const resolution = await resolver(conflict);
        
        await this.applyConflictResolution(conflict, resolution);
        result.synced++;
      } catch (error) {
        result.failed++;
        result.errors.push(`Failed to resolve conflict ${conflict.id}: ${error}`);
      }
    }
  }

  // Get default conflict resolver
  private getDefaultResolver(type: string): (conflict: SyncConflict) => Promise<ConflictResolution> {
    return async (conflict: SyncConflict): Promise<ConflictResolution> => {
      // Default strategy: use the most recent change
      const useLocal = conflict.localTimestamp > conflict.remoteTimestamp;
      
      return {
        conflictId: conflict.id,
        resolution: useLocal ? 'local' : 'remote'
      };
    };
  }

  // Apply conflict resolution
  private async applyConflictResolution(conflict: SyncConflict, resolution: ConflictResolution): Promise<void> {
    let finalData: any;

    switch (resolution.resolution) {
      case 'local':
        finalData = conflict.localData;
        break;
      case 'remote':
        finalData = conflict.remoteData;
        break;
      case 'merge':
        finalData = resolution.mergedData || conflict.remoteData;
        break;
      default:
        throw new Error(`Unknown resolution type: ${resolution.resolution}`);
    }

    // Apply the resolution
    if (conflict.type === 'list') {
      await offlineStorage.saveList(finalData);
      
      // If using local data, push to remote
      if (resolution.resolution === 'local' || resolution.resolution === 'merge') {
        await this.processListOperation('UPDATE', finalData, finalData.id);
      }
    } else if (conflict.type === 'task') {
      await offlineStorage.saveTask(finalData);
      
      // If using local data, push to remote
      if (resolution.resolution === 'local' || resolution.resolution === 'merge') {
        await this.processTaskOperation('UPDATE', finalData, finalData.id);
      }
    }
  }

  // Check if sync is in progress
  isSyncInProgress(): boolean {
    return this.syncInProgress;
  }

  // Get sync status
  async getSyncStatus(userId: string): Promise<{
    lastSync: Date | null;
    pendingOperations: number;
    hasConflicts: boolean;
  }> {
    const lastSync = await offlineStorage.getMetadata('lastSync');
    const operations = await offlineStorage.getQueuedOperations();
    
    return {
      lastSync: lastSync ? new Date(lastSync) : null,
      pendingOperations: operations.length,
      hasConflicts: false // TODO: Implement conflict detection
    };
  }
}

// Singleton instance
export const syncManager = new SyncManager();