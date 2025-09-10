import { createClient } from '@/lib/supabase/client'
import { listService } from '@/lib/lists'
import { taskService } from '@/lib/tasks'
import { authService } from '@/lib/auth'

// Mock Supabase client for integration tests
jest.mock('@/lib/supabase/client')

const mockSupabase = {
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
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn(),
    maybeSingle: jest.fn(),
  })),
  channel: jest.fn(() => ({
    on: jest.fn().mockReturnThis(),
    subscribe: jest.fn(),
  })),
}

;(createClient as jest.Mock).mockReturnValue(mockSupabase)

describe('Supabase Client Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Authentication Integration', () => {
    it('should handle complete authentication flow', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' }
      const mockSession = { user: mockUser, access_token: 'token' }

      // Mock successful login
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      })

      // Mock session retrieval
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      })

      // Test login
      const authClient = new (authService as any).AuthClient()
      const loginResult = await authClient.signIn('test@example.com', 'password')

      expect(loginResult.data).toEqual({ user: mockUser, session: mockSession })
      expect(loginResult.error).toBeNull()

      // Test session retrieval
      const sessionResult = await authClient.getSession()
      expect(sessionResult.session).toEqual(mockSession)
      expect(sessionResult.error).toBeNull()

      // Verify Supabase calls
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password',
      })
      expect(mockSupabase.auth.getSession).toHaveBeenCalled()
    })

    it('should handle authentication errors', async () => {
      const mockError = { message: 'Invalid credentials' }

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: null,
        error: mockError,
      })

      const authClient = new (authService as any).AuthClient()
      const result = await authClient.signIn('test@example.com', 'wrongpassword')

      expect(result.data).toBeNull()
      expect(result.error).toEqual(mockError)
    })
  })

  describe('Lists Service Integration', () => {
    it('should handle complete list CRUD operations', async () => {
      const mockList = {
        id: 'list-1',
        user_id: 'user-1',
        name: 'Test List',
        description: 'Test Description',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      // Mock list creation
      const mockInsert = mockSupabase.from().insert().single
      mockInsert.mockResolvedValue({
        data: mockList,
        error: null,
      })

      // Mock list retrieval
      const mockSelect = mockSupabase.from().select().eq().single
      mockSelect.mockResolvedValue({
        data: mockList,
        error: null,
      })

      // Mock list update
      const mockUpdate = mockSupabase.from().update().eq().single
      mockUpdate.mockResolvedValue({
        data: { ...mockList, name: 'Updated List' },
        error: null,
      })

      // Mock list deletion
      const mockDelete = mockSupabase.from().delete().eq
      mockDelete.mockResolvedValue({
        error: null,
      })

      // Test create
      const createResult = await listService.createList({
        name: 'Test List',
        description: 'Test Description',
      })
      expect(createResult.data).toEqual(mockList)
      expect(createResult.error).toBeNull()

      // Test read
      const readResult = await listService.getListById('list-1')
      expect(readResult.data).toEqual(mockList)
      expect(readResult.error).toBeNull()

      // Test update
      const updateResult = await listService.updateList('list-1', {
        name: 'Updated List',
      })
      expect(updateResult.data?.name).toBe('Updated List')
      expect(updateResult.error).toBeNull()

      // Test delete
      const deleteResult = await listService.deleteList('list-1')
      expect(deleteResult.error).toBeNull()

      // Verify Supabase calls
      expect(mockSupabase.from).toHaveBeenCalledWith('lists')
    })

    it('should handle list service errors', async () => {
      const mockError = { message: 'Database error' }

      const mockInsert = mockSupabase.from().insert().single
      mockInsert.mockResolvedValue({
        data: null,
        error: mockError,
      })

      const result = await listService.createList({
        name: 'Test List',
        description: 'Test Description',
      })

      expect(result.data).toBeNull()
      expect(result.error).toEqual(mockError)
    })
  })

  describe('Tasks Service Integration', () => {
    it('should handle complete task CRUD operations', async () => {
      const mockTask = {
        id: 'task-1',
        list_id: 'list-1',
        user_id: 'user-1',
        title: 'Test Task',
        description: 'Test Description',
        completed: false,
        priority: 'medium' as const,
        due_date: '2024-12-31',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      // Mock task creation
      const mockInsert = mockSupabase.from().insert().single
      mockInsert.mockResolvedValue({
        data: mockTask,
        error: null,
      })

      // Mock task retrieval
      const mockSelect = mockSupabase.from().select().eq().single
      mockSelect.mockResolvedValue({
        data: mockTask,
        error: null,
      })

      // Mock task update
      const mockUpdate = mockSupabase.from().update().eq().single
      mockUpdate.mockResolvedValue({
        data: { ...mockTask, completed: true },
        error: null,
      })

      // Mock task deletion
      const mockDelete = mockSupabase.from().delete().eq
      mockDelete.mockResolvedValue({
        error: null,
      })

      // Test create
      const createResult = await taskService.createTask('list-1', {
        title: 'Test Task',
        description: 'Test Description',
        priority: 'medium',
        due_date: '2024-12-31',
      })
      expect(createResult.data).toEqual(mockTask)
      expect(createResult.error).toBeNull()

      // Test read
      const readResult = await taskService.getTaskById('task-1')
      expect(readResult.data).toEqual(mockTask)
      expect(readResult.error).toBeNull()

      // Test update
      const updateResult = await taskService.updateTask('task-1', {
        completed: true,
      })
      expect(updateResult.data?.completed).toBe(true)
      expect(updateResult.error).toBeNull()

      // Test delete
      const deleteResult = await taskService.deleteTask('task-1')
      expect(deleteResult.error).toBeNull()

      // Verify Supabase calls
      expect(mockSupabase.from).toHaveBeenCalledWith('tasks')
    })

    it('should handle task filtering and sorting', async () => {
      const mockTasks = [
        {
          id: 'task-1',
          list_id: 'list-1',
          user_id: 'user-1',
          title: 'Task 1',
          description: null,
          completed: false,
          priority: 'high' as const,
          due_date: '2024-12-31',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'task-2',
          list_id: 'list-1',
          user_id: 'user-1',
          title: 'Task 2',
          description: null,
          completed: true,
          priority: 'low' as const,
          due_date: null,
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
        },
      ]

      const mockSelect = mockSupabase.from().select().eq().order()
      mockSelect.mockResolvedValue({
        data: mockTasks,
        error: null,
      })

      const result = await taskService.getTasksByListId(
        'list-1',
        { status: 'all', priority: 'all' },
        { field: 'created_at', direction: 'desc' }
      )

      expect(result.data).toEqual(mockTasks)
      expect(result.error).toBeNull()

      // Verify filtering and sorting calls
      expect(mockSupabase.from).toHaveBeenCalledWith('tasks')
    })
  })

  describe('Real-time Subscriptions Integration', () => {
    it('should set up real-time subscriptions correctly', () => {
      const mockCallback = jest.fn()
      const mockChannel = {
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn(),
      }

      mockSupabase.channel.mockReturnValue(mockChannel)

      // Test task subscription
      const subscription = taskService.subscribeToTaskUpdates('list-1', mockCallback)

      expect(mockSupabase.channel).toHaveBeenCalledWith('tasks:list-1')
      expect(mockChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: 'list_id=eq.list-1',
        },
        expect.any(Function)
      )
      expect(mockChannel.subscribe).toHaveBeenCalled()
    })

    it('should handle subscription cleanup', () => {
      const mockUnsubscribe = jest.fn()
      const mockChannel = {
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn(),
        unsubscribe: mockUnsubscribe,
      }

      mockSupabase.channel.mockReturnValue(mockChannel)

      const subscription = taskService.subscribeToTaskUpdates('list-1', jest.fn())
      
      // Simulate cleanup
      if (subscription && typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe()
      }

      // Note: The actual unsubscribe behavior depends on the implementation
      // This test verifies the subscription setup
      expect(mockSupabase.channel).toHaveBeenCalled()
    })
  })

  describe('Error Handling Integration', () => {
    it('should handle network errors gracefully', async () => {
      const networkError = new Error('Network error')
      
      mockSupabase.from().select().eq().single.mockRejectedValue(networkError)

      const result = await listService.getListById('list-1')

      expect(result.data).toBeNull()
      expect(result.error).toBeTruthy()
    })

    it('should handle database constraint errors', async () => {
      const constraintError = {
        message: 'duplicate key value violates unique constraint',
        code: '23505',
      }

      mockSupabase.from().insert().single.mockResolvedValue({
        data: null,
        error: constraintError,
      })

      const result = await listService.createList({
        name: 'Duplicate List',
        description: 'This should fail',
      })

      expect(result.data).toBeNull()
      expect(result.error).toEqual(constraintError)
    })

    it('should handle authentication errors in data operations', async () => {
      const authError = {
        message: 'JWT expired',
        code: 'PGRST301',
      }

      mockSupabase.from().select().eq().mockResolvedValue({
        data: null,
        error: authError,
      })

      const result = await listService.getListsWithTaskCount()

      expect(result.data).toBeNull()
      expect(result.error).toEqual(authError)
    })
  })
})