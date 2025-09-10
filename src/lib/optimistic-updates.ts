import React from 'react'
import { errorUtils } from './errors'

export type OptimisticAction<T> = {
  id: string
  type: 'create' | 'update' | 'delete'
  data: T
  originalData?: T
  timestamp: number
}

export interface OptimisticState<T> {
  items: T[]
  pendingActions: OptimisticAction<T>[]
  isLoading: boolean
  error: Error | null
}

export type OptimisticReducerAction<T> =
  | { type: 'SET_ITEMS'; payload: T[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: Error | null }
  | { type: 'ADD_OPTIMISTIC'; payload: OptimisticAction<T> }
  | { type: 'CONFIRM_OPTIMISTIC'; payload: { id: string; result?: T } }
  | { type: 'ROLLBACK_OPTIMISTIC'; payload: string }
  | { type: 'CLEAR_PENDING' }

function optimisticReducer<T extends { id: string }>(
  state: OptimisticState<T>,
  action: OptimisticReducerAction<T>
): OptimisticState<T> {
  switch (action.type) {
    case 'SET_ITEMS':
      return {
        ...state,
        items: action.payload,
        error: null
      }

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload
      }

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false
      }

    case 'ADD_OPTIMISTIC': {
      const optimisticAction = action.payload
      let newItems = [...state.items]

      switch (optimisticAction.type) {
        case 'create':
          newItems.push(optimisticAction.data)
          break
        case 'update':
          newItems = newItems.map(item =>
            item.id === optimisticAction.data.id ? optimisticAction.data : item
          )
          break
        case 'delete':
          newItems = newItems.filter(item => item.id !== optimisticAction.data.id)
          break
      }

      return {
        ...state,
        items: newItems,
        pendingActions: [...state.pendingActions, optimisticAction],
        error: null
      }
    }

    case 'CONFIRM_OPTIMISTIC': {
      const { id, result } = action.payload
      const pendingAction = state.pendingActions.find(a => a.id === id)
      
      if (!pendingAction) return state

      let newItems = [...state.items]

      // If we have a result from the server, update with the real data
      if (result && pendingAction.type !== 'delete') {
        newItems = newItems.map(item =>
          item.id === pendingAction.data.id ? result : item
        )
      }

      return {
        ...state,
        items: newItems,
        pendingActions: state.pendingActions.filter(a => a.id !== id)
      }
    }

    case 'ROLLBACK_OPTIMISTIC': {
      const actionId = action.payload
      const pendingAction = state.pendingActions.find(a => a.id === actionId)
      
      if (!pendingAction) return state

      let newItems = [...state.items]

      switch (pendingAction.type) {
        case 'create':
          // Remove the optimistically added item
          newItems = newItems.filter(item => item.id !== pendingAction.data.id)
          break
        case 'update':
          // Restore the original data
          if (pendingAction.originalData) {
            newItems = newItems.map(item =>
              item.id === pendingAction.data.id ? pendingAction.originalData! : item
            )
          }
          break
        case 'delete':
          // Restore the deleted item
          if (pendingAction.originalData) {
            newItems.push(pendingAction.originalData)
          }
          break
      }

      return {
        ...state,
        items: newItems,
        pendingActions: state.pendingActions.filter(a => a.id !== actionId)
      }
    }

    case 'CLEAR_PENDING':
      return {
        ...state,
        pendingActions: []
      }

    default:
      return state
  }
}

export function useOptimisticUpdates<T extends { id: string }>(
  initialItems: T[] = []
) {
  const [state, dispatch] = React.useReducer(optimisticReducer<T>, {
    items: initialItems,
    pendingActions: [],
    isLoading: false,
    error: null
  })

  // Update items when initial data changes
  React.useEffect(() => {
    dispatch({ type: 'SET_ITEMS', payload: initialItems })
  }, [initialItems])

  const setLoading = React.useCallback((loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading })
  }, [])

  const setError = React.useCallback((error: Error | null) => {
    dispatch({ type: 'SET_ERROR', payload: error })
  }, [])

  const executeOptimistic = React.useCallback(async <R>(
    optimisticData: T,
    actionType: 'create' | 'update' | 'delete',
    serverAction: () => Promise<R>,
    options: {
      onSuccess?: (result: R) => void
      onError?: (error: Error) => void
      rollbackOnError?: boolean
    } = {}
  ): Promise<R | null> => {
    const actionId = Math.random().toString(36).substr(2, 9)
    const originalData = actionType === 'update' || actionType === 'delete' 
      ? state.items.find(item => item.id === optimisticData.id)
      : undefined

    const optimisticAction: OptimisticAction<T> = {
      id: actionId,
      type: actionType,
      data: optimisticData,
      originalData,
      timestamp: Date.now()
    }

    // Apply optimistic update
    dispatch({ type: 'ADD_OPTIMISTIC', payload: optimisticAction })

    try {
      // Execute server action
      const result = await serverAction()
      
      // Confirm optimistic update
      dispatch({ 
        type: 'CONFIRM_OPTIMISTIC', 
        payload: { 
          id: actionId, 
          result: result as unknown as T 
        } 
      })

      options.onSuccess?.(result)
      return result
    } catch (error) {
      const appError = error instanceof Error ? error : new Error('Unknown error')
      
      // Rollback optimistic update if requested
      if (options.rollbackOnError !== false) {
        dispatch({ type: 'ROLLBACK_OPTIMISTIC', payload: actionId })
      } else {
        // Just remove from pending actions
        dispatch({ type: 'CONFIRM_OPTIMISTIC', payload: { id: actionId } })
      }

      setError(appError)
      options.onError?.(appError)
      return null
    }
  }, [state.items])

  const createOptimistic = React.useCallback(async <R>(
    newItem: T,
    serverAction: () => Promise<R>,
    options?: {
      onSuccess?: (result: R) => void
      onError?: (error: Error) => void
      rollbackOnError?: boolean
    }
  ) => {
    return executeOptimistic(newItem, 'create', serverAction, options)
  }, [executeOptimistic])

  const updateOptimistic = React.useCallback(async <R>(
    updatedItem: T,
    serverAction: () => Promise<R>,
    options?: {
      onSuccess?: (result: R) => void
      onError?: (error: Error) => void
      rollbackOnError?: boolean
    }
  ) => {
    return executeOptimistic(updatedItem, 'update', serverAction, options)
  }, [executeOptimistic])

  const deleteOptimistic = React.useCallback(async <R>(
    itemToDelete: T,
    serverAction: () => Promise<R>,
    options?: {
      onSuccess?: (result: R) => void
      onError?: (error: Error) => void
      rollbackOnError?: boolean
    }
  ) => {
    return executeOptimistic(itemToDelete, 'delete', serverAction, options)
  }, [executeOptimistic])

  const rollbackAction = React.useCallback((actionId: string) => {
    dispatch({ type: 'ROLLBACK_OPTIMISTIC', payload: actionId })
  }, [])

  const clearPending = React.useCallback(() => {
    dispatch({ type: 'CLEAR_PENDING' })
  }, [])

  const isPending = React.useCallback((itemId: string): boolean => {
    return state.pendingActions.some(action => action.data.id === itemId)
  }, [state.pendingActions])

  const getPendingAction = React.useCallback((itemId: string): OptimisticAction<T> | undefined => {
    return state.pendingActions.find(action => action.data.id === itemId)
  }, [state.pendingActions])

  return {
    items: state.items,
    pendingActions: state.pendingActions,
    isLoading: state.isLoading,
    error: state.error,
    setLoading,
    setError,
    createOptimistic,
    updateOptimistic,
    deleteOptimistic,
    rollbackAction,
    clearPending,
    isPending,
    getPendingAction
  }
}

// Hook for simple optimistic state management
export function useOptimisticState<T>(
  initialValue: T,
  serverAction: (value: T) => Promise<T>
) {
  const [optimisticValue, setOptimisticValue] = React.useState(initialValue)
  const [actualValue, setActualValue] = React.useState(initialValue)
  const [isPending, setIsPending] = React.useState(false)
  const [error, setError] = React.useState<Error | null>(null)

  const updateOptimistic = React.useCallback(async (newValue: T) => {
    // Apply optimistic update immediately
    setOptimisticValue(newValue)
    setIsPending(true)
    setError(null)

    try {
      // Execute server action
      const result = await serverAction(newValue)
      
      // Update with server result
      setActualValue(result)
      setOptimisticValue(result)
    } catch (err) {
      // Rollback on error
      setOptimisticValue(actualValue)
      setError(err instanceof Error ? err : new Error('Unknown error'))
    } finally {
      setIsPending(false)
    }
  }, [actualValue, serverAction])

  // Update when initial value changes
  React.useEffect(() => {
    setOptimisticValue(initialValue)
    setActualValue(initialValue)
  }, [initialValue])

  return {
    value: optimisticValue,
    actualValue,
    isPending,
    error,
    update: updateOptimistic,
    reset: () => {
      setOptimisticValue(actualValue)
      setError(null)
    }
  }
}

// Utility for batch optimistic updates
export function useBatchOptimistic<T extends { id: string }>(
  initialItems: T[] = []
) {
  const optimistic = useOptimisticUpdates(initialItems)
  const [batchQueue, setBatchQueue] = React.useState<Array<{
    id: string
    item: T
    type: 'create' | 'update' | 'delete'
    serverAction: () => Promise<any>
  }>>([])

  const addToBatch = React.useCallback((
    item: T,
    type: 'create' | 'update' | 'delete',
    serverAction: () => Promise<any>
  ) => {
    const id = Math.random().toString(36).substr(2, 9)
    setBatchQueue(prev => [...prev, { id, item, type, serverAction }])
    
    // Apply optimistic update immediately
    const actionId = Math.random().toString(36).substr(2, 9)
    const originalData = type === 'update' || type === 'delete' 
      ? optimistic.items.find(i => i.id === item.id)
      : undefined

    // This would need to be implemented in the optimistic reducer
    // For now, we'll use the individual methods
    if (type === 'create') {
      optimistic.createOptimistic(item, serverAction)
    } else if (type === 'update') {
      optimistic.updateOptimistic(item, serverAction)
    } else if (type === 'delete') {
      optimistic.deleteOptimistic(item, serverAction)
    }
  }, [optimistic])

  const executeBatch = React.useCallback(async () => {
    if (batchQueue.length === 0) return

    const promises = batchQueue.map(({ serverAction }) => serverAction())
    
    try {
      await Promise.all(promises)
      setBatchQueue([])
    } catch (error) {
      // Handle batch error - could rollback all or handle individually
      console.error('Batch execution failed:', error)
    }
  }, [batchQueue])

  const clearBatch = React.useCallback(() => {
    setBatchQueue([])
  }, [])

  return {
    ...optimistic,
    batchQueue,
    addToBatch,
    executeBatch,
    clearBatch,
    hasPendingBatch: batchQueue.length > 0
  }
}