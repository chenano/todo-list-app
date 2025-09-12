import { renderHook, act } from '@testing-library/react';
import { useBulkOperations } from '../useBulkOperations';
import { taskService } from '@/lib/tasks';

// Mock the task service
jest.mock('@/lib/tasks', () => ({
  taskService: {
    bulkCompleteTask: jest.fn(),
    bulkUncompleteTask: jest.fn(),
    bulkDeleteTasks: jest.fn(),
    bulkMoveTasks: jest.fn(),
    bulkUpdateTaskPriority: jest.fn(),
    bulkUpdateTaskDueDate: jest.fn(),
  },
}));

const mockTaskService = taskService as jest.Mocked<typeof taskService>;

describe('useBulkOperations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => useBulkOperations());

    expect(result.current.isProcessing).toBe(false);
    expect(result.current.error).toBe(null);
    expect(typeof result.current.bulkComplete).toBe('function');
    expect(typeof result.current.bulkUncomplete).toBe('function');
    expect(typeof result.current.bulkDelete).toBe('function');
    expect(typeof result.current.bulkMove).toBe('function');
    expect(typeof result.current.bulkUpdatePriority).toBe('function');
    expect(typeof result.current.bulkUpdateDueDate).toBe('function');
    expect(typeof result.current.clearError).toBe('function');
  });

  it('should handle successful bulk complete operation', async () => {
    const mockTasks = [{ id: 'task-1' }, { id: 'task-2' }];
    mockTaskService.bulkCompleteTask.mockResolvedValue({
      data: mockTasks as any,
      error: null,
    });

    const { result } = renderHook(() => useBulkOperations());

    let operationResult;
    await act(async () => {
      operationResult = await result.current.bulkComplete(['task-1', 'task-2']);
    });

    expect(mockTaskService.bulkCompleteTask).toHaveBeenCalledWith(['task-1', 'task-2']);
    expect(operationResult).toEqual({
      success: true,
      updatedTasks: mockTasks,
      successCount: 2,
      failureCount: 0,
    });
    expect(result.current.isProcessing).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('should handle failed bulk complete operation', async () => {
    const mockError = { message: 'Database error', code: '500' };
    mockTaskService.bulkCompleteTask.mockResolvedValue({
      data: null,
      error: mockError,
    });

    const { result } = renderHook(() => useBulkOperations());

    let operationResult;
    await act(async () => {
      operationResult = await result.current.bulkComplete(['task-1', 'task-2']);
    });

    expect(operationResult).toEqual({
      success: false,
      error: mockError,
      successCount: 0,
      failureCount: 2,
    });
    expect(result.current.isProcessing).toBe(false);
    expect(result.current.error).toEqual(mockError);
  });

  it('should handle successful bulk uncomplete operation', async () => {
    const mockTasks = [{ id: 'task-1' }, { id: 'task-2' }];
    mockTaskService.bulkUncompleteTask.mockResolvedValue({
      data: mockTasks as any,
      error: null,
    });

    const { result } = renderHook(() => useBulkOperations());

    let operationResult;
    await act(async () => {
      operationResult = await result.current.bulkUncomplete(['task-1', 'task-2']);
    });

    expect(mockTaskService.bulkUncompleteTask).toHaveBeenCalledWith(['task-1', 'task-2']);
    expect(operationResult).toEqual({
      success: true,
      updatedTasks: mockTasks,
      successCount: 2,
      failureCount: 0,
    });
  });

  it('should handle successful bulk delete operation', async () => {
    mockTaskService.bulkDeleteTasks.mockResolvedValue({ error: null });

    const { result } = renderHook(() => useBulkOperations());

    let operationResult;
    await act(async () => {
      operationResult = await result.current.bulkDelete(['task-1', 'task-2']);
    });

    expect(mockTaskService.bulkDeleteTasks).toHaveBeenCalledWith(['task-1', 'task-2']);
    expect(operationResult).toEqual({
      success: true,
      successCount: 2,
      failureCount: 0,
    });
  });

  it('should handle successful bulk move operation', async () => {
    const mockTasks = [{ id: 'task-1' }, { id: 'task-2' }];
    mockTaskService.bulkMoveTasks.mockResolvedValue({
      data: mockTasks as any,
      error: null,
    });

    const { result } = renderHook(() => useBulkOperations());

    let operationResult;
    await act(async () => {
      operationResult = await result.current.bulkMove(['task-1', 'task-2'], 'list-2');
    });

    expect(mockTaskService.bulkMoveTasks).toHaveBeenCalledWith(['task-1', 'task-2'], 'list-2');
    expect(operationResult).toEqual({
      success: true,
      updatedTasks: mockTasks,
      successCount: 2,
      failureCount: 0,
    });
  });

  it('should handle successful bulk priority update operation', async () => {
    const mockTasks = [{ id: 'task-1' }, { id: 'task-2' }];
    mockTaskService.bulkUpdateTaskPriority.mockResolvedValue({
      data: mockTasks as any,
      error: null,
    });

    const { result } = renderHook(() => useBulkOperations());

    let operationResult;
    await act(async () => {
      operationResult = await result.current.bulkUpdatePriority(['task-1', 'task-2'], 'high');
    });

    expect(mockTaskService.bulkUpdateTaskPriority).toHaveBeenCalledWith(['task-1', 'task-2'], 'high');
    expect(operationResult).toEqual({
      success: true,
      updatedTasks: mockTasks,
      successCount: 2,
      failureCount: 0,
    });
  });

  it('should handle successful bulk due date update operation', async () => {
    const mockTasks = [{ id: 'task-1' }, { id: 'task-2' }];
    const dueDate = '2024-12-31';
    mockTaskService.bulkUpdateTaskDueDate.mockResolvedValue({
      data: mockTasks as any,
      error: null,
    });

    const { result } = renderHook(() => useBulkOperations());

    let operationResult;
    await act(async () => {
      operationResult = await result.current.bulkUpdateDueDate(['task-1', 'task-2'], dueDate);
    });

    expect(mockTaskService.bulkUpdateTaskDueDate).toHaveBeenCalledWith(['task-1', 'task-2'], dueDate);
    expect(operationResult).toEqual({
      success: true,
      updatedTasks: mockTasks,
      successCount: 2,
      failureCount: 0,
    });
  });

  it('should handle clearing due date', async () => {
    const mockTasks = [{ id: 'task-1' }, { id: 'task-2' }];
    mockTaskService.bulkUpdateTaskDueDate.mockResolvedValue({
      data: mockTasks as any,
      error: null,
    });

    const { result } = renderHook(() => useBulkOperations());

    let operationResult;
    await act(async () => {
      operationResult = await result.current.bulkUpdateDueDate(['task-1', 'task-2'], null);
    });

    expect(mockTaskService.bulkUpdateTaskDueDate).toHaveBeenCalledWith(['task-1', 'task-2'], null);
    expect(operationResult).toEqual({
      success: true,
      updatedTasks: mockTasks,
      successCount: 2,
      failureCount: 0,
    });
  });

  it('should handle exceptions during operations', async () => {
    mockTaskService.bulkCompleteTask.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useBulkOperations());

    let operationResult;
    await act(async () => {
      operationResult = await result.current.bulkComplete(['task-1', 'task-2']);
    });

    expect(operationResult).toEqual({
      success: false,
      error: { message: 'Network error', code: '500' },
      successCount: 0,
      failureCount: 2,
    });
    expect(result.current.error).toEqual({ message: 'Network error', code: '500' });
  });

  it('should clear error state', async () => {
    const mockError = { message: 'Database error', code: '500' };
    mockTaskService.bulkCompleteTask.mockResolvedValue({
      data: null,
      error: mockError,
    });

    const { result } = renderHook(() => useBulkOperations());

    // Trigger an error
    await act(async () => {
      await result.current.bulkComplete(['task-1']);
    });

    expect(result.current.error).toEqual(mockError);

    // Clear the error
    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBe(null);
  });

  it('should set processing state during operations', async () => {
    let resolvePromise: (value: any) => void;
    const promise = new Promise(resolve => {
      resolvePromise = resolve;
    });

    mockTaskService.bulkCompleteTask.mockReturnValue(promise as any);

    const { result } = renderHook(() => useBulkOperations());

    expect(result.current.isProcessing).toBe(false);

    // Start the operation without awaiting
    let operationPromise: Promise<any>;
    act(() => {
      operationPromise = result.current.bulkComplete(['task-1']);
    });

    // Should be processing now
    expect(result.current.isProcessing).toBe(true);

    // Resolve the operation
    resolvePromise!({ data: [], error: null });
    
    // Wait for the operation to complete
    await act(async () => {
      await operationPromise!;
    });

    // Should no longer be processing
    expect(result.current.isProcessing).toBe(false);
  });
});