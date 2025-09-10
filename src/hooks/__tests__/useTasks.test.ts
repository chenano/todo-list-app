import { renderHook, act, waitFor } from '@testing-library/react';
import { useTasks, useAllTasks, useTask, useCreateTask, useUpdateTask, useDeleteTask, useOverdueTasks } from '../useTasks';
import { taskService } from '../../lib/tasks';
import { Task } from '../../lib/supabase/types';
import { TaskFormData, TaskUpdateData } from '../../lib/validations';

// Mock the task service
jest.mock('../../lib/tasks');

const mockTaskService = taskService as jest.Mocked<typeof taskService>;

describe('useTasks', () => {
  const mockTasks: Task[] = [
    {
      id: '1',
      list_id: 'list-1',
      user_id: 'user-1',
      title: 'Task 1',
      description: 'Description 1',
      completed: false,
      priority: 'medium',
      due_date: '2024-12-31',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    {
      id: '2',
      list_id: 'list-1',
      user_id: 'user-1',
      title: 'Task 2',
      description: null,
      completed: true,
      priority: 'high',
      due_date: null,
      created_at: '2024-01-02T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockTaskService.subscribeToTaskUpdates.mockReturnValue({
      unsubscribe: jest.fn(),
    } as any);
  });

  it('should fetch tasks on mount', async () => {
    mockTaskService.getTasksByListId.mockResolvedValueOnce({
      data: mockTasks,
      error: null,
    });

    const { result } = renderHook(() => useTasks('list-1'));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockTaskService.getTasksByListId).toHaveBeenCalledWith(
      'list-1',
      {},
      { field: 'created_at', direction: 'desc' }
    );
    expect(result.current.tasks).toEqual(mockTasks);
    expect(result.current.error).toBeNull();
  });

  it('should handle fetch errors', async () => {
    const mockError = { message: 'Failed to fetch tasks' };
    mockTaskService.getTasksByListId.mockResolvedValueOnce({
      data: null,
      error: mockError,
    });

    const { result } = renderHook(() => useTasks('list-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.tasks).toEqual([]);
    expect(result.current.error).toEqual(mockError);
  });

  it('should create task with optimistic update', async () => {
    const newTaskData: TaskFormData = {
      title: 'New Task',
      description: 'New Description',
      priority: 'high',
      due_date: '2024-12-31',
    };

    const createdTask: Task = {
      id: 'new-task-id',
      list_id: 'list-1',
      user_id: 'user-1',
      title: 'New Task',
      description: 'New Description',
      completed: false,
      priority: 'high',
      due_date: '2024-12-31',
      created_at: '2024-01-03T00:00:00Z',
      updated_at: '2024-01-03T00:00:00Z',
    };

    mockTaskService.getTasksByListId.mockResolvedValueOnce({
      data: mockTasks,
      error: null,
    });

    mockTaskService.createTask.mockResolvedValueOnce({
      data: createdTask,
      error: null,
    });

    const { result } = renderHook(() => useTasks('list-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let createResult: Task | null = null;
    await act(async () => {
      createResult = await result.current.createTask('list-1', newTaskData);
    });

    expect(mockTaskService.createTask).toHaveBeenCalledWith('list-1', newTaskData);
    expect(createResult).toEqual(createdTask);
    expect(result.current.tasks).toContainEqual(createdTask);
  });

  it('should handle create task errors with rollback', async () => {
    const newTaskData: TaskFormData = {
      title: 'New Task',
      description: 'New Description',
      priority: 'high',
      due_date: '2024-12-31',
    };

    const mockError = { message: 'Failed to create task' };

    mockTaskService.getTasksByListId.mockResolvedValueOnce({
      data: mockTasks,
      error: null,
    });

    mockTaskService.createTask.mockResolvedValueOnce({
      data: null,
      error: mockError,
    });

    const { result } = renderHook(() => useTasks('list-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const initialTaskCount = result.current.tasks.length;

    let createResult: Task | null = null;
    await act(async () => {
      createResult = await result.current.createTask('list-1', newTaskData);
    });

    expect(createResult).toBeNull();
    expect(result.current.tasks).toHaveLength(initialTaskCount);
    expect(result.current.error).toEqual(mockError);
  });

  it('should update task with optimistic update', async () => {
    const updateData: TaskUpdateData = {
      title: 'Updated Task',
      completed: true,
    };

    const updatedTask: Task = {
      ...mockTasks[0],
      title: 'Updated Task',
      completed: true,
      updated_at: '2024-01-03T00:00:00Z',
    };

    mockTaskService.getTasksByListId.mockResolvedValueOnce({
      data: mockTasks,
      error: null,
    });

    mockTaskService.updateTask.mockResolvedValueOnce({
      data: updatedTask,
      error: null,
    });

    const { result } = renderHook(() => useTasks('list-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let updateResult: Task | null = null;
    await act(async () => {
      updateResult = await result.current.updateTask('1', updateData);
    });

    expect(mockTaskService.updateTask).toHaveBeenCalledWith('1', updateData);
    expect(updateResult).toEqual(updatedTask);
    expect(result.current.tasks.find(t => t.id === '1')).toEqual(updatedTask);
  });

  it('should toggle task completion', async () => {
    const toggledTask: Task = {
      ...mockTasks[0],
      completed: true,
      updated_at: '2024-01-03T00:00:00Z',
    };

    mockTaskService.getTasksByListId.mockResolvedValueOnce({
      data: mockTasks,
      error: null,
    });

    mockTaskService.toggleTaskCompletion.mockResolvedValueOnce({
      data: toggledTask,
      error: null,
    });

    const { result } = renderHook(() => useTasks('list-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let toggleResult: Task | null = null;
    await act(async () => {
      toggleResult = await result.current.toggleCompletion('1');
    });

    expect(mockTaskService.toggleTaskCompletion).toHaveBeenCalledWith('1');
    expect(toggleResult).toEqual(toggledTask);
    expect(result.current.tasks.find(t => t.id === '1')?.completed).toBe(true);
  });

  it('should delete task with optimistic update', async () => {
    mockTaskService.getTasksByListId.mockResolvedValueOnce({
      data: mockTasks,
      error: null,
    });

    mockTaskService.deleteTask.mockResolvedValueOnce({
      error: null,
    });

    const { result } = renderHook(() => useTasks('list-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let deleteResult: boolean = false;
    await act(async () => {
      deleteResult = await result.current.deleteTask('1');
    });

    expect(mockTaskService.deleteTask).toHaveBeenCalledWith('1');
    expect(deleteResult).toBe(true);
    expect(result.current.tasks.find(t => t.id === '1')).toBeUndefined();
  });

  it('should update filters and refetch', async () => {
    mockTaskService.getTasksByListId
      .mockResolvedValueOnce({ data: mockTasks, error: null })
      .mockResolvedValueOnce({ data: [mockTasks[1]], error: null });

    const { result } = renderHook(() => useTasks('list-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.setFilters({ status: 'completed' });
    });

    await waitFor(() => {
      expect(mockTaskService.getTasksByListId).toHaveBeenCalledWith(
        'list-1',
        { status: 'completed' },
        { field: 'created_at', direction: 'desc' }
      );
    });
  });

  it('should update sort and refetch', async () => {
    mockTaskService.getTasksByListId
      .mockResolvedValueOnce({ data: mockTasks, error: null })
      .mockResolvedValueOnce({ data: mockTasks, error: null });

    const { result } = renderHook(() => useTasks('list-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.setSort({ field: 'due_date', direction: 'asc' });
    });

    await waitFor(() => {
      expect(mockTaskService.getTasksByListId).toHaveBeenCalledWith(
        'list-1',
        {},
        { field: 'due_date', direction: 'asc' }
      );
    });
  });

  it('should set up real-time subscription', () => {
    mockTaskService.getTasksByListId.mockResolvedValueOnce({
      data: mockTasks,
      error: null,
    });

    renderHook(() => useTasks('list-1'));

    expect(mockTaskService.subscribeToTaskUpdates).toHaveBeenCalledWith(
      'list-1',
      expect.any(Function)
    );
  });
});

describe('useAllTasks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTaskService.subscribeToAllTaskUpdates.mockReturnValue({
      unsubscribe: jest.fn(),
    } as any);
  });

  it('should fetch all user tasks', async () => {
    const mockTasks: Task[] = [
      {
        id: '1',
        list_id: 'list-1',
        user_id: 'user-1',
        title: 'Task 1',
        description: null,
        completed: false,
        priority: 'medium',
        due_date: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    ];

    mockTaskService.getAllUserTasks.mockResolvedValueOnce({
      data: mockTasks,
      error: null,
    });

    const { result } = renderHook(() => useAllTasks());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockTaskService.getAllUserTasks).toHaveBeenCalledWith(
      {},
      { field: 'created_at', direction: 'desc' }
    );
    expect(result.current.tasks).toEqual(mockTasks);
  });
});

describe('useTask', () => {
  it('should fetch a single task', async () => {
    const mockTask: Task = {
      id: '1',
      list_id: 'list-1',
      user_id: 'user-1',
      title: 'Task 1',
      description: null,
      completed: false,
      priority: 'medium',
      due_date: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    mockTaskService.getTaskById.mockResolvedValueOnce({
      data: mockTask,
      error: null,
    });

    const { result } = renderHook(() => useTask('1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockTaskService.getTaskById).toHaveBeenCalledWith('1');
    expect(result.current.task).toEqual(mockTask);
    expect(result.current.error).toBeNull();
  });

  it('should handle task not found', async () => {
    const mockError = { message: 'Task not found' };
    mockTaskService.getTaskById.mockResolvedValueOnce({
      data: null,
      error: mockError,
    });

    const { result } = renderHook(() => useTask('nonexistent'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.task).toBeNull();
    expect(result.current.error).toEqual(mockError);
  });
});

describe('useCreateTask', () => {
  it('should create a task', async () => {
    const taskData: TaskFormData = {
      title: 'New Task',
      description: 'Description',
      priority: 'high',
      due_date: '2024-12-31',
    };

    const createdTask: Task = {
      id: 'new-id',
      list_id: 'list-1',
      user_id: 'user-1',
      title: 'New Task',
      description: 'Description',
      completed: false,
      priority: 'high',
      due_date: '2024-12-31',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    mockTaskService.createTask.mockResolvedValueOnce({
      data: createdTask,
      error: null,
    });

    const { result } = renderHook(() => useCreateTask());

    let createResult: Task | null = null;
    await act(async () => {
      createResult = await result.current.createTask('list-1', taskData);
    });

    expect(mockTaskService.createTask).toHaveBeenCalledWith('list-1', taskData);
    expect(createResult).toEqual(createdTask);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle creation errors', async () => {
    const taskData: TaskFormData = {
      title: 'New Task',
      description: 'Description',
      priority: 'high',
      due_date: '2024-12-31',
    };

    const mockError = { message: 'Creation failed' };
    mockTaskService.createTask.mockResolvedValueOnce({
      data: null,
      error: mockError,
    });

    const { result } = renderHook(() => useCreateTask());

    let createResult: Task | null = null;
    await act(async () => {
      createResult = await result.current.createTask('list-1', taskData);
    });

    expect(createResult).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toEqual(mockError);
  });
});

describe('useUpdateTask', () => {
  it('should update a task', async () => {
    const updateData: TaskUpdateData = {
      title: 'Updated Task',
      completed: true,
    };

    const updatedTask: Task = {
      id: '1',
      list_id: 'list-1',
      user_id: 'user-1',
      title: 'Updated Task',
      description: null,
      completed: true,
      priority: 'medium',
      due_date: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T12:00:00Z',
    };

    mockTaskService.updateTask.mockResolvedValueOnce({
      data: updatedTask,
      error: null,
    });

    const { result } = renderHook(() => useUpdateTask());

    let updateResult: Task | null = null;
    await act(async () => {
      updateResult = await result.current.updateTask('1', updateData);
    });

    expect(mockTaskService.updateTask).toHaveBeenCalledWith('1', updateData);
    expect(updateResult).toEqual(updatedTask);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });
});

describe('useDeleteTask', () => {
  it('should delete a task', async () => {
    mockTaskService.deleteTask.mockResolvedValueOnce({
      error: null,
    });

    const { result } = renderHook(() => useDeleteTask());

    let deleteResult: boolean = false;
    await act(async () => {
      deleteResult = await result.current.deleteTask('1');
    });

    expect(mockTaskService.deleteTask).toHaveBeenCalledWith('1');
    expect(deleteResult).toBe(true);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle deletion errors', async () => {
    const mockError = { message: 'Deletion failed' };
    mockTaskService.deleteTask.mockResolvedValueOnce({
      error: mockError,
    });

    const { result } = renderHook(() => useDeleteTask());

    let deleteResult: boolean = false;
    await act(async () => {
      deleteResult = await result.current.deleteTask('1');
    });

    expect(deleteResult).toBe(false);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toEqual(mockError);
  });
});

describe('useOverdueTasks', () => {
  it('should fetch overdue tasks', async () => {
    const mockOverdueTasks: Task[] = [
      {
        id: '1',
        list_id: 'list-1',
        user_id: 'user-1',
        title: 'Overdue Task',
        description: null,
        completed: false,
        priority: 'high',
        due_date: '2023-12-31',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    ];

    mockTaskService.getOverdueTasks.mockResolvedValueOnce({
      data: mockOverdueTasks,
      error: null,
    });

    const { result } = renderHook(() => useOverdueTasks());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockTaskService.getOverdueTasks).toHaveBeenCalled();
    expect(result.current.tasks).toEqual(mockOverdueTasks);
    expect(result.current.error).toBeNull();
  });
});