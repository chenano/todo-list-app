import { AuthClient, AuthServer, getAuthErrorMessage, isAuthenticated, getUserDisplayName, isSessionValid } from '../auth'
import { createClient } from '@/lib/supabase/client'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { AuthError, User, Session } from '@supabase/supabase-js'

// Mock the Supabase clients
jest.mock('@/lib/supabase/client')
jest.mock('@/lib/supabase/server')

const mockClientSupabase = {
  auth: {
    signInWithPassword: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    resetPasswordForEmail: jest.fn(),
    updateUser: jest.fn(),
    getSession: jest.fn(),
    getUser: jest.fn(),
    onAuthStateChange: jest.fn(),
  },
}

const mockServerSupabase = {
  auth: {
    getSession: jest.fn(),
    getUser: jest.fn(),
  },
}

;(createClient as jest.Mock).mockReturnValue(mockClientSupabase)
;(createServerSupabaseClient as jest.Mock).mockReturnValue(mockServerSupabase)

describe('AuthClient', () => {
  let authClient: AuthClient

  beforeEach(() => {
    jest.clearAllMocks()
    authClient = new AuthClient()
  })

  describe('signIn', () => {
    it('should sign in successfully', async () => {
      const mockData = { user: { id: '1', email: 'test@example.com' }, session: {} }
      mockClientSupabase.auth.signInWithPassword.mockResolvedValue({
        data: mockData,
        error: null,
      })

      const result = await authClient.signIn('test@example.com', 'password')

      expect(result.data).toBe(mockData)
      expect(result.error).toBe(null)
      expect(mockClientSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password',
      })
    })

    it('should handle sign in error', async () => {
      const mockError = { message: 'Invalid credentials' } as AuthError
      mockClientSupabase.auth.signInWithPassword.mockResolvedValue({
        data: null,
        error: mockError,
      })

      const result = await authClient.signIn('test@example.com', 'wrongpassword')

      expect(result.error).toBe(mockError)
    })
  })

  describe('signUp', () => {
    it('should sign up successfully', async () => {
      const mockData = { user: { id: '1', email: 'test@example.com' }, session: null }
      mockClientSupabase.auth.signUp.mockResolvedValue({
        data: mockData,
        error: null,
      })

      const result = await authClient.signUp('test@example.com', 'password')

      expect(result.data).toBe(mockData)
      expect(result.error).toBe(null)
    })
  })

  describe('signOut', () => {
    it('should sign out successfully', async () => {
      mockClientSupabase.auth.signOut.mockResolvedValue({ error: null })

      const result = await authClient.signOut()

      expect(result.error).toBe(null)
    })
  })

  describe('resetPassword', () => {
    it('should send reset password email', async () => {
      // Mock window.location.origin
      Object.defineProperty(window, 'location', {
        value: { origin: 'http://localhost:3000' },
        writable: true,
      })

      mockClientSupabase.auth.resetPasswordForEmail.mockResolvedValue({ error: null })

      const result = await authClient.resetPassword('test@example.com')

      expect(result.error).toBe(null)
      expect(mockClientSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        'test@example.com',
        { redirectTo: 'http://localhost:3000/auth/reset-password' }
      )
    })
  })

  describe('updatePassword', () => {
    it('should update password successfully', async () => {
      const mockData = { user: { id: '1' } }
      mockClientSupabase.auth.updateUser.mockResolvedValue({
        data: mockData,
        error: null,
      })

      const result = await authClient.updatePassword('newpassword')

      expect(result.data).toBe(mockData)
      expect(result.error).toBe(null)
    })
  })

  describe('getSession', () => {
    it('should get current session', async () => {
      const mockSession = { user: { id: '1' }, access_token: 'token' }
      mockClientSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      })

      const result = await authClient.getSession()

      expect(result.session).toBe(mockSession)
      expect(result.error).toBe(null)
    })
  })

  describe('getUser', () => {
    it('should get current user', async () => {
      const mockUser = { id: '1', email: 'test@example.com' }
      mockClientSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const result = await authClient.getUser()

      expect(result.user).toBe(mockUser)
      expect(result.error).toBe(null)
    })
  })
})

describe('AuthServer', () => {
  let authServer: AuthServer

  beforeEach(() => {
    jest.clearAllMocks()
    authServer = new AuthServer()
  })

  describe('getSession', () => {
    it('should get server session', async () => {
      const mockSession = { user: { id: '1' }, access_token: 'token' }
      mockServerSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      })

      const result = await authServer.getSession()

      expect(result.session).toBe(mockSession)
      expect(result.error).toBe(null)
    })
  })

  describe('getUser', () => {
    it('should get server user', async () => {
      const mockUser = { id: '1', email: 'test@example.com' }
      mockServerSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const result = await authServer.getUser()

      expect(result.user).toBe(mockUser)
      expect(result.error).toBe(null)
    })
  })
})

describe('getAuthErrorMessage', () => {
  it('should return empty string for null error', () => {
    expect(getAuthErrorMessage(null)).toBe('')
  })

  it('should return specific message for known errors', () => {
    const error = { message: 'Invalid login credentials' } as AuthError
    expect(getAuthErrorMessage(error)).toBe(
      'Invalid email or password. Please check your credentials and try again.'
    )
  })

  it('should return original message for unknown errors', () => {
    const error = { message: 'Unknown error' } as AuthError
    expect(getAuthErrorMessage(error)).toBe('Unknown error')
  })

  it('should return default message for error without message', () => {
    const error = {} as AuthError
    expect(getAuthErrorMessage(error)).toBe('An unexpected error occurred. Please try again.')
  })
})

describe('isAuthenticated', () => {
  it('should return true for valid user', () => {
    const user = { id: '1', email: 'test@example.com' } as User
    expect(isAuthenticated(user)).toBe(true)
  })

  it('should return false for null user', () => {
    expect(isAuthenticated(null)).toBe(false)
  })
})

describe('getUserDisplayName', () => {
  it('should return email for user with email', () => {
    const user = { id: '1', email: 'test@example.com' } as User
    expect(getUserDisplayName(user)).toBe('test@example.com')
  })

  it('should return "User" for user without email', () => {
    const user = { id: '1' } as User
    expect(getUserDisplayName(user)).toBe('User')
  })

  it('should return empty string for null user', () => {
    expect(getUserDisplayName(null)).toBe('')
  })
})

describe('isSessionValid', () => {
  it('should return true for valid session', () => {
    const futureTimestamp = Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
    const session = { expires_at: futureTimestamp } as Session
    expect(isSessionValid(session)).toBe(true)
  })

  it('should return false for expired session', () => {
    const pastTimestamp = Math.floor(Date.now() / 1000) - 3600 // 1 hour ago
    const session = { expires_at: pastTimestamp } as Session
    expect(isSessionValid(session)).toBe(false)
  })

  it('should return false for session without expires_at', () => {
    const session = {} as Session
    expect(isSessionValid(session)).toBe(false)
  })

  it('should return false for null session', () => {
    expect(isSessionValid(null)).toBe(false)
  })
})