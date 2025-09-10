import { createClient } from './supabase/client';
import { Task, TaskInsert, TaskUpdate } from './supabase/types';
import { TaskFormData, TaskUpdateData, TaskFilters, TaskSort } from './validations';
import { DatabaseError } from '../types';

export class TaskService {
  private supabase: ReturnType<typeof createClient>;

  constructor(supabaseClient?: ReturnType<typeof createClient>) {
    this.supabase = supabaseClient || createClient();
  }

  /**
   * Get all tasks for a specific list
   */
  async getTasksByListId(
    listId: string,
    filters?: TaskFilters,
    sort?: TaskSort
  ): Promise<{ data: Task[] | null; error: DatabaseError | null }> {
    try {
      let query = this.supabase
        .from('tasks')
        .select('*')
        .eq('list_id', listId);

      // Apply filters
      if (filters?.status === 'completed') {
        query = query.eq('completed', true);
      } else if (filters?.status === 'incomplete') {
        query = query.eq('completed', false);
      }

      if (filters?.priority && filters.priority !== 'all') {
        query = query.eq('priority', filters.priority);
      }

      if (filters?.overdue) {
        const today = new Date().toISOString().split('T')[0];
        query = query.lt('due_date', today).eq('completed', false);
      }

      // Apply sorting
      if (sort) {
        const ascending = sort.direction === 'asc';
        query = query.order(sort.field, { ascending });
      } else {
        // Default sort by created_at descending
        query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;

      if (error) {
        return { data: null, error: { message: error.message, code: error.code } };
      }

      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: { message: 'Failed to fetch tasks', details: String(error) }
      };
    }
  }

  /**
   * Get all tasks for the current user across all lists
   */
  async getAllUserTasks(
    filters?: TaskFilters,
    sort?: TaskSort
  ): Promise<{ data: Task[] | null; error: DatabaseError | null }> {
    try {
      let query = this.supabase
        .from('tasks')
        .select('*');

      // Apply filters
      if (filters?.status === 'completed') {
        query = query.eq('completed', true);
      } else if (filters?.status === 'incomplete') {
        query = query.eq('completed', false);
      }

      if (filters?.priority && filters.priority !== 'all') {
        query = query.eq('priority', filters.priority);
      }

      if (filters?.overdue) {
        const today = new Date().toISOString().split('T')[0];
        query = query.lt('due_date', today).eq('completed', false);
      }

      // Apply sorting
      if (sort) {
        const ascending = sort.direction === 'asc';
        query = query.order(sort.field, { ascending });
      } else {
        // Default sort by created_at descending
        query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;

      if (error) {
        return { data: null, error: { message: error.message, code: error.code } };
      }

      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: { message: 'Failed to fetch tasks', details: String(error) }
      };
    }
  }

  /**
   * Get a single task by ID
   */
  async getTaskById(id: string): Promise<{ data: Task | null; error: DatabaseError | null }> {
    try {
      const { data, error } = await this.supabase
        .from('tasks')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        return { data: null, error: { message: error.message, code: error.code } };
      }

      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: { message: 'Failed to fetch task', details: String(error) }
      };
    }
  }

  /**
   * Create a new task
   */
  async createTask(
    listId: string,
    taskData: TaskFormData
  ): Promise<{ data: Task | null; error: DatabaseError | null }> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      
      if (!user) {
        return { data: null, error: { message: 'User not authenticated' } };
      }

      const insertData: TaskInsert = {
        list_id: listId,
        user_id: user.id,
        title: taskData.title,
        description: taskData.description || null,
        priority: taskData.priority,
        due_date: taskData.due_date || null,
        completed: false,
      };

      const { data, error } = await this.supabase
        .from('tasks')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        return { data: null, error: { message: error.message, code: error.code } };
      }

      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: { message: 'Failed to create task', details: String(error) }
      };
    }
  }

  /**
   * Update an existing task
   */
  async updateTask(
    id: string,
    updates: TaskUpdateData
  ): Promise<{ data: Task | null; error: DatabaseError | null }> {
    try {
      const updateData: TaskUpdate = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await this.supabase
        .from('tasks')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return { data: null, error: { message: error.message, code: error.code } };
      }

      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: { message: 'Failed to update task', details: String(error) }
      };
    }
  }

  /**
   * Toggle task completion status
   */
  async toggleTaskCompletion(id: string): Promise<{ data: Task | null; error: DatabaseError | null }> {
    try {
      // First get the current task to know its completion status
      const { data: currentTask, error: fetchError } = await this.getTaskById(id);
      
      if (fetchError || !currentTask) {
        return { data: null, error: fetchError || { message: 'Task not found' } };
      }

      const updateData: TaskUpdate = {
        completed: !currentTask.completed,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await this.supabase
        .from('tasks')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return { data: null, error: { message: error.message, code: error.code } };
      }

      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: { message: 'Failed to toggle task completion', details: String(error) }
      };
    }
  }

  /**
   * Delete a task
   */
  async deleteTask(id: string): Promise<{ error: DatabaseError | null }> {
    try {
      const { error } = await this.supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) {
        return { error: { message: error.message, code: error.code } };
      }

      return { error: null };
    } catch (error) {
      return {
        error: { message: 'Failed to delete task', details: String(error) }
      };
    }
  }

  /**
   * Get overdue tasks for the current user
   */
  async getOverdueTasks(): Promise<{ data: Task[] | null; error: DatabaseError | null }> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await this.supabase
        .from('tasks')
        .select('*')
        .lt('due_date', today)
        .eq('completed', false)
        .order('due_date', { ascending: true });

      if (error) {
        return { data: null, error: { message: error.message, code: error.code } };
      }

      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: { message: 'Failed to fetch overdue tasks', details: String(error) }
      };
    }
  }

  /**
   * Get task count for a specific list
   */
  async getTaskCountByListId(listId: string): Promise<{ data: number | null; error: DatabaseError | null }> {
    try {
      const { count, error } = await this.supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('list_id', listId);

      if (error) {
        return { data: null, error: { message: error.message, code: error.code } };
      }

      return { data: count || 0, error: null };
    } catch (error) {
      return {
        data: null,
        error: { message: 'Failed to get task count', details: String(error) }
      };
    }
  }

  /**
   * Get completed task count for a specific list
   */
  async getCompletedTaskCountByListId(listId: string): Promise<{ data: number | null; error: DatabaseError | null }> {
    try {
      const { count, error } = await this.supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('list_id', listId)
        .eq('completed', true);

      if (error) {
        return { data: null, error: { message: error.message, code: error.code } };
      }

      return { data: count || 0, error: null };
    } catch (error) {
      return {
        data: null,
        error: { message: 'Failed to get completed task count', details: String(error) }
      };
    }
  }

  /**
   * Subscribe to real-time task updates for a specific list
   */
  subscribeToTaskUpdates(
    listId: string,
    callback: (payload: any) => void
  ) {
    return this.supabase
      .channel(`tasks:list_id=eq.${listId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `list_id=eq.${listId}`,
        },
        callback
      )
      .subscribe();
  }

  /**
   * Subscribe to real-time task updates for all user tasks
   */
  subscribeToAllTaskUpdates(callback: (payload: any) => void) {
    return this.supabase
      .channel('tasks:user')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
        },
        callback
      )
      .subscribe();
  }
}

// Export a singleton instance
export const taskService = new TaskService();

// Export individual functions for easier testing and usage
export const {
  getTasksByListId,
  getAllUserTasks,
  getTaskById,
  createTask,
  updateTask,
  toggleTaskCompletion,
  deleteTask,
  getOverdueTasks,
  getTaskCountByListId,
  getCompletedTaskCountByListId,
  subscribeToTaskUpdates,
  subscribeToAllTaskUpdates,
} = taskService;