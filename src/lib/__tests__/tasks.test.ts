import { TaskService } from '../tasks';
import { createClient } from '../supabase/client';
import { TaskFormData, TaskUpdateData } from '../validations';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'yargs';
import { it } from 'node:test';
import { describe } from 'yargs';
import { it } from 'node:test';
import { describe } from 'yargs';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'yargs';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'yargs';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'yargs';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'yargs';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'yargs';
import { it } from 'node:test';
import { describe } from 'yargs';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'yargs';
import { beforeEach } from 'node:test';
import { describe } from 'yargs';
import { it } from 'node:test';
import { expect } from 'playwright/test';
import { expect } from 'playwright/test';
import { expect } from 'playwright/test';
import { expect } from 'playwright/test';
import { expect } from 'playwright/test';
import { expect } from 'playwright/test';
import { expect } from 'playwright/test';
import { expect } from 'playwright/test';
import { expect } from 'playwright/test';
import { expect } from 'playwright/test';
import { expect } from 'playwright/test';
import { expect } from 'playwright/test';
import { expect } from 'playwright/test';
import { expect } from 'playwright/test';
import { expect } from 'playwright/test';
import { expect } from 'playwright/test';
import { expect } from 'playwright/test';
import { expect } from 'playwright/test';
import { expect } from 'playwright/test';
import { expect } from 'playwright/test';
import { expect } from 'playwright/test';
import { expect } from 'playwright/test';
import { expect } from 'playwright/test';
import { expect } from 'playwright/test';
import { expect } from 'playwright/test';
import { expect } from 'playwright/test';
import { expect } from 'playwright/test';
import { expect } from 'playwright/test';
import { expect } from 'playwright/test';
import { expect } from 'playwright/test';
import { expect } from 'playwright/test';
import { expect } from 'playwright/test';
import { expect } from 'playwright/test';
import { expect } from 'playwright/test';
import { expect } from 'playwright/test';
import { expect } from 'playwright/test';
import { expect } from 'playwright/test';
import { expect } from 'playwright/test';
import { expect } from 'playwright/test';
import { expect } from 'playwright/test';
import { expect } from 'playwright/test';
import { expect } from 'playwright/test';
import { expect } from 'playwright/test';
import { expect } from 'playwright/test';
import { expect } from 'playwright/test';
import { expect } from 'playwright/test';
import { expect } from 'playwright/test';
import { expect } from 'playwright/test';
import { expect } from 'playwright/test';
import { expect } from 'playwright/test';
import { expect } from 'playwright/test';
import { expect } from 'playwright/test';
import { expect } from 'playwright/test';
import { expect } from 'playwright/test';
import { expect } from 'playwright/test';
import { expect } from 'playwright/test';
import { expect } from 'playwright/test';
import { expect } from 'playwright/test';
import { expect } from 'playwright/test';
import { expect } from 'playwright/test';
import { expect } from 'playwright/test';
import { expect } from 'playwright/test';
import { expect } from 'playwright/test';
import { expect } from 'playwright/test';
import { expect } from 'playwright/test';
import { expect } from 'playwright/test';
import { expect } from 'playwright/test';
import { expect } from 'playwright/test';
import { expect } from 'playwright/test';
import { expect } from 'playwright/test';
import { expect } from 'playwright/test';
import { expect } from 'playwright/test';

// Mock the Supabase client
jest.mock('../supabase/client');

const mockSupabaseClient = {
  from: jest.fn(),
  auth: {
    getUser: jest.fn(),
  },
  channel: jest.fn(),
};

const createMockQuery = () => {
  const mockQuery = jest.fn();
  mockQuery.select = jest.fn().mockReturnValue(mockQuery);
  mockQuery.eq = jest.fn().mockReturnValue(mockQuery);
  mockQuery.lt = jest.fn().mockReturnValue(mockQuery);
  mockQuery.order = jest.fn().mockReturnValue(mockQuery);
  mockQuery.insert = jest.fn().mockReturnValue(mockQuery);
  mockQuery.update = jest.fn().mockReturnValue(mockQuery);
  mockQuery.delete = jest.fn().mockReturnValue(mockQuery);
  mockQuery.single = jest.fn().mockReturnValue(mockQuery);
  return mockQuery;
};

describe('TaskService', () => {
  let taskService: TaskService;
  let mockQuery: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockQuery = createMockQuery();
    (createClient as jest.Mock).mockReturnValue(mockSupabaseClient);
    mockSupabaseClient.from.mockReturnValue(mockQuery);
    taskService = new TaskService();
  });

  describe('getTasksByListId', () => {
    const mockTasks = [
      {
        id: '1',
        list_id: 'list-1',
        user_id: 'user-1',
        title: 'Test Task 1',
        description: 'Description 1',
        completed: false,
        priority: 'medium' as const,
        due_date: '2024-12-31',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
      {
        id: '2',
        list_id: 'list-1',
        user_id: 'user-1',
        title: 'Test Task 2',
        description: null,
        completed: true,
        priority: 'high' as const,
        due_date: null,
        created_at: '2024-01-02T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      },
    ];

    it('should fetch tasks for a specific list', async () => {
      mockQuery.mockResolvedValue({ data: mockTasks, error: null });

      const result = await taskService.getTasksByListId('list-1');

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('tasks');
      expect(mockQuery.select).toHaveBeenCalledWith('*');
      expect(mockQuery.eq).toHaveBeenCalledWith('list_id', 'list-1');
      expect(mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(result).toEqual({ data: mockTasks, error: null });
    });

    it('should apply status filter for completed tasks', async () => {
      mockQuery.mockResolvedValue({ data: [mockTasks[1]], error: null });

      const result = await taskService.getTasksByListId('list-1', { status: 'completed' });

      expect(mockQuery.eq).toHaveBeenCalledWith('list_id', 'list-1');
      expect(mockQuery.eq).toHaveBeenCalledWith('completed', true);
      expect(result).toEqual({ data: [mockTasks[1]], error: null });
    });

    it('should apply status filter for incomplete tasks', async () => {
      mockQuery.mockResolvedValue({ data: [mockTasks[0]], error: null });

      const result = await taskService.getTasksByListId('list-1', { status: 'incomplete' });

      expect(mockQuery.eq).toHaveBeenCalledWith('completed', false);
      expect(result).toEqual({ data: [mockTasks[0]], error: null });
    });

    it('should apply priority filter', async () => {
      mockQuery.mockResolvedValue({ data: [mockTasks[1]], error: null });

      const result = await taskService.getTasksByListId('list-1', { priority: 'high' });

      expect(mockQuery.eq).toHaveBeenCalledWith('priority', 'high');
      expect(result).toEqual({ data: [mockTasks[1]], error: null });
    });

    it('should apply overdue filter', async () => {
      const today = new Date().toISOString().split('T')[0];
      mockQuery.mockResolvedValue({ data: [], error: null });

      await taskService.getTasksByListId('list-1', { overdue: true });

      expect(mockQuery.lt).toHaveBeenCalledWith('due_date', today);
      expect(mockQuery.eq).toHaveBeenCalledWith('completed', false);
    });

    it('should apply custom sorting', async () => {
      mockQuery.mockResolvedValue({ data: mockTasks, error: null });

      await taskService.getTasksByListId('list-1', {}, { field: 'due_date', direction: 'asc' });

      expect(mockQuery.order).toHaveBeenCalledWith('due_date', { ascending: true });
    });

    it('should handle database errors', async () => {
      const mockError = { message: 'Database error', code: '500' };
      mockQuery.mockResolvedValue({ data: null, error: mockError });

      const result = await taskService.getTasksByListId('list-1');

      expect(result).toEqual({
        data: null,
        error: { message: 'Database error', code: '500' },
      });
    });

    it('should handle exceptions', async () => {
      mockQuery.mockRejectedValue(new Error('Network error'));

      const result = await taskService.getTasksByListId('list-1');

      expect(result).toEqual({
        data: null,
        error: { message: 'Failed to fetch tasks', details: 'Error: Network error' },
      });
    });
  });

  describe('getAllUserTasks', () => {
    it('should fetch all user tasks without list filter', async () => {
      const mockTasks = [
        {
          id: '1',
          list_id: 'list-1',
          user_id: 'user-1',
          title: 'Task 1',
          description: null,
          completed: false,
          priority: 'medium' as const,
          due_date: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      mockQuery.mockResolvedValue({ data: mockTasks, error: null });

      const result = await taskService.getAllUserTasks();

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('tasks');
      expect(mockQuery.select).toHaveBeenCalledWith('*');
      expect(mockQuery.eq).not.toHaveBeenCalledWith('list_id', expect.anything());
      expect(result).toEqual({ data: mockTasks, error: null });
    });
  });

  describe('getTaskById', () => {
    it('should fetch a single task by ID', async () => {
      const mockTask = {
        id: '1',
        list_id: 'list-1',
        user_id: 'user-1',
        title: 'Test Task',
        description: 'Description',
        completed: false,
        priority: 'medium' as const,
        due_date: '2024-12-31',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockQuery.mockResolvedValue({ data: mockTask, error: null });

      const result = await taskService.getTaskById('1');

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('tasks');
      expect(mockQuery.select).toHaveBeenCalledWith('*');
      expect(mockQuery.eq).toHaveBeenCalledWith('id', '1');
      expect(mockQuery.single).toHaveBeenCalled();
      expect(result).toEqual({ data: mockTask, error: null });
    });

    it('should handle task not found', async () => {
      const mockError = { message: 'No rows returned', code: 'PGRST116' };
      mockQuery.mockResolvedValue({ data: null, error: mockError });

      const result = await taskService.getTaskById('nonexistent');

      expect(result).toEqual({
        data: null,
        error: { message: 'No rows returned', code: 'PGRST116' },
      });
    });
  });

  describe('createTask', () => {
    const mockTaskData: TaskFormData = {
      title: 'New Task',
      description: 'Task description',
      priority: 'high',
      due_date: '2024-12-31',
    };

    it('should create a new task', async () => {
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
      mockQuery.mockResolvedValue({ data: mockCreatedTask, error: null });

      const result = await taskService.createTask('list-1', mockTaskData);

      expect(mockSupabaseClient.auth.getUser).toHaveBeenCalled();
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('tasks');
      expect(mockQuery.insert).toHaveBeenCalledWith({
        list_id: 'list-1',
        user_id: 'user-1',
        title: 'New Task',
        description: 'Task description',
        priority: 'high',
        due_date: '2024-12-31',
        completed: false,
      });
      expect(mockQuery.select).toHaveBeenCalled();
      expect(mockQuery.single).toHaveBeenCalled();
      expect(result).toEqual({ data: mockCreatedTask, error: null });
    });

    it('should handle unauthenticated user', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user: null } });

      const result = await taskService.createTask('list-1', mockTaskData);

      expect(result).toEqual({
        data: null,
        error: { message: 'User not authenticated' },
      });
    });

    it('should handle creation errors', async () => {
      const mockUser = { id: 'user-1' };
      const mockError = { message: 'Creation failed', code: '500' };

      mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user: mockUser } });
      mockQuery.mockResolvedValue({ data: null, error: mockError });

      const result = await taskService.createTask('list-1', mockTaskData);

      expect(result).toEqual({
        data: null,
        error: { message: 'Creation failed', code: '500' },
      });
    });
  });

  describe('updateTask', () => {
    const mockUpdateData: TaskUpdateData = {
      title: 'Updated Task',
      completed: true,
    };

    it('should update a task', async () => {
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

      mockQuery.mockResolvedValue({ data: mockUpdatedTask, error: null });

      const result = await taskService.updateTask('1', mockUpdateData);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('tasks');
      expect(mockQuery.update).toHaveBeenCalledWith({
        ...mockUpdateData,
        updated_at: expect.any(String),
      });
      expect(mockQuery.eq).toHaveBeenCalledWith('id', '1');
      expect(mockQuery.select).toHaveBeenCalled();
      expect(mockQuery.single).toHaveBeenCalled();
      expect(result).toEqual({ data: mockUpdatedTask, error: null });
    });

    it('should handle update errors', async () => {
      const mockError = { message: 'Update failed', code: '500' };
      mockQuery.mockResolvedValue({ data: null, error: mockError });

      const result = await taskService.updateTask('1', mockUpdateData);

      expect(result).toEqual({
        data: null,
        error: { message: 'Update failed', code: '500' },
      });
    });
  });

  describe('toggleTaskCompletion', () => {
    it('should toggle task completion from false to true', async () => {
      const mockCurrentTask = {
        id: '1',
        list_id: 'list-1',
        user_id: 'user-1',
        title: 'Task',
        description: null,
        completed: false,
        priority: 'medium' as const,
        due_date: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const mockUpdatedTask = { ...mockCurrentTask, completed: true };

      // Create separate mock queries
      const getTaskQuery = createMockQuery();
      const updateTaskQuery = createMockQuery();
      
      getTaskQuery.mockResolvedValue({ data: mockCurrentTask, error: null });
      updateTaskQuery.mockResolvedValue({ data: mockUpdatedTask, error: null });

      // Mock the from method to return different queries
      mockSupabaseClient.from
        .mockReturnValueOnce(getTaskQuery)
        .mockReturnValueOnce(updateTaskQuery);

      const result = await taskService.toggleTaskCompletion('1');

      expect(updateTaskQuery.update).toHaveBeenCalledWith({
        completed: true,
        updated_at: expect.any(String),
      });
    });

    it('should handle task not found', async () => {
      const getTaskQuery = createMockQuery();
      getTaskQuery.mockResolvedValue({ data: null, error: { message: 'Task not found' } });
      
      mockSupabaseClient.from.mockReturnValueOnce(getTaskQuery);

      const result = await taskService.toggleTaskCompletion('1');

      expect(result).toEqual({
        data: null,
        error: { message: 'Task not found' },
      });
    });
 });

  describe('deleteTask', () => {
    it('should delete a task', async () => {
      mockQuery.mockResolvedValue({ error: null });

      const result = await taskService.deleteTask('1');

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('tasks');
      expect(mockQuery.delete).toHaveBeenCalled();
      expect(mockQuery.eq).toHaveBeenCalledWith('id', '1');
      expect(result).toEqual({ error: null });
    });

    it('should handle deletion errors', async () => {
      const error = { message: 'Delete failed', code: '500' };
      mockQuery.mockResolvedValue({ error });

      const result = await taskService.deleteTask('1');

      expect(result).toEqual({
        error: { message: 'Delete failed', code: '500' },
      });
    });
  });

  describe('getOverdueTasks', () => {
    it('should fetch overdue tasks', async () => {
      const mockOverdueTasks = [
        {
          id: '1',
          list_id: 'list-1',
          user_id: 'user-1',
          title: 'Overdue Task',
          description: null,
          completed: false,
          priority: 'high' as const,
          due_date: '2023-01-01',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      mockQuery.mockResolvedValue({ data: mockOverdueTasks, error: null });

      const result = await taskService.getOverdueTasks();

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('tasks');
      expect(mockQuery.select).toHaveBeenCalledWith('*');
      expect(mockQuery.lt).toHaveBeenCalledWith('due_date', expect.any(String));
      expect(mockQuery.eq).toHaveBeenCalledWith('completed', false);
      expect(mockQuery.order).toHaveBeenCalledWith('due_date', { ascending: true });
      expect(result).toEqual({ data: mockOverdueTasks, error: null });
    });


  describe('getTaskCountByListId', () => {
    it('should get task count for a list', async () => {
      mockQuery.mockResolvedValue({ count: 5, error: null });

      const result = await taskService.getTaskCountByListId('list-1');

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('tasks');
      expect(mockQuery.select).toHaveBeenCalledWith('*', { count: 'exact', head: true });
      expect(mockQuery.eq).toHaveBeenCalledWith('list_id', 'list-1');
      expect(result).toEqual({ data: 5, error: null });
    });

    it('should handle errors when getting task count', async () => {
      const error = { message: 'Count failed', code: '500' };
      mockQuery.mockResolvedValue({ count: null, error });

      const result = await taskService.getTaskCountByListId('list-1');

      expect(result).toEqual({
        data: null,
        error: { message: 'Count failed', code: '500' },
      });
    });
  });
});

  describe('getCompletedTaskCountByListId', () => {
    it('should get completed task count for a list', async () => {
      mockQuery.mockResolvedValue({ count: 3, error: null });

      const result = await taskService.getCompletedTaskCountByListId('list-1');

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('tasks');
      expect(mockQuery.select).toHaveBeenCalledWith('*', { count: 'exact', head: true });
      expect(mockQuery.eq).toHaveBeenCalledWith('list_id', 'list-1');
      expect(mockQuery.eq).toHaveBeenCalledWith('completed', true);
      expect(result).toEqual({ data: 3, error: null });
    });
  });
});