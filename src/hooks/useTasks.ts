import { useState, useEffect, useCallback, useRef } from 'react';
import { Task } from '../lib/supabase/types';
import { TaskFormData, TaskUpdateData, TaskFilters, TaskSort } from '../lib/validations';
import { taskService } from '../lib/tasks';
import { DatabaseError } from '../types';

export interface UseTasksState {
  tasks: Task[];
  loading: boolean;
  error: DatabaseError | null;
}

export interface UseTasksActions {
  refetch: () => Promise<void>;
  createTask: (listId: string, data: TaskFormData) => Promise<Task | null>;
  updateTask: (id: string, data: TaskUpdateData) => Promise<Task | null>;
  toggleCompletion: (id: string) => Promise<Task | null>;
  deleteTask: (id: string) => Promise<boolean>;
  setFilters: (filters: TaskFilters) => void;
  setSort: (sort: TaskSort) => void;
}

export interface UseTasksReturn extends UseTasksState, UseTasksActions {
  filters: TaskFilters;
  sort: TaskSort;
}

/**
 * Hook for managing tasks in a specific list with real-time updates
 */
export function useTasks(listId: string): UseTasksReturn {
  const [state, setState] = useState<UseTasksState>({
    tasks: [],
    loading: true,
    error: null,
  });

  const [filters, setFilters] = useState<TaskFilters>({});
  const [sort, setSort] = useState<TaskSort>({
    field: 'created_at',
    direction: 'desc',
  });

  const subscriptionRef = useRef<any>(null);

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, loading }));
  }, []);

  const setError = useCallback((error: DatabaseError | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  const setTasks = useCallback((tasks: Task[]) => {
    setState(prev => ({ ...prev, tasks }));
  }, []);

  // Fetch tasks from the server
  const refetch = useCallback(async () => {
    if (!listId) return;

    setLoading(true);
    setError(null);

    const { data, error } = await taskService.getTasksByListId(listId, filters, sort);
    
    if (error) {
      setError(error);
    } else if (data) {
      setTasks(data);
    }
    
    setLoading(false);
  }, [listId, filters, sort, setLoading, setError, setTasks]);

  // Create a new task with optimistic update
  const createTask = useCallback(async (listId: string, data: TaskFormData): Promise<Task | null> => {
    const tempId = `temp-${Date.now()}`;
    const optimisticTask: Task = {
      id: tempId,
      list_id: listId,
      user_id: '', // Will be set by server
      title: data.title,
      description: data.description || null,
      completed: false,
      priority: data.priority,
      due_date: data.due_date || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Optimistic update
    setState(prev => ({
      ...prev,
      tasks: [optimisticTask, ...prev.tasks],
      error: null,
    }));

    const { data: newTask, error } = await taskService.createTask(listId, data);

    if (error) {
      // Rollback optimistic update
      setState(prev => ({
        ...prev,
        tasks: prev.tasks.filter(task => task.id !== tempId),
        error,
      }));
      return null;
    }

    if (newTask) {
      // Replace optimistic task with real data
      setState(prev => ({
        ...prev,
        tasks: prev.tasks.map(task => 
          task.id === tempId ? newTask : task
        ),
      }));
      return newTask;
    }

    return null;
  }, []);

  // Update a task with optimistic update
  const updateTask = useCallback(async (
    id: string, 
    data: TaskUpdateData
  ): Promise<Task | null> => {
    const originalTask = state.tasks.find(task => task.id === id);
    if (!originalTask) return null;

    // Optimistic update
    const optimisticTask = {
      ...originalTask,
      ...data,
      updated_at: new Date().toISOString(),
    };

    setState(prev => ({
      ...prev,
      tasks: prev.tasks.map(task => 
        task.id === id ? optimisticTask : task
      ),
      error: null,
    }));

    const { data: updatedTask, error } = await taskService.updateTask(id, data);

    if (error) {
      // Rollback optimistic update
      setState(prev => ({
        ...prev,
        tasks: prev.tasks.map(task => 
          task.id === id ? originalTask : task
        ),
        error,
      }));
      return null;
    }

    if (updatedTask) {
      // Update with real data from server
      setState(prev => ({
        ...prev,
        tasks: prev.tasks.map(task => 
          task.id === id ? updatedTask : task
        ),
      }));
      return updatedTask;
    }

    return null;
  }, [state.tasks]);

  // Toggle task completion with optimistic update
  const toggleCompletion = useCallback(async (id: string): Promise<Task | null> => {
    const originalTask = state.tasks.find(task => task.id === id);
    if (!originalTask) return null;

    // Optimistic update
    const optimisticTask = {
      ...originalTask,
      completed: !originalTask.completed,
      updated_at: new Date().toISOString(),
    };

    setState(prev => ({
      ...prev,
      tasks: prev.tasks.map(task => 
        task.id === id ? optimisticTask : task
      ),
      error: null,
    }));

    const { data: updatedTask, error } = await taskService.toggleTaskCompletion(id);

    if (error) {
      // Rollback optimistic update
      setState(prev => ({
        ...prev,
        tasks: prev.tasks.map(task => 
          task.id === id ? originalTask : task
        ),
        error,
      }));
      return null;
    }

    if (updatedTask) {
      // Update with real data from server
      setState(prev => ({
        ...prev,
        tasks: prev.tasks.map(task => 
          task.id === id ? updatedTask : task
        ),
      }));
      return updatedTask;
    }

    return null;
  }, [state.tasks]);

  // Delete a task with optimistic update
  const deleteTask = useCallback(async (id: string): Promise<boolean> => {
    const originalTask = state.tasks.find(task => task.id === id);
    if (!originalTask) return false;

    // Optimistic update
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.filter(task => task.id !== id),
      error: null,
    }));

    const { error } = await taskService.deleteTask(id);

    if (error) {
      // Rollback optimistic update
      setState(prev => ({
        ...prev,
        tasks: [...prev.tasks, originalTask].sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ),
        error,
      }));
      return false;
    }

    return true;
  }, [state.tasks]);

  // Set up real-time subscription
  useEffect(() => {
    if (!listId) return;

    const subscription = taskService.subscribeToTaskUpdates(listId, (payload) => {
      const { eventType, new: newRecord, old: oldRecord } = payload;

      setState(prev => {
        let updatedTasks = [...prev.tasks];

        switch (eventType) {
          case 'INSERT':
            // Only add if not already present (avoid duplicates from optimistic updates)
            if (newRecord && !updatedTasks.find(task => task.id === newRecord.id)) {
              updatedTasks = [newRecord, ...updatedTasks];
            }
            break;
          case 'UPDATE':
            if (newRecord) {
              updatedTasks = updatedTasks.map(task =>
                task.id === newRecord.id ? newRecord : task
              );
            }
            break;
          case 'DELETE':
            if (oldRecord) {
              updatedTasks = updatedTasks.filter(task => task.id !== oldRecord.id);
            }
            break;
        }

        return { ...prev, tasks: updatedTasks };
      });
    });

    subscriptionRef.current = subscription;

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, [listId]);

  // Refetch when filters or sort change
  useEffect(() => {
    refetch();
  }, [refetch]);

  return {
    ...state,
    filters,
    sort,
    refetch,
    createTask,
    updateTask,
    toggleCompletion,
    deleteTask,
    setFilters,
    setSort,
  };
}

/**
 * Hook for managing all user tasks across lists
 */
export function useAllTasks() {
  const [state, setState] = useState<UseTasksState>({
    tasks: [],
    loading: true,
    error: null,
  });

  const [filters, setFilters] = useState<TaskFilters>({});
  const [sort, setSort] = useState<TaskSort>({
    field: 'created_at',
    direction: 'desc',
  });

  const subscriptionRef = useRef<any>(null);

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, loading }));
  }, []);

  const setError = useCallback((error: DatabaseError | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  const setTasks = useCallback((tasks: Task[]) => {
    setState(prev => ({ ...prev, tasks }));
  }, []);

  // Fetch all user tasks
  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error } = await taskService.getAllUserTasks(filters, sort);
    
    if (error) {
      setError(error);
    } else if (data) {
      setTasks(data);
    }
    
    setLoading(false);
  }, [filters, sort, setLoading, setError, setTasks]);

  // Set up real-time subscription for all tasks
  useEffect(() => {
    const subscription = taskService.subscribeToAllTaskUpdates((payload) => {
      const { eventType, new: newRecord, old: oldRecord } = payload;

      setState(prev => {
        let updatedTasks = [...prev.tasks];

        switch (eventType) {
          case 'INSERT':
            if (newRecord && !updatedTasks.find(task => task.id === newRecord.id)) {
              updatedTasks = [newRecord, ...updatedTasks];
            }
            break;
          case 'UPDATE':
            if (newRecord) {
              updatedTasks = updatedTasks.map(task =>
                task.id === newRecord.id ? newRecord : task
              );
            }
            break;
          case 'DELETE':
            if (oldRecord) {
              updatedTasks = updatedTasks.filter(task => task.id !== oldRecord.id);
            }
            break;
        }

        return { ...prev, tasks: updatedTasks };
      });
    });

    subscriptionRef.current = subscription;

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, []);

  // Refetch when filters or sort change
  useEffect(() => {
    refetch();
  }, [refetch]);

  return {
    ...state,
    filters,
    sort,
    refetch,
    setFilters,
    setSort,
  };
}

/**
 * Hook for managing a single task
 */
export function useTask(id: string) {
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<DatabaseError | null>(null);

  const fetchTask = useCallback(async () => {
    if (!id) return;
    
    setLoading(true);
    setError(null);

    const { data, error } = await taskService.getTaskById(id);
    
    if (error) {
      setError(error);
    } else {
      setTask(data);
    }
    
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchTask();
  }, [fetchTask]);

  return {
    task,
    loading,
    error,
    refetch: fetchTask,
  };
}

/**
 * Hook for creating tasks
 */
export function useCreateTask() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<DatabaseError | null>(null);

  const createTask = useCallback(async (
    listId: string, 
    data: TaskFormData
  ): Promise<Task | null> => {
    setLoading(true);
    setError(null);

    const { data: newTask, error } = await taskService.createTask(listId, data);
    
    if (error) {
      setError(error);
      setLoading(false);
      return null;
    }

    setLoading(false);
    return newTask;
  }, []);

  return {
    createTask,
    loading,
    error,
    clearError: () => setError(null),
  };
}

/**
 * Hook for updating tasks
 */
export function useUpdateTask() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<DatabaseError | null>(null);

  const updateTask = useCallback(async (
    id: string, 
    data: TaskUpdateData
  ): Promise<Task | null> => {
    setLoading(true);
    setError(null);

    const { data: updatedTask, error } = await taskService.updateTask(id, data);
    
    if (error) {
      setError(error);
      setLoading(false);
      return null;
    }

    setLoading(false);
    return updatedTask;
  }, []);

  return {
    updateTask,
    loading,
    error,
    clearError: () => setError(null),
  };
}

/**
 * Hook for deleting tasks
 */
export function useDeleteTask() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<DatabaseError | null>(null);

  const deleteTask = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    const { error } = await taskService.deleteTask(id);
    
    if (error) {
      setError(error);
      setLoading(false);
      return false;
    }

    setLoading(false);
    return true;
  }, []);

  return {
    deleteTask,
    loading,
    error,
    clearError: () => setError(null),
  };
}

/**
 * Hook for getting overdue tasks
 */
export function useOverdueTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<DatabaseError | null>(null);

  const fetchOverdueTasks = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error } = await taskService.getOverdueTasks();
    
    if (error) {
      setError(error);
    } else if (data) {
      setTasks(data);
    }
    
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchOverdueTasks();
  }, [fetchOverdueTasks]);

  return {
    tasks,
    loading,
    error,
    refetch: fetchOverdueTasks,
  };
}