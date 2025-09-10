import { createClient } from '@/lib/supabase/client'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { AuthError, User, Session } from '@supabase/supabase-js'

/**
 * Client-side authentication utilities
 */
export class AuthClient {
  private supabase = createClient()

  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    })

    return { data, error }
  }

  async signUp(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
    })

    return { data, error }
  }

  async signOut() {
    const { error } = await this.supabase.auth.signOut()
    return { error }
  }

  async resetPassword(email: string) {
    const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    return { error }
  }

  async updatePassword(password: string) {
    const { data, error } = await this.supabase.auth.updateUser({
      password,
    })

    return { data, error }
  }

  async getSession() {
    const { data, error } = await this.supabase.auth.getSession()
    return { session: data.session, error }
  }

  async getUser() {
    const { data, error } = await this.supabase.auth.getUser()
    return { user: data.user, error }
  }

  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    return this.supabase.auth.onAuthStateChange(callback)
  }
}

/**
 * Server-side authentication utilities
 */
export class AuthServer {
  private supabase = createServerSupabaseClient()

  async getSession() {
    const { data, error } = await this.supabase.auth.getSession()
    return { session: data.session, error }
  }

  async getUser() {
    const { data, error } = await this.supabase.auth.getUser()
    return { user: data.user, error }
  }
}

/**
 * Authentication error handling utilities
 */
export function getAuthErrorMessage(error: AuthError | null): string {
  if (!error) return ''

  switch (error.message) {
    case 'Invalid login credentials':
      return 'Invalid email or password. Please check your credentials and try again.'
    case 'Email not confirmed':
      return 'Please check your email and click the confirmation link before signing in.'
    case 'User already registered':
      return 'An account with this email already exists. Please sign in instead.'
    case 'Password should be at least 6 characters':
      return 'Password must be at least 8 characters long.'
    case 'Signup requires a valid password':
      return 'Please enter a valid password.'
    case 'Invalid email':
      return 'Please enter a valid email address.'
    case 'Email rate limit exceeded':
      return 'Too many requests. Please wait a moment before trying again.'
    default:
      return error.message || 'An unexpected error occurred. Please try again.'
  }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(user: User | null): boolean {
  return !!user
}

/**
 * Get user display name
 */
export function getUserDisplayName(user: User | null): string {
  if (!user) return ''
  return user.email || 'User'
}

/**
 * Check if session is valid and not expired
 */
export function isSessionValid(session: Session | null): boolean {
  if (!session) return false
  
  const now = Math.floor(Date.now() / 1000)
  return session.expires_at ? session.expires_at > now : false
}

/**
 * Create auth client instance
 */
export const authClient = new AuthClient()

/**
 * Create auth server instance
 */
export const authServer = new AuthServer()