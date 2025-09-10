import { renderHook, act } from '@testing-library/react';
import { useTaskFilters, useTaskFilterPresets } from '../useTaskFilters';
import { Task, TaskFilters, TaskSort } from '../../types';

// Mock tasks for testing
const mockTasks: Task[] = [
  {
    id: '1',
    list_id: 'list1',
    user_id: 'user1',
    title: 'Task 1',
    description: 'Description 1',
    completed: false,
    priority: 'high',
    due_date: '2024-01-15',
    created_at: '2024-01-10T10:00:00Z',
    updated_at: '2024-01-10T10:00:00Z',
  },
  {
    id: '2',
    list_id: 'list1',
    user_id: 'user1',
    title: 'Task 2',
    description: 'Description 2',
    completed: true,
    priority: 'medium',
    due_date: '2024-01-20',
    created_at: '2024-01-11T10:00:00Z',
    updated_at: '2024-01-11T10:00:00Z',
  },
  {
    id: '3',
    list_id: 'list1',
    user_id: 'user1',
    title: 'Task 3',
    description: 'Description 3',
    completed: false,
    priority: 'low',
    due_date: null,
    created_at: '2024-01-12T10:00:00Z',
    updated_at: '2024-01-12T10:00:00Z',
  },
];

describe('useTaskFilters', () => {
  it('should initialize with default values', () => {
    const { result } = renderHook(() => useTaskFilters());
    
    expect(result.current.filters).toEqual({
      status: 'all',
      priority: 'all',
      overdue: false,
    });
    
    expect(result.current.sort).toEqual({
      field: 'created_at',
      direction: 'desc',
    });
    
    expect(result.current.hasActiveFilters).toBe(false);
    expect(result.current.hasCustomSort).toBe(false);
  });

  it('should initialize with custom initial values', () => {
    const initialFilters: Partial<TaskFilters> = { status: 'completed' };
    const initialSort: Partial<TaskSort> = { field: 'title' };
    
    const { result } = renderHook(() => 
      useTaskFilters(initialFilters, initialSort)
    );
    
    expect(result.current.filters.status).toBe('completed');
    expect(result.current.sort.field).toBe('title');
  });

  it('should update filters correctly', () => {
    const { result } = renderHook(() => useTaskFilters());
    
    act(() => {
      result.current.setFilters({ status: 'completed', priority: 'high', overdue: false });
    });
    
    expect(result.current.filters.status).toBe('completed');
    expect(result.current.filters.priority).toBe('high');
    expect(result.current.hasActiveFilters).toBe(true);
  });

  it('should update sort correctly', () => {
    const { result } = renderHook(() => useTaskFilters());
    
    act(() => {
      result.current.setSort({ field: 'title', direction: 'asc' });
    });
    
    expect(result.current.sort.field).toBe('title');
    expect(result.current.sort.direction).toBe('asc');
    expect(result.current.hasCustomSort).toBe(true);
  });

  it('should update individual filter properties', () => {
    const { result } = renderHook(() => useTaskFilters());
    
    act(() => {
      result.current.updateFilter('status', 'completed');
    });
    
    expect(result.current.filters.status).toBe('completed');
    expect(result.current.filters.priority).toBe('all'); // Should remain unchanged
  });

  it('should update individual sort properties', () => {
    const { result } = renderHook(() => useTaskFilters());
    
    act(() => {
      result.current.updateSort('field', 'priority');
    });
    
    expect(result.current.sort.field).toBe('priority');
    expect(result.current.sort.direction).toBe('desc'); // Should remain unchanged
  });

  it('should clear all filters', () => {
    const { result } = renderHook(() => useTaskFilters());
    
    // Set some filters first
    act(() => {
      result.current.setFilters({ status: 'completed', priority: 'high', overdue: true });
    });
    
    expect(result.current.hasActiveFilters).toBe(true);
    
    // Clear filters
    act(() => {
      result.current.clearAllFilters();
    });
    
    expect(result.current.filters).toEqual({
      status: 'all',
      priority: 'all',
      overdue: false,
    });
    expect(result.current.hasActiveFilters).toBe(false);
  });

  it('should reset sort to default', () => {
    const { result } = renderHook(() => useTaskFilters());
    
    // Set custom sort first
    act(() => {
      result.current.setSort({ field: 'title', direction: 'asc' });
    });
    
    expect(result.current.hasCustomSort).toBe(true);
    
    // Reset sort
    act(() => {
      result.current.resetSort();
    });
    
    expect(result.current.sort).toEqual({
      field: 'created_at',
      direction: 'desc',
    });
    expect(result.current.hasCustomSort).toBe(false);
  });

  it('should reset both filters and sort', () => {
    const { result } = renderHook(() => useTaskFilters());
    
    // Set custom values
    act(() => {
      result.current.setFilters({ status: 'completed', priority: 'high', overdue: true });
      result.current.setSort({ field: 'title', direction: 'asc' });
    });
    
    expect(result.current.hasActiveFilters).toBe(true);
    expect(result.current.hasCustomSort).toBe(true);
    
    // Reset everything
    act(() => {
      result.current.reset();
    });
    
    expect(result.current.hasActiveFilters).toBe(false);
    expect(result.current.hasCustomSort).toBe(false);
  });

  it('should apply filters and sort to tasks', () => {
    const { result } = renderHook(() => useTaskFilters());
    
    // Set filters to show only incomplete tasks
    act(() => {
      result.current.setFilters({ status: 'incomplete', priority: 'all', overdue: false });
      result.current.setSort({ field: 'priority', direction: 'desc' });
    });
    
    const filteredTasks = result.current.applyFiltersAndSort(mockTasks);
    
    expect(filteredTasks).toHaveLength(2); // Only incomplete tasks
    expect(filteredTasks.every(task => !task.completed)).toBe(true);
    expect(filteredTasks[0].priority).toBe('high'); // Sorted by priority desc
    expect(filteredTasks[1].priority).toBe('low');
  });

  it('should get filtered task counts', () => {
    const { result } = renderHook(() => useTaskFilters());
    
    // Set filters to show only incomplete tasks
    act(() => {
      result.current.setFilters({ status: 'incomplete', priority: 'all', overdue: false });
    });
    
    const counts = result.current.getFilteredTaskCounts(mockTasks);
    
    expect(counts.total).toBe(2); // Only incomplete tasks counted
    expect(counts.completed).toBe(0);
    expect(counts.incomplete).toBe(2);
  });
});

describe('useTaskFilterPresets', () => {
  it('should return predefined filter presets', () => {
    const { result } = renderHook(() => useTaskFilterPresets());
    
    const presets = result.current.getPresets();
    
    expect(presets).toHaveLength(6);
    expect(presets[0].name).toBe('All Tasks');
    expect(presets[1].name).toBe('Incomplete Tasks');
    expect(presets[2].name).toBe('Completed Tasks');
    expect(presets[3].name).toBe('High Priority');
    expect(presets[4].name).toBe('Overdue Tasks');
    expect(presets[5].name).toBe('Due Soon');
  });

  it('should have correct filter configurations for presets', () => {
    const { result } = renderHook(() => useTaskFilterPresets());
    
    const presets = result.current.getPresets();
    
    // Test "High Priority" preset
    const highPriorityPreset = presets.find(p => p.name === 'High Priority')!;
    expect(highPriorityPreset.filters.status).toBe('incomplete');
    expect(highPriorityPreset.filters.priority).toBe('high');
    expect(highPriorityPreset.sort.field).toBe('due_date');
    
    // Test "Overdue Tasks" preset
    const overduePreset = presets.find(p => p.name === 'Overdue Tasks')!;
    expect(overduePreset.filters.overdue).toBe(true);
    expect(overduePreset.sort.field).toBe('due_date');
    expect(overduePreset.sort.direction).toBe('asc');
  });
});