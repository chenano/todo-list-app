import { useAuthContext } from '@/contexts/AuthContext'

/**
 * Hook to get authentication actions
 * Returns sign in, sign up, sign out, and reset password functions
 */
export function useAuthActions() {
  const { signIn, signUp, signOut, resetPassword, loading } = useAuthContext()
  
  return {
    signIn,
    signUp,
    signOut,
    resetPassword,
    loading,
  }
}