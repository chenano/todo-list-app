import { createClient } from './supabase/client'
import type { Database } from './supabase/types'
import type { List, Task, ListWithTaskCount, DatabaseError } from '@/types'

// Create a typed Supabase client
export const supabase = createClient()

// Database utility functions
export class DatabaseService {
  /**
   * Handle database errors consistently
   */
  static handleError(error: any): DatabaseError {
    return {
      message: error.message || 'An unexpected error occurred',
      code: error.code,
      details: error.details
    }
  }

  /**
   * Check if user is authenticated
   */
  static async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw this.handleError(error)
    return user
  }

  /**
   * Get user's lists with task counts
   */
  static async getUserListsWithCounts(userId: string): Promise<ListWithTaskCount[]> {
    const { data, error } = await supabase
      .from('lists')
      .select(`
        *,
        tasks(count)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw this.handleError(error)

    // Transform the data to include task_count
    return data?.map((list: any) => ({
      ...list,
      task_count: list.tasks?.[0]?.count || 0
    })) || []
  }

  /**
   * Get tasks for a specific list
   */
  static async getTasksForList(listId: string, userId: string): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('list_id', listId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw this.handleError(error)
    return data || []
  }

  /**
   * Create a new list
   */
  static async createList(name: string, description: string | null, userId: string): Promise<List> {
    const { data, error } = await supabase
      .from('lists')
      .insert({
        name,
        description,
        user_id: userId
      })
      .select()
      .single()

    if (error) throw this.handleError(error)
    return data
  }

  /**
   * Update a list
   */
  static async updateList(id: string, updates: Partial<Pick<List, 'name' | 'description'>>, userId: string): Promise<List> {
    const { data, error } = await supabase
      .from('lists')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw this.handleError(error)
    return data
  }

  /**
   * Delete a list and all its tasks
   */
  static async deleteList(id: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('lists')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw this.handleError(error)
  }

  /**
   * Create a new task
   */
  static async createTask(
    listId: string,
    title: string,
    description: string | null,
    priority: 'low' | 'medium' | 'high',
    dueDate: string | null,
    userId: string
  ): Promise<Task> {
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        list_id: listId,
        title,
        description,
        priority,
        due_date: dueDate,
        user_id: userId
      })
      .select()
      .single()

    if (error) throw this.handleError(error)
    return data
  }

  /**
   * Update a task
   */
  static async updateTask(
    id: string,
    updates: Partial<Pick<Task, 'title' | 'description' | 'completed' | 'priority' | 'due_date'>>,
    userId: string
  ): Promise<Task> {
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw this.handleError(error)
    return data
  }

  /**
   * Toggle task completion status
   */
  static async toggleTaskCompletion(id: string, completed: boolean, userId: string): Promise<Task> {
    return this.updateTask(id, { completed }, userId)
  }

  /**
   * Delete a task
   */
  static async deleteTask(id: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw this.handleError(error)
  }

  /**
   * Get overdue tasks for a user
   */
  static async getOverdueTasks(userId: string): Promise<Task[]> {
    const today = new Date().toISOString().split('T')[0]
    
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('completed', false)
      .lt('due_date', today)
      .order('due_date', { ascending: true })

    if (error) throw this.handleError(error)
    return data || []
  }

  /**
   * Get tasks by priority
   */
  static async getTasksByPriority(userId: string, priority: 'low' | 'medium' | 'high'): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('priority', priority)
      .order('created_at', { ascending: false })

    if (error) throw this.handleError(error)
    return data || []
  }
}