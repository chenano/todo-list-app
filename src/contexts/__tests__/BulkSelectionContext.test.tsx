import { renderHook, act } from '@testing-library/react';
import { BulkSelectionProvider, useBulkSelection } from '../BulkSelectionContext';
import { Task } from '@/lib/supabase/types';

// Mock tasks for testing
const mockTasks: Task[] = [
  {
    id: 'task-1',
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
  {
    id: 'task-2',
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
  {
    id: 'task-3',
    list_id: 'list-1',
    user_id: 'user-1',
    title: 'Task 3',
    description: null,
    completed: false,
    priority: 'low',
    due_date: null,
    created_at: '2024-01-03T00:00:00Z',
    updated_at: '2024-01-03T00:00:00Z',
  },
];

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <BulkSelectionProvider>{children}</BulkSelectionProvider>
);

describe('BulkSelectionContext', () => {
  it('should initialize with empty selection', () => {
    const { result } = renderHook(() => useBulkSelection(), { wrapper });

    expect(result.current.state.selectedTaskIds.size).toBe(0);
    expect(result.current.state.isSelectionMode).toBe(false);
    expect(result.current.state.lastSelectedId).toBe(null);
    expect(result.current.actions.getSelectedCount()).toBe(0);
  });

  it('should toggle task selection', () => {
    const { result } = renderHook(() => useBulkSelection(), { wrapper });

    act(() => {
      result.current.actions.toggleTask('task-1');
    });

    expect(result.current.state.selectedTaskIds.has('task-1')).toBe(true);
    expect(result.current.state.isSelectionMode).toBe(true);
    expect(result.current.state.lastSelectedId).toBe('task-1');
    expect(result.current.actions.getSelectedCount()).toBe(1);

    // Toggle again to deselect
    act(() => {
      result.current.actions.toggleTask('task-1');
    });

    expect(result.current.state.selectedTaskIds.has('task-1')).toBe(false);
    expect(result.current.state.isSelectionMode).toBe(false);
    expect(result.current.actions.getSelectedCount()).toBe(0);
  });

  it('should select and deselect tasks', () => {
    const { result } = renderHook(() => useBulkSelection(), { wrapper });

    act(() => {
      result.current.actions.selectTask('task-1');
    });

    expect(result.current.state.selectedTaskIds.has('task-1')).toBe(true);
    expect(result.current.state.isSelectionMode).toBe(true);

    act(() => {
      result.current.actions.deselectTask('task-1');
    });

    expect(result.current.state.selectedTaskIds.has('task-1')).toBe(false);
    expect(result.current.state.isSelectionMode).toBe(false);
  });

  it('should select all tasks', () => {
    const { result } = renderHook(() => useBulkSelection(), { wrapper });
    const taskIds = mockTasks.map(task => task.id);

    act(() => {
      result.current.actions.selectAll(taskIds);
    });

    expect(result.current.state.selectedTaskIds.size).toBe(3);
    expect(result.current.state.isSelectionMode).toBe(true);
    taskIds.forEach(id => {
      expect(result.current.state.selectedTaskIds.has(id)).toBe(true);
    });
  });

  it('should deselect all tasks', () => {
    const { result } = renderHook(() => useBulkSelection(), { wrapper });
    const taskIds = mockTasks.map(task => task.id);

    // First select all
    act(() => {
      result.current.actions.selectAll(taskIds);
    });

    expect(result.current.state.selectedTaskIds.size).toBe(3);

    // Then deselect all
    act(() => {
      result.current.actions.deselectAll();
    });

    expect(result.current.state.selectedTaskIds.size).toBe(0);
    expect(result.current.state.isSelectionMode).toBe(false);
  });

  it('should enter and exit selection mode', () => {
    const { result } = renderHook(() => useBulkSelection(), { wrapper });

    act(() => {
      result.current.actions.enterSelectionMode();
    });

    expect(result.current.state.isSelectionMode).toBe(true);

    act(() => {
      result.current.actions.exitSelectionMode();
    });

    expect(result.current.state.isSelectionMode).toBe(false);
    expect(result.current.state.selectedTaskIds.size).toBe(0);
  });

  it('should select range of tasks', () => {
    const { result } = renderHook(() => useBulkSelection(), { wrapper });
    const taskIds = mockTasks.map(task => task.id);

    act(() => {
      result.current.actions.selectRange('task-1', 'task-3', taskIds);
    });

    expect(result.current.state.selectedTaskIds.has('task-1')).toBe(true);
    expect(result.current.state.selectedTaskIds.has('task-2')).toBe(true);
    expect(result.current.state.selectedTaskIds.has('task-3')).toBe(true);
    expect(result.current.state.isSelectionMode).toBe(true);
    expect(result.current.state.lastSelectedId).toBe('task-3');
  });

  it('should check if task is selected', () => {
    const { result } = renderHook(() => useBulkSelection(), { wrapper });

    expect(result.current.actions.isTaskSelected('task-1')).toBe(false);

    act(() => {
      result.current.actions.selectTask('task-1');
    });

    expect(result.current.actions.isTaskSelected('task-1')).toBe(true);
    expect(result.current.actions.isTaskSelected('task-2')).toBe(false);
  });

  it('should get selected tasks', () => {
    const { result } = renderHook(() => useBulkSelection(), { wrapper });

    act(() => {
      result.current.actions.selectTask('task-1');
      result.current.actions.selectTask('task-3');
    });

    const selectedTasks = result.current.actions.getSelectedTasks(mockTasks);
    expect(selectedTasks).toHaveLength(2);
    expect(selectedTasks[0].id).toBe('task-1');
    expect(selectedTasks[1].id).toBe('task-3');
  });

  it('should handle range selection with reverse order', () => {
    const { result } = renderHook(() => useBulkSelection(), { wrapper });
    const taskIds = mockTasks.map(task => task.id);

    act(() => {
      result.current.actions.selectRange('task-3', 'task-1', taskIds);
    });

    expect(result.current.state.selectedTaskIds.has('task-1')).toBe(true);
    expect(result.current.state.selectedTaskIds.has('task-2')).toBe(true);
    expect(result.current.state.selectedTaskIds.has('task-3')).toBe(true);
  });

  it('should handle invalid range selection', () => {
    const { result } = renderHook(() => useBulkSelection(), { wrapper });
    const taskIds = mockTasks.map(task => task.id);

    act(() => {
      result.current.actions.selectRange('invalid-id', 'task-1', taskIds);
    });

    expect(result.current.state.selectedTaskIds.size).toBe(0);
  });

  it('should maintain selection mode when tasks are selected', () => {
    const { result } = renderHook(() => useBulkSelection(), { wrapper });

    act(() => {
      result.current.actions.selectTask('task-1');
      result.current.actions.selectTask('task-2');
    });

    expect(result.current.state.isSelectionMode).toBe(true);

    act(() => {
      result.current.actions.deselectTask('task-1');
    });

    expect(result.current.state.isSelectionMode).toBe(true); // Still has task-2 selected

    act(() => {
      result.current.actions.deselectTask('task-2');
    });

    expect(result.current.state.isSelectionMode).toBe(false); // No tasks selected
  });
});