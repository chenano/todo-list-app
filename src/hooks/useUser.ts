import { useAuthContext } from '@/contexts/AuthContext'

/**
 * Hook to get the current authenticated user
 * Returns the user object and loading state
 */
export function useUser() {
  const { user, loading } = useAuthContext()
  
  return {
    user,
    loading,
    isAuthenticated: !!user,
    userId: user?.id,
    userEmail: user?.email,
  }
}