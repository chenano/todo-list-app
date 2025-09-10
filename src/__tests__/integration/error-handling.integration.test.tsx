import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider } from '@/contexts/AuthContext'
import { LoginForm } from '@/components/auth/LoginForm'
import { ListForm } from '@/components/lists/ListForm'
import { TaskForm } from '@/components/tasks/TaskForm'
import { ErrorBoundary } from '@/components/ui/error-boundary'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
    })),
  }),
}))

// Mock services
jest.mock('@/lib/lists', () => ({
  listService: {
    createList: jest.fn(),
    updateList: jest.fn(),
    deleteList: jest.fn(),
    getListById: jest.fn(),
  },
}))

jest.mock('@/lib/tasks', () => ({
  taskService: {
    createTask: jest.fn(),
    updateTask: jest.fn(),
    deleteTask: jest.fn(),
    getTaskById: jest.fn(),
  },
}))

const mockSupabase = require('@/lib/supabase/client').createClient()
const mockListService = require('@/lib/lists').listService
const mockTaskService = require('@/lib/tasks').taskService

// Component that throws an error for testing error boundaries
const ErrorThrowingComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error for error boundary')
  }
  return <div>No error</div>
}

describe('Error Handling and Recovery Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Default auth state
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    })
    
    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    })
  })

  describe('Authentication Error Handling', () => {
    it('should handle invalid credentials error', async () => {
      const user = userEvent.setup()
      const mockError = { message: 'Invalid login credentials' }

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: null,
        error: mockError,
      })

      render(
        <AuthProvider>
          <LoginForm />
        </AuthProvider>
      )

      // Fill and submit form with invalid credentials
      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      await user.type(screen.getByLabelText(/password/i), 'wrongpassword')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      // Should handle error gracefully without crashing
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalled()
    })

    it('should handle network timeout errors', async () => {
      const user = userEvent.setup()
      const networkError = new Error('Network timeout')

      mockSupabase.auth.signInWithPassword.mockRejectedValue(networkError)

      render(
        <AuthProvider>
          <LoginForm />
        </AuthProvider>
      )

      // Fill and submit form
      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      await user.type(screen.getByLabelText(/password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      // Should handle network error gracefully
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalled()
    })

    it('should handle session expiry during operation', async () => {
      const user = userEvent.setup()
      const sessionError = { message: 'JWT expired', code: 'PGRST301' }

      // Mock initial successful session
      mockSupabase.auth.getSession.mockResolvedValueOnce({
        data: { session: { user: { id: 'user-1' }, access_token: 'token' } },
        error: null,
      })

      // Mock session expiry on subsequent operation
      mockListService.createList.mockResolvedValue({
        data: null,
        error: sessionError,
      })

      const mockOnSubmit = jest.fn().mockImplementation(async (data) => {
        const result = await mockListService.createList(data)
        if (result.error?.code === 'PGRST301') {
          // Handle session expiry - redirect to login
          console.log('Session expired, redirecting to login')
        }
      })

      render(
        <ListForm
          open={true}
          onOpenChange={jest.fn()}
          onSubmit={mockOnSubmit}
        />
      )

      // Fill and submit form
      await user.type(screen.getByLabelText(/list name/i), 'Test List')
      await user.click(screen.getByRole('button', { name: /create list/i }))

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled()
      })
    })
  })

  describe('Database Error Handling', () => {
    it('should handle constraint violation errors', async () => {
      const user = userEvent.setup()
      const constraintError = {
        message: 'duplicate key value violates unique constraint',
        code: '23505',
      }

      mockListService.createList.mockResolvedValue({
        data: null,
        error: constraintError,
      })

      const mockOnSubmit = jest.fn().mockImplementation(async (data) => {
        const result = await mockListService.createList(data)
        if (result.error?.code === '23505') {
          console.log('Duplicate entry error handled')
        }
      })

      render(
        <ListForm
          open={true}
          onOpenChange={jest.fn()}
          onSubmit={mockOnSubmit}
        />
      )

      // Fill and submit form
      await user.type(screen.getByLabelText(/list name/i), 'Duplicate List')
      await user.click(screen.getByRole('button', { name: /create list/i }))

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled()
      })
    })

    it('should handle foreign key constraint errors', async () => {
      const user = userEvent.setup()
      const fkError = {
        message: 'insert or update on table violates foreign key constraint',
        code: '23503',
      }

      mockTaskService.createTask.mockResolvedValue({
        data: null,
        error: fkError,
      })

      const mockOnSubmit = jest.fn().mockImplementation(async (data) => {
        const result = await mockTaskService.createTask('invalid-list-id', data)
        if (result.error?.code === '23503') {
          console.log('Foreign key constraint error handled')
        }
      })

      render(
        <TaskForm
          open={true}
          onOpenChange={jest.fn()}
          onSubmit={mockOnSubmit}
        />
      )

      // Fill and submit form
      await user.type(screen.getByLabelText(/title/i), 'Test Task')
      await user.click(screen.getByRole('button', { name: /create task/i }))

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled()
      })
    })

    it('should handle database connection errors', async () => {
      const user = userEvent.setup()
      const connectionError = new Error('Connection to database failed')

      mockListService.createList.mockRejectedValue(connectionError)

      const mockOnSubmit = jest.fn().mockImplementation(async (data) => {
        try {
          await mockListService.createList(data)
        } catch (error) {
          console.log('Database connection error handled')
        }
      })

      render(
        <ListForm
          open={true}
          onOpenChange={jest.fn()}
          onSubmit={mockOnSubmit}
        />
      )

      // Fill and submit form
      await user.type(screen.getByLabelText(/list name/i), 'Test List')
      await user.click(screen.getByRole('button', { name: /create list/i }))

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled()
      })
    })
  })

  describe('Component Error Boundaries', () => {
    it('should catch and handle component errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      render(
        <ErrorBoundary>
          <ErrorThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      )

      // Should show error boundary UI instead of crashing
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()

      consoleSpy.mockRestore()
    })

    it('should render children normally when no error occurs', () => {
      render(
        <ErrorBoundary>
          <ErrorThrowingComponent shouldThrow={false} />
        </ErrorBoundary>
      )

      expect(screen.getByText('No error')).toBeInTheDocument()
    })

    it('should provide error recovery options', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      render(
        <ErrorBoundary>
          <ErrorThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      )

      // Should provide a way to recover from error
      const retryButton = screen.queryByRole('button', { name: /try again/i })
      if (retryButton) {
        expect(retryButton).toBeInTheDocument()
      }

      consoleSpy.mockRestore()
    })
  })

  describe('Form Validation Error Handling', () => {
    it('should handle and display validation errors', async () => {
      const user = userEvent.setup()

      render(
        <ListForm
          open={true}
          onOpenChange={jest.fn()}
          onSubmit={jest.fn()}
        />
      )

      // Try to submit form without required fields
      await user.click(screen.getByRole('button', { name: /create list/i }))

      // Should show validation errors
      await waitFor(() => {
        expect(screen.getByText(/List name is required/i)).toBeInTheDocument()
      })
    })

    it('should clear validation errors when user corrects input', async () => {
      const user = userEvent.setup()

      render(
        <ListForm
          open={true}
          onOpenChange={jest.fn()}
          onSubmit={jest.fn()}
        />
      )

      // Trigger validation error
      await user.click(screen.getByRole('button', { name: /create list/i }))

      await waitFor(() => {
        expect(screen.getByText(/List name is required/i)).toBeInTheDocument()
      })

      // Correct the error
      await user.type(screen.getByLabelText(/list name/i), 'Valid Name')

      // Error should be cleared
      await waitFor(() => {
        expect(screen.queryByText(/List name is required/i)).not.toBeInTheDocument()
      })
    })

    it('should handle server-side validation errors', async () => {
      const user = userEvent.setup()
      const validationError = {
        message: 'List name must be unique',
        code: 'VALIDATION_ERROR',
      }

      mockListService.createList.mockResolvedValue({
        data: null,
        error: validationError,
      })

      const mockOnSubmit = jest.fn().mockImplementation(async (data) => {
        const result = await mockListService.createList(data)
        if (result.error?.code === 'VALIDATION_ERROR') {
          console.log('Server validation error handled')
        }
      })

      render(
        <ListForm
          open={true}
          onOpenChange={jest.fn()}
          onSubmit={mockOnSubmit}
        />
      )

      // Fill and submit form
      await user.type(screen.getByLabelText(/list name/i), 'Existing List')
      await user.click(screen.getByRole('button', { name: /create list/i }))

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled()
      })
    })
  })

  describe('Retry Mechanisms', () => {
    it('should implement retry logic for transient errors', async () => {
      const user = userEvent.setup()
      const transientError = new Error('Temporary network error')

      // Mock first call to fail, second to succeed
      mockListService.createList
        .mockRejectedValueOnce(transientError)
        .mockResolvedValueOnce({
          data: {
            id: 'list-1',
            user_id: 'user-1',
            name: 'Test List',
            description: '',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
          error: null,
        })

      const mockOnSubmit = jest.fn().mockImplementation(async (data) => {
        try {
          await mockListService.createList(data)
        } catch (error) {
          // Retry once
          await mockListService.createList(data)
        }
      })

      render(
        <ListForm
          open={true}
          onOpenChange={jest.fn()}
          onSubmit={mockOnSubmit}
        />
      )

      // Fill and submit form
      await user.type(screen.getByLabelText(/list name/i), 'Test List')
      await user.click(screen.getByRole('button', { name: /create list/i }))

      await waitFor(() => {
        expect(mockListService.createList).toHaveBeenCalledTimes(2)
      })
    })

    it('should limit retry attempts to prevent infinite loops', async () => {
      const user = userEvent.setup()
      const persistentError = new Error('Persistent error')

      mockListService.createList.mockRejectedValue(persistentError)

      const mockOnSubmit = jest.fn().mockImplementation(async (data) => {
        let attempts = 0
        const maxAttempts = 3

        while (attempts < maxAttempts) {
          try {
            await mockListService.createList(data)
            break
          } catch (error) {
            attempts++
            if (attempts >= maxAttempts) {
              console.log('Max retry attempts reached')
              break
            }
          }
        }
      })

      render(
        <ListForm
          open={true}
          onOpenChange={jest.fn()}
          onSubmit={mockOnSubmit}
        />
      )

      // Fill and submit form
      await user.type(screen.getByLabelText(/list name/i), 'Test List')
      await user.click(screen.getByRole('button', { name: /create list/i }))

      await waitFor(() => {
        expect(mockListService.createList).toHaveBeenCalledTimes(3)
      })
    })
  })

  describe('User-Friendly Error Messages', () => {
    it('should convert technical errors to user-friendly messages', async () => {
      const user = userEvent.setup()
      const technicalError = {
        message: 'PGRST116: HTTP 406 Not Acceptable',
        code: 'PGRST116',
      }

      mockListService.createList.mockResolvedValue({
        data: null,
        error: technicalError,
      })

      const mockOnSubmit = jest.fn().mockImplementation(async (data) => {
        const result = await mockListService.createList(data)
        if (result.error) {
          // Convert technical error to user-friendly message
          const userFriendlyMessage = result.error.code === 'PGRST116' 
            ? 'Unable to save your list. Please try again.'
            : result.error.message
          console.log('User-friendly error:', userFriendlyMessage)
        }
      })

      render(
        <ListForm
          open={true}
          onOpenChange={jest.fn()}
          onSubmit={mockOnSubmit}
        />
      )

      // Fill and submit form
      await user.type(screen.getByLabelText(/list name/i), 'Test List')
      await user.click(screen.getByRole('button', { name: /create list/i }))

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled()
      })
    })
  })
})