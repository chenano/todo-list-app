import { useAuthContext } from '@/contexts/AuthContext'

/**
 * Hook to get the current user session
 * Returns the session object and loading state
 */
export function useSession() {
  const { session, loading } = useAuthContext()
  
  return {
    session,
    loading,
    isAuthenticated: !!session,
  }
}