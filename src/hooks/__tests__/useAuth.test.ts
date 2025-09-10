import { renderHook, act, waitFor } from '@testing-library/react'
import { useAuth } from '../useAuth'
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

describe('useAuth', () => {
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

  it('should initialize with loading state', () => {
    const { result } = renderHook(() => useAuth())

    expect(result.current.loading).toBe(true)
    expect(result.current.user).toBe(null)
    expect(result.current.session).toBe(null)
  })

  it('should handle successful sign in', async () => {
    const mockUser = { id: '1', email: 'test@example.com' }
    const mockSession = { user: mockUser, access_token: 'token' }

    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: mockUser, session: mockSession },
      error: null,
    })

    const { result } = renderHook(() => useAuth())

    await act(async () => {
      const response = await result.current.signIn('test@example.com', 'password')
      expect(response.error).toBe(null)
    })

    expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password',
    })
  })

  it('should handle sign in error', async () => {
    const mockError = { message: 'Invalid credentials' }

    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: mockError,
    })

    const { result } = renderHook(() => useAuth())

    await act(async () => {
      const response = await result.current.signIn('test@example.com', 'wrongpassword')
      expect(response.error).toBe(mockError)
    })
  })

  it('should handle successful sign up', async () => {
    const mockUser = { id: '1', email: 'test@example.com' }

    mockSupabase.auth.signUp.mockResolvedValue({
      data: { user: mockUser, session: null },
      error: null,
    })

    const { result } = renderHook(() => useAuth())

    await act(async () => {
      const response = await result.current.signUp('test@example.com', 'password')
      expect(response.error).toBe(null)
    })

    expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password',
    })
  })

  it('should handle sign out', async () => {
    mockSupabase.auth.signOut.mockResolvedValue({
      error: null,
    })

    const { result } = renderHook(() => useAuth())

    await act(async () => {
      const response = await result.current.signOut()
      expect(response.error).toBe(null)
    })

    expect(mockSupabase.auth.signOut).toHaveBeenCalled()
  })

  it('should handle password reset', async () => {
    mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({
      error: null,
    })

    // Mock window.location.origin
    Object.defineProperty(window, 'location', {
      value: { origin: 'http://localhost:3000' },
      writable: true,
    })

    const { result } = renderHook(() => useAuth())

    await act(async () => {
      const response = await result.current.resetPassword('test@example.com')
      expect(response.error).toBe(null)
    })

    expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
      'test@example.com',
      { redirectTo: 'http://localhost:3000/auth/reset-password' }
    )
  })

  it('should update state when auth state changes', async () => {
    const mockUser = { id: '1', email: 'test@example.com' }
    const mockSession = { user: mockUser, access_token: 'token' }

    let authStateCallback: (event: string, session: any) => void

    mockSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
      authStateCallback = callback
      return { data: { subscription: { unsubscribe: jest.fn() } } }
    })

    const { result } = renderHook(() => useAuth())

    // Simulate auth state change
    act(() => {
      authStateCallback('SIGNED_IN', mockSession)
    })

    await waitFor(() => {
      expect(result.current.user).toBe(mockUser)
      expect(result.current.session).toBe(mockSession)
      expect(result.current.loading).toBe(false)
    })
  })

  it('should cleanup subscription on unmount', () => {
    const mockUnsubscribe = jest.fn()
    
    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: mockUnsubscribe } },
    })

    const { unmount } = renderHook(() => useAuth())

    unmount()

    expect(mockUnsubscribe).toHaveBeenCalled()
  })
})