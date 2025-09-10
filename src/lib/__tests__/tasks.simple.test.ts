import { TaskService } from '../tasks';
import { createClient } from '../supabase/client';
import { TaskFormData } from '../validations';

// Mock the Supabase client
jest.mock('../supabase/client');

const mockSupabaseClient = {
  from: jest.fn(),
  auth: {
    getUser: jest.fn(),
  },
  channel: jest.fn(),
};

describe('TaskService', () => {
  let taskService: TaskService;
  let mockQuery: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create a mock query object that is both chainable and awaitable
    mockQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      lt: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      then: jest.fn(),
      catch: jest.fn(),
    };
    
    // Make it awaitable by implementing then/catch
    mockQuery.then.mockImplementation((resolve) => {
      return Promise.resolve({ data: [], error: null }).then(resolve);
    });

    (createClient as jest.Mock).mockReturnValue(mockSupabaseClient);
    mockSupabaseClient.from.mockReturnValue(mockQuery);
    taskService = new TaskService();
  });

  describe('getTasksByListId', () => {
    it('should fetch tasks for a specific list', async () => {
      const mockTasks = [
        {
          id: '1',
          list_id: 'list-1',
          user_id: 'user-1',
          title: 'Test Task',
          description: null,
          completed: false,
          priority: 'medium' as const,
          due_date: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      mockQuery.then.mockImplementation((resolve) => {
        return Promise.resolve({ data: mockTasks, error: null }).then(resolve);
      });

      const result = await taskService.getTasksByListId('list-1');

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('tasks');
      expect(mockQuery.select).toHaveBeenCalledWith('*');
      expect(mockQuery.eq).toHaveBeenCalledWith('list_id', 'list-1');
      expect(result.data).toEqual(mockTasks);
      expect(result.error).toBeNull();
    });

    it('should handle database errors', async () => {
      const mockError = { message: 'Database error', code: '500' };
      mockQuery.then.mockImplementation((resolve) => {
        return Promise.resolve({ data: null, error: mockError }).then(resolve);
      });

      const result = await taskService.getTasksByListId('list-1');

      expect(result.data).toBeNull();
      expect(result.error).toEqual({ message: 'Database error', code: '500' });
    });
  });

  describe('createTask', () => {
    it('should create a new task', async () => {
      const mockTaskData: TaskFormData = {
        title: 'New Task',
        description: 'Task description',
        priority: 'high',
        due_date: '2024-12-31',
      };

      const mockUser = { id: 'user-1' };
      const mockCreatedTask = {
        id: 'new-task-id',
        list_id: 'list-1',
        user_id: 'user-1',
        title: 'New Task',
        description: 'Task description',
        completed: false,
        priority: 'high' as const,
        due_date: '2024-12-31',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user: mockUser } });
      mockQuery.then.mockImplementation((resolve) => {
        return Promise.resolve({ data: mockCreatedTask, error: null }).then(resolve);
      });

      const result = await taskService.createTask('list-1', mockTaskData);

      expect(mockSupabaseClient.auth.getUser).toHaveBeenCalled();
      expect(mockQuery.insert).toHaveBeenCalledWith({
        list_id: 'list-1',
        user_id: 'user-1',
        title: 'New Task',
        description: 'Task description',
        priority: 'high',
        due_date: '2024-12-31',
        completed: false,
      });
      expect(result.data).toEqual(mockCreatedTask);
      expect(result.error).toBeNull();
    });

    it('should handle unauthenticated user', async () => {
      const mockTaskData: TaskFormData = {
        title: 'New Task',
        description: 'Task description',
        priority: 'high',
        due_date: '2024-12-31',
      };

      mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user: null } });

      const result = await taskService.createTask('list-1', mockTaskData);

      expect(result.data).toBeNull();
      expect(result.error).toEqual({ message: 'User not authenticated' });
    });
  });

  describe('updateTask', () => {
    it('should update a task', async () => {
      const mockUpdateData = {
        title: 'Updated Task',
        completed: true,
      };

      const mockUpdatedTask = {
        id: '1',
        list_id: 'list-1',
        user_id: 'user-1',
        title: 'Updated Task',
        description: null,
        completed: true,
        priority: 'medium' as const,
        due_date: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T12:00:00Z',
      };

      mockQuery.then.mockImplementation((resolve) => {
        return Promise.resolve({ data: mockUpdatedTask, error: null }).then(resolve);
      });

      const result = await taskService.updateTask('1', mockUpdateData);

      expect(mockQuery.update).toHaveBeenCalledWith({
        ...mockUpdateData,
        updated_at: expect.any(String),
      });
      expect(mockQuery.eq).toHaveBeenCalledWith('id', '1');
      expect(result.data).toEqual(mockUpdatedTask);
      expect(result.error).toBeNull();
    });
  });

  describe('deleteTask', () => {
    it('should delete a task', async () => {
      mockQuery.then.mockImplementation((resolve) => {
        return Promise.resolve({ error: null }).then(resolve);
      });

      const result = await taskService.deleteTask('1');

      expect(mockQuery.delete).toHaveBeenCalled();
      expect(mockQuery.eq).toHaveBeenCalledWith('id', '1');
      expect(result.error).toBeNull();
    });
  });

  describe('subscribeToTaskUpdates', () => {
    it('should set up real-time subscription', () => {
      const mockChannel = {
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn(),
      };
      mockSupabaseClient.channel.mockReturnValue(mockChannel);

      const callback = jest.fn();
      taskService.subscribeToTaskUpdates('list-1', callback);

      expect(mockSupabaseClient.channel).toHaveBeenCalledWith('tasks:list_id=eq.list-1');
      expect(mockChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: 'list_id=eq.list-1',
        },
        callback
      );
      expect(mockChannel.subscribe).toHaveBeenCalled();
    });
  });
});