import { useState, useEffect } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
}

interface AuthActions {
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<{ error: AuthError | null }>
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>
}

export function useAuth(): AuthState & AuthActions {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
  })

  const supabase = createClient()

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Error getting session:', error)
      }

      setState({
        user: session?.user ?? null,
        session,
        loading: false,
      })
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: any, session: Session | null) => {
        setState({
          user: session?.user ?? null,
          session,
          loading: false,
        })
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase.auth])

  const signIn = async (email: string, password: string) => {
    setState(prev => ({ ...prev, loading: true }))
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setState(prev => ({ ...prev, loading: false }))
    return { error }
  }

  const signUp = async (email: string, password: string) => {
    setState(prev => ({ ...prev, loading: true }))
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })

    setState(prev => ({ ...prev, loading: false }))
    return { error }
  }

  const signOut = async () => {
    setState(prev => ({ ...prev, loading: true }))
    
    const { error } = await supabase.auth.signOut()

    setState(prev => ({ ...prev, loading: false }))
    return { error }
  }

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    return { error }
  }

  return {
    ...state,
    signIn,
    signUp,
    signOut,
    resetPassword,
  }
}