import { useState, useEffect, useCallback } from 'react';
import { List } from '../lib/supabase/types';
import { ListFormData, ListUpdateData } from '../lib/validations';
import { listService } from '../lib/lists';
import { DatabaseError } from '../types';
import { recordListCreated, recordListDeleted } from '@/lib/analytics';

export interface UseListsState {
  lists: (List & { task_count: number })[];
  loading: boolean;
  error: DatabaseError | null;
}

export interface UseListsActions {
  refetch: () => Promise<void>;
  createList: (data: ListFormData) => Promise<List | null>;
  updateList: (id: string, data: ListUpdateData) => Promise<List | null>;
  deleteList: (id: string) => Promise<boolean>;
}

export interface UseListsReturn extends UseListsState, UseListsActions {}

/**
 * Hook for managing lists with optimistic updates
 */
export function useLists(): UseListsReturn {
  const [state, setState] = useState<UseListsState>({
    lists: [],
    loading: true,
    error: null,
  });

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, loading }));
  }, []);

  const setError = useCallback((error: DatabaseError | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  const setLists = useCallback((lists: (List & { task_count: number })[]) => {
    setState(prev => ({ ...prev, lists }));
  }, []);

  // Fetch lists from the server
  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error } = await listService.getListsWithTaskCount();
    
    if (error) {
      setError(error);
    } else if (data) {
      setLists(data);
    }
    
    setLoading(false);
  }, [setLoading, setError, setLists]);

  // Create a new list with optimistic update
  const createList = useCallback(async (data: ListFormData): Promise<List | null> => {
    const tempId = `temp-${Date.now()}`;
    const optimisticList: List & { task_count: number } = {
      id: tempId,
      user_id: '', // Will be set by server
      name: data.name,
      description: data.description || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      task_count: 0,
    };

    // Optimistic update
    setState(prev => ({
      ...prev,
      lists: [optimisticList, ...prev.lists],
      error: null,
    }));

    const { data: newList, error } = await listService.createList(data);

    if (error) {
      // Rollback optimistic update
      setState(prev => ({
        ...prev,
        lists: prev.lists.filter(list => list.id !== tempId),
        error,
      }));
      return null;
    }

    if (newList) {
      // Replace optimistic list with real data
      setState(prev => ({
        ...prev,
        lists: prev.lists.map(list => 
          list.id === tempId 
            ? { ...newList, task_count: 0 }
            : list
        ),
      }));
      
      // Record analytics event
      recordListCreated(newList);
      
      return newList;
    }

    return null;
  }, []);

  // Update a list with optimistic update
  const updateList = useCallback(async (
    id: string, 
    data: ListUpdateData
  ): Promise<List | null> => {
    const originalList = state.lists.find(list => list.id === id);
    if (!originalList) return null;

    // Optimistic update
    const optimisticList = {
      ...originalList,
      ...data,
      updated_at: new Date().toISOString(),
    };

    setState(prev => ({
      ...prev,
      lists: prev.lists.map(list => 
        list.id === id ? optimisticList : list
      ),
      error: null,
    }));

    const { data: updatedList, error } = await listService.updateList(id, data);

    if (error) {
      // Rollback optimistic update
      setState(prev => ({
        ...prev,
        lists: prev.lists.map(list => 
          list.id === id ? originalList : list
        ),
        error,
      }));
      return null;
    }

    if (updatedList) {
      // Update with real data from server
      setState(prev => ({
        ...prev,
        lists: prev.lists.map(list => 
          list.id === id 
            ? { ...updatedList, task_count: originalList.task_count }
            : list
        ),
      }));
      return updatedList;
    }

    return null;
  }, [state.lists]);

  // Delete a list with optimistic update
  const deleteList = useCallback(async (id: string): Promise<boolean> => {
    const originalList = state.lists.find(list => list.id === id);
    if (!originalList) return false;

    // Optimistic update
    setState(prev => ({
      ...prev,
      lists: prev.lists.filter(list => list.id !== id),
      error: null,
    }));

    const { error } = await listService.deleteList(id);

    if (error) {
      // Rollback optimistic update
      setState(prev => ({
        ...prev,
        lists: [...prev.lists, originalList].sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ),
        error,
      }));
      return false;
    }

    // Record analytics event
    recordListDeleted(originalList);

    return true;
  }, [state.lists]);

  // Initial fetch
  useEffect(() => {
    refetch();
  }, [refetch]);

  return {
    ...state,
    refetch,
    createList,
    updateList,
    deleteList,
  };
}

/**
 * Hook for managing a single list
 */
export function useList(id: string) {
  const [list, setList] = useState<List | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<DatabaseError | null>(null);

  const fetchList = useCallback(async () => {
    if (!id) return;
    
    setLoading(true);
    setError(null);

    const { data, error } = await listService.getListById(id);
    
    if (error) {
      setError(error);
    } else {
      setList(data);
    }
    
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  return {
    list,
    loading,
    error,
    refetch: fetchList,
  };
}

/**
 * Hook for creating lists
 */
export function useCreateList() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<DatabaseError | null>(null);

  const createList = useCallback(async (data: ListFormData): Promise<List | null> => {
    setLoading(true);
    setError(null);

    const { data: newList, error } = await listService.createList(data);
    
    if (error) {
      setError(error);
      setLoading(false);
      return null;
    }

    setLoading(false);
    return newList;
  }, []);

  return {
    createList,
    loading,
    error,
    clearError: () => setError(null),
  };
}

/**
 * Hook for updating lists
 */
export function useUpdateList() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<DatabaseError | null>(null);

  const updateList = useCallback(async (
    id: string, 
    data: ListUpdateData
  ): Promise<List | null> => {
    setLoading(true);
    setError(null);

    const { data: updatedList, error } = await listService.updateList(id, data);
    
    if (error) {
      setError(error);
      setLoading(false);
      return null;
    }

    setLoading(false);
    return updatedList;
  }, []);

  return {
    updateList,
    loading,
    error,
    clearError: () => setError(null),
  };
}

/**
 * Hook for deleting lists
 */
export function useDeleteList() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<DatabaseError | null>(null);

  const deleteList = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    const { error } = await listService.deleteList(id);
    
    if (error) {
      setError(error);
      setLoading(false);
      return false;
    }

    setLoading(false);
    return true;
  }, []);

  return {
    deleteList,
    loading,
    error,
    clearError: () => setError(null),
  };
}