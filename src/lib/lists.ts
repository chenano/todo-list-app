import { createClient } from './supabase/client';
import { List, ListInsert, ListUpdate } from './supabase/types';
import { ListFormData, ListUpdateData } from './validations';
import { DatabaseError } from '../types';

export class ListService {
  private supabase: ReturnType<typeof createClient>;

  constructor(supabaseClient?: ReturnType<typeof createClient>) {
    this.supabase = supabaseClient || createClient();
  }

  /**
   * Get all lists for the current user
   */
  async getLists(): Promise<{ data: List[] | null; error: DatabaseError | null }> {
    try {
      const { data, error } = await this.supabase
        .from('lists')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        return { data: null, error: { message: error.message, code: error.code } };
      }

      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: { message: 'Failed to fetch lists', details: String(error) }
      };
    }
  }

  /**
   * Get lists with task count for the current user
   */
  async getListsWithTaskCount(): Promise<{ 
    data: (List & { task_count: number })[] | null; 
    error: DatabaseError | null 
  }> {
    try {
      const { data, error } = await this.supabase
        .from('lists')
        .select(`
          *,
          tasks(count)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        return { data: null, error: { message: error.message, code: error.code } };
      }

      // Transform the data to include task_count
      const listsWithCount = data?.map((list: any) => ({
        ...list,
        task_count: Array.isArray(list.tasks) ? list.tasks.length : (list.tasks as any)?.count || 0
      })) || [];

      return { data: listsWithCount, error: null };
    } catch (error) {
      return {
        data: null,
        error: { message: 'Failed to fetch lists with task count', details: String(error) }
      };
    }
  }

  /**
   * Get a single list by ID
   */
  async getListById(id: string): Promise<{ data: List | null; error: DatabaseError | null }> {
    try {
      const { data, error } = await this.supabase
        .from('lists')
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
        error: { message: 'Failed to fetch list', details: String(error) }
      };
    }
  }

  /**
   * Create a new list
   */
  async createList(listData: ListFormData): Promise<{ data: List | null; error: DatabaseError | null }> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      
      if (!user) {
        return { data: null, error: { message: 'User not authenticated' } };
      }

      const insertData: ListInsert = {
        user_id: user.id,
        name: listData.name,
        description: listData.description || null,
      };

      const { data, error } = await this.supabase
        .from('lists')
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
        error: { message: 'Failed to create list', details: String(error) }
      };
    }
  }

  /**
   * Update an existing list
   */
  async updateList(
    id: string, 
    updates: ListUpdateData
  ): Promise<{ data: List | null; error: DatabaseError | null }> {
    try {
      const updateData: ListUpdate = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await this.supabase
        .from('lists')
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
        error: { message: 'Failed to update list', details: String(error) }
      };
    }
  }

  /**
   * Delete a list and all its tasks
   */
  async deleteList(id: string): Promise<{ error: DatabaseError | null }> {
    try {
      const { error } = await this.supabase
        .from('lists')
        .delete()
        .eq('id', id);

      if (error) {
        return { error: { message: error.message, code: error.code } };
      }

      return { error: null };
    } catch (error) {
      return {
        error: { message: 'Failed to delete list', details: String(error) }
      };
    }
  }

  /**
   * Get task count for a specific list
   */
  async getTaskCount(listId: string): Promise<{ data: number | null; error: DatabaseError | null }> {
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
}

// Export a singleton instance
export const listService = new ListService();

// Export individual functions for easier testing and usage
export const {
  getLists,
  getListsWithTaskCount,
  getListById,
  createList,
  updateList,
  deleteList,
  getTaskCount,
} = listService;