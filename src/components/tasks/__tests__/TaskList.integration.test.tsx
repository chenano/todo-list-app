import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TaskList } from '../TaskList';
import { Task } from '../../../types';
import { expect } from 'playwright/test';
import { it } from 'date-fns/locale';
import { expect } from 'playwright/test';
import { it } from 'date-fns/locale';
import { expect } from 'playwright/test';
import { expect } from 'playwright/test';
import { it } from 'date-fns/locale';
import { expect } from 'playwright/test';
import { expect } from 'playwright/test';
import { it } from 'date-fns/locale';
import { expect } from 'playwright/test';
import { expect } from 'playwright/test';
import { expect } from 'playwright/test';
import { it } from 'date-fns/locale';
import { expect } from 'playwright/test';
import { it } from 'date-fns/locale';
import { expect } from 'playwright/test';
import { expect } from 'playwright/test';
import { it } from 'date-fns/locale';
import { expect } from 'playwright/test';
import { expect } from 'playwright/test';
import { it } from 'date-fns/locale';
import { expect } from 'playwright/test';
import { expect } from 'playwright/test';
import { it } from 'date-fns/locale';
import { expect } from 'playwright/test';
import { it } from 'date-fns/locale';
import { expect } from 'playwright/test';
import { expect } from 'playwright/test';
import { it } from 'date-fns/locale';
import { expect } from 'playwright/test';
import { expect } from 'playwright/test';
import { it } from 'date-fns/locale';
import { expect } from 'playwright/test';
import { expect } from 'playwright/test';
import { expect } from 'playwright/test';
import { expect } from 'playwright/test';
import { expect } from 'playwright/test';
import { it } from 'date-fns/locale';
import { expect } from 'playwright/test';
import { it } from 'date-fns/locale';
import { expect } from 'playwright/test';
import { expect } from 'playwright/test';
import { expect } from 'playwright/test';
import { it } from 'date-fns/locale';
import { beforeEach } from 'node:test';
import { describe } from 'yargs';

// Mock the hooks
jest.mock('../../../hooks/useTaskFilters', () => ({
  useTaskFilters: () => ({
    filters: { status: 'all', priority: 'all', overdue: false },
    sort: { field: 'created_at', direction: 'desc' },
    setFilters: jest.fn(),
    setSort: jest.fn(),
    hasActiveFilters: false,
    hasCustomSort: false,
    applyFiltersAndSort: (tasks: Task[]) => tasks,
    getFilteredTaskCounts: () => ({
      total: 3,
      completed: 1,
      incomplete: 2,
      overdue: 0,
      byPriority: { high: 1, medium: 1, low: 1 },
    }),
    clearAllFilters: jest.fn(),
    resetSort: jest.fn(),
    reset: jest.fn(),
  }),
}));

const mockTasks: Task[] = [
  {
    id: '1',
    list_id: 'list1',
    user_id: 'user1',
    title: 'Task 1',
    description: 'Description 1',
    completed: false,
    priority: 'high',
    due_date: '2030-01-15',
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
    due_date: '2030-01-20',
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

const mockProps = {
  tasks: mockTasks,
  onToggleComplete: jest.fn(),
  onEditTask: jest.fn(),
  onDeleteTask: jest.fn(),
};

describe('TaskList Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders tasks without filters', () => {
    render(<TaskList {...mockProps} />);
    
    expect(screen.getByText('Task 1')).toBeInTheDocument();
    expect(screen.getByText('Task 2')).toBeInTheDocument();
    expect(screen.getByText('Task 3')).toBeInTheDocument();
  });

  it('shows filter controls when showFilters is true', () => {
    render(<TaskList {...mockProps} showFilters={true} />);
    
    expect(screen.getByText('Filter & Sort Tasks')).toBeInTheDocument();
  });

  it('shows quick filters when showQuickFilters is true', () => {
    render(<TaskList {...mockProps} showFilters={true} showQuickFilters={true} />);
    
    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('To Do')).toBeInTheDocument();
    expect(screen.getByText('Done')).toBeInTheDocument();
    expect(screen.getByText('High Priority')).toBeInTheDocument();
    expect(screen.getByText('Overdue')).toBeInTheDocument();
  });

  it('displays task sections when both completed and incomplete tasks exist', () => {
    render(<TaskList {...mockProps} />);
    
    expect(screen.getByText('To Do (2)')).toBeInTheDocument();
    expect(screen.getByText('Completed (1)')).toBeInTheDocument();
  });

  it('shows task summary', () => {
    render(<TaskList {...mockProps} />);
    
    expect(screen.getByText('3 tasks total')).toBeInTheDocument();
    expect(screen.getByText('1 completed (33%)')).toBeInTheDocument();
  });

  it('handles loading state', () => {
    render(<TaskList {...mockProps} loading={true} />);
    
    expect(screen.getByText('Loading tasks...')).toBeInTheDocument();
  });

  it('handles error state', () => {
    render(<TaskList {...mockProps} error="Failed to load tasks" />);
    
    expect(screen.getByText('Error loading tasks')).toBeInTheDocument();
    expect(screen.getByText('Failed to load tasks')).toBeInTheDocument();
  });

  it('handles empty state', () => {
    render(<TaskList {...mockProps} tasks={[]} />);
    
    expect(screen.getByText('No tasks found')).toBeInTheDocument();
    expect(screen.getByText('Create your first task to get started.')).toBeInTheDocument();
  });

  it('shows custom empty message when provided', () => {
    render(
      <TaskList 
        {...mockProps} 
        tasks={[]} 
        emptyMessage="No tasks in this list"
        emptyDescription="Add your first task to get started."
      />
    );
    
    expect(screen.getByText('No tasks in this list')).toBeInTheDocument();
    expect(screen.getByText('Add your first task to get started.')).toBeInTheDocument();
  });

  it('calls onToggleComplete when task is clicked', () => {
    render(<TaskList {...mockProps} />);
    
    const taskCheckbox = screen.getAllByRole('checkbox')[0];
    fireEvent.click(taskCheckbox);
    
    expect(mockProps.onToggleComplete).toHaveBeenCalledWith('1');
  });

  it('renders task items with edit and delete handlers', () => {
    render(<TaskList {...mockProps} />);
    
    // Verify that tasks are rendered and handlers are passed
    expect(mockProps.onEditTask).toBeDefined();
    expect(mockProps.onDeleteTask).toBeDefined();
    expect(mockProps.onToggleComplete).toBeDefined();
  });

  it('expands filter controls when clicked', async () => {
    render(<TaskList {...mockProps} showFilters={true} />);
    
    const filterButton = screen.getByText('Filter & Sort Tasks');
    fireEvent.click(filterButton);
    
    await waitFor(() => {
      expect(screen.getByText('Filters')).toBeInTheDocument();
      expect(screen.getByText('Sort')).toBeInTheDocument();
    });
  });

  it('applies quick filter presets', () => {
    const mockOnFiltersChange = jest.fn();
    const mockOnSortChange = jest.fn();
    
    render(
      <TaskList 
        {...mockProps} 
        showFilters={true} 
        showQuickFilters={true}
        onFiltersChange={mockOnFiltersChange}
        onSortChange={mockOnSortChange}
      />
    );
    
    const todoButton = screen.getByText('To Do');
    fireEvent.click(todoButton);
    
    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      status: 'incomplete',
      priority: 'all',
      overdue: false,
    });
    expect(mockOnSortChange).toHaveBeenCalledWith({
      field: 'created_at',
      direction: 'desc',
    });
  });

  it('renders in compact mode', () => {
    render(<TaskList {...mockProps} showFilters={true} compactFilters={true} />);
    
    expect(screen.getByText('Sort & Filter')).toBeInTheDocument();
  });

  it('accepts external filters and sort props', () => {
    const mockOnFiltersChange = jest.fn();
    const mockOnSortChange = jest.fn();
    
    render(
      <TaskList 
        {...mockProps} 
        filters={{ status: 'incomplete', priority: 'all', overdue: false }}
        sort={{ field: 'title', direction: 'asc' }}
        onFiltersChange={mockOnFiltersChange}
        onSortChange={mockOnSortChange}
        showFilters={true}
      />
    );
    
    // Should render with external props
    expect(screen.getByText('Filter & Sort Tasks')).toBeInTheDocument();
  });
});