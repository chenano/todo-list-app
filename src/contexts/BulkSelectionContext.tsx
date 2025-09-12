'use client';

import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { Task } from '@/lib/supabase/types';

// Types for bulk selection
export interface BulkSelectionState {
  selectedTaskIds: Set<string>;
  isSelectionMode: boolean;
  lastSelectedId: string | null;
}

export type BulkSelectionAction =
  | { type: 'TOGGLE_TASK'; taskId: string }
  | { type: 'SELECT_TASK'; taskId: string }
  | { type: 'DESELECT_TASK'; taskId: string }
  | { type: 'SELECT_ALL'; taskIds: string[] }
  | { type: 'DESELECT_ALL' }
  | { type: 'ENTER_SELECTION_MODE' }
  | { type: 'EXIT_SELECTION_MODE' }
  | { type: 'SELECT_RANGE'; fromId: string; toId: string; allTaskIds: string[] };

export interface BulkSelectionContextType {
  state: BulkSelectionState;
  actions: {
    toggleTask: (taskId: string) => void;
    selectTask: (taskId: string) => void;
    deselectTask: (taskId: string) => void;
    selectAll: (taskIds: string[]) => void;
    deselectAll: () => void;
    enterSelectionMode: () => void;
    exitSelectionMode: () => void;
    selectRange: (fromId: string, toId: string, allTaskIds: string[]) => void;
    isTaskSelected: (taskId: string) => boolean;
    getSelectedTasks: (tasks: Task[]) => Task[];
    getSelectedCount: () => number;
  };
}

const initialState: BulkSelectionState = {
  selectedTaskIds: new Set(),
  isSelectionMode: false,
  lastSelectedId: null,
};

function bulkSelectionReducer(
  state: BulkSelectionState,
  action: BulkSelectionAction
): BulkSelectionState {
  switch (action.type) {
    case 'TOGGLE_TASK': {
      const newSelectedIds = new Set(state.selectedTaskIds);
      if (newSelectedIds.has(action.taskId)) {
        newSelectedIds.delete(action.taskId);
      } else {
        newSelectedIds.add(action.taskId);
      }
      
      return {
        ...state,
        selectedTaskIds: newSelectedIds,
        lastSelectedId: action.taskId,
        isSelectionMode: newSelectedIds.size > 0,
      };
    }

    case 'SELECT_TASK': {
      const newSelectedIds = new Set(state.selectedTaskIds);
      newSelectedIds.add(action.taskId);
      
      return {
        ...state,
        selectedTaskIds: newSelectedIds,
        lastSelectedId: action.taskId,
        isSelectionMode: true,
      };
    }

    case 'DESELECT_TASK': {
      const newSelectedIds = new Set(state.selectedTaskIds);
      newSelectedIds.delete(action.taskId);
      
      return {
        ...state,
        selectedTaskIds: newSelectedIds,
        isSelectionMode: newSelectedIds.size > 0,
      };
    }

    case 'SELECT_ALL': {
      return {
        ...state,
        selectedTaskIds: new Set(action.taskIds),
        isSelectionMode: action.taskIds.length > 0,
        lastSelectedId: action.taskIds[action.taskIds.length - 1] || null,
      };
    }

    case 'DESELECT_ALL': {
      return {
        ...state,
        selectedTaskIds: new Set(),
        isSelectionMode: false,
        lastSelectedId: null,
      };
    }

    case 'ENTER_SELECTION_MODE': {
      return {
        ...state,
        isSelectionMode: true,
      };
    }

    case 'EXIT_SELECTION_MODE': {
      return {
        ...state,
        selectedTaskIds: new Set(),
        isSelectionMode: false,
        lastSelectedId: null,
      };
    }

    case 'SELECT_RANGE': {
      const { fromId, toId, allTaskIds } = action;
      const fromIndex = allTaskIds.indexOf(fromId);
      const toIndex = allTaskIds.indexOf(toId);
      
      if (fromIndex === -1 || toIndex === -1) {
        return state;
      }

      const startIndex = Math.min(fromIndex, toIndex);
      const endIndex = Math.max(fromIndex, toIndex);
      const rangeIds = allTaskIds.slice(startIndex, endIndex + 1);
      
      const newSelectedIds = new Set(state.selectedTaskIds);
      rangeIds.forEach(id => newSelectedIds.add(id));
      
      return {
        ...state,
        selectedTaskIds: newSelectedIds,
        lastSelectedId: toId,
        isSelectionMode: true,
      };
    }

    default:
      return state;
  }
}

const BulkSelectionContext = createContext<BulkSelectionContextType | null>(null);

export function BulkSelectionProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(bulkSelectionReducer, initialState);

  const actions = {
    toggleTask: useCallback((taskId: string) => {
      dispatch({ type: 'TOGGLE_TASK', taskId });
    }, []),

    selectTask: useCallback((taskId: string) => {
      dispatch({ type: 'SELECT_TASK', taskId });
    }, []),

    deselectTask: useCallback((taskId: string) => {
      dispatch({ type: 'DESELECT_TASK', taskId });
    }, []),

    selectAll: useCallback((taskIds: string[]) => {
      dispatch({ type: 'SELECT_ALL', taskIds });
    }, []),

    deselectAll: useCallback(() => {
      dispatch({ type: 'DESELECT_ALL' });
    }, []),

    enterSelectionMode: useCallback(() => {
      dispatch({ type: 'ENTER_SELECTION_MODE' });
    }, []),

    exitSelectionMode: useCallback(() => {
      dispatch({ type: 'EXIT_SELECTION_MODE' });
    }, []),

    selectRange: useCallback((fromId: string, toId: string, allTaskIds: string[]) => {
      dispatch({ type: 'SELECT_RANGE', fromId, toId, allTaskIds });
    }, []),

    isTaskSelected: useCallback((taskId: string) => {
      return state.selectedTaskIds.has(taskId);
    }, [state.selectedTaskIds]),

    getSelectedTasks: useCallback((tasks: Task[]) => {
      return tasks.filter(task => state.selectedTaskIds.has(task.id));
    }, [state.selectedTaskIds]),

    getSelectedCount: useCallback(() => {
      return state.selectedTaskIds.size;
    }, [state.selectedTaskIds]),
  };

  return (
    <BulkSelectionContext.Provider value={{ state, actions }}>
      {children}
    </BulkSelectionContext.Provider>
  );
}

export function useBulkSelection() {
  const context = useContext(BulkSelectionContext);
  if (!context) {
    throw new Error('useBulkSelection must be used within a BulkSelectionProvider');
  }
  return context;
}