import React from 'react'
import { render, screen, act, waitFor } from '@testing-library/react'
import { AuthProvider, useAuthContext } from '../AuthContext'
import { createClient } from '@/lib/supabase/client'

// Mock the Supabase client
jest.mock('@/lib/supabase/client')

const mockSupabase = {
  auth: {
    getSession: jest.fn(),
    onAuthStateChange: jest.fn(),
    signInWithPassword: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    resetPasswordForEmail: jest.fn(),
  },
}

;(createClient as jest.Mock).mockReturnValue(mockSupabase)

// Test component that uses the auth context
function TestComponent() {
  const { user, loading, signIn } = useAuthContext()

  return (
    <div>
      <div data-testid="loading">{loading ? 'loading' : 'not loading'}</div>
      <div data-testid="user">{user ? user.email : 'no user'}</div>
      <button onClick={() => signIn('test@example.com', 'password')}>
        Sign In
      </button>
    </div>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Default mock implementations
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    })
    
    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    })
  })

  it('should provide auth context to children', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    // Initially should be loading
    expect(screen.getByTestId('loading')).toHaveTextContent('loading')
    expect(screen.getByTestId('user')).toHaveTextContent('no user')

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not loading')
    })
  })

  it('should throw error when used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      render(<TestComponent />)
    }).toThrow('useAuthContext must be used within an AuthProvider')

    consoleSpy.mockRestore()
  })

  it('should handle successful authentication', async () => {
    const mockUser = { id: '1', email: 'test@example.com' }
    const mockSession = { user: mockUser, access_token: 'token' }

    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: mockUser, session: mockSession },
      error: null,
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    // Wait for initial loading to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not loading')
    })

    // Click sign in button
    act(() => {
      screen.getByRole('button', { name: 'Sign In' }).click()
    })

    expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password',
    })
  })

  it('should update state when auth state changes', async () => {
    const mockUser = { id: '1', email: 'test@example.com' }
    const mockSession = { user: mockUser, access_token: 'token' }

    let authStateCallback: (event: string, session: any) => void

    mockSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
      authStateCallback = callback
      return { data: { subscription: { unsubscribe: jest.fn() } } }
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    // Wait for initial loading
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not loading')
    })

    // Simulate auth state change
    act(() => {
      authStateCallback('SIGNED_IN', mockSession)
    })

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('test@example.com')
    })
  })

  it('should handle session errors gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: { message: 'Session error' },
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not loading')
    })

    expect(consoleSpy).toHaveBeenCalledWith('Error getting session:', { message: 'Session error' })

    consoleSpy.mockRestore()
  })
})