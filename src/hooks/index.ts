// Authentication hooks
export { useAuth } from './useAuth'
export { useSession } from './useSession'
export { useUser } from './useUser'
export { useAuthActions } from './useAuthActions'

// List management hooks
export { 
  useLists, 
  useList, 
  useCreateList, 
  useUpdateList, 
  useDeleteList 
} from './useLists'

// Task management hooks
export {
  useTasks,
  useAllTasks,
  useTask,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
  useOverdueTasks
} from './useTasks'

// Utility hooks
export { useSwipeGesture } from './useSwipeGesture'
export { useTaskFilters } from './useTaskFilters'
export { useTaskFiltersURL } from './useTaskFiltersURL'

// Re-export auth context
export { useAuthContext, AuthProvider } from '@/contexts/AuthContext'