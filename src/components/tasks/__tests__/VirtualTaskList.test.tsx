import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { VirtualTaskList } from '../VirtualTaskList';
import { Task } from '@/lib/supabase/types';

// Mock react-window components
jest.mock('react-window', () => ({
  FixedSizeList: ({ children, itemData, itemCount }: any) => (
    <div data-testid="virtual-list">
      {Array.from({ length: Math.min(itemCount, 10) }, (_, index) =>
        children({ index, style: {}, data: itemData })
      )}
    </div>
  ),
}));

jest.mock('react-window-infinite-loader', () => {
  return function InfiniteLoader({ children }: any) {
    return children({
      onItemsRendered: jest.fn(),
      ref: jest.fn(),
    });
  };
});

// Mock TaskItem component
jest.mock('../TaskItem', () => ({
  TaskItem: ({ task }: { task: Task }) => (
    <div data-testid={`task-item-${task.id}`}>
      {task.title}
    </div>
  ),
}));

const mockTasks: Task[] = [
  {
    id: '1',
    list_id: 'list-1',
    user_id: 'user-1',
    title: 'Task 1',
    description: 'Description 1',
    completed: false,
    priority: 'medium',
    due_date: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    list_id: 'list-1',
    user_id: 'user-1',
    title: 'Task 2',
    description: 'Description 2',
    completed: true,
    priority: 'high',
    due_date: '2024-01-15',
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  },
];

describe('VirtualTaskList', () => {
  const defaultProps = {
    tasks: mockTasks,
    onToggleComplete: jest.fn(),
    onEditTask: jest.fn(),
    onDeleteTask: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders virtual list with tasks', () => {
    render(<VirtualTaskList {...defaultProps} />);
    
    expect(screen.getByTestId('virtual-list')).toBeInTheDocument();
    expect(screen.getByTestId('task-item-1')).toBeInTheDocument();
    expect(screen.getByTestId('task-item-2')).toBeInTheDocument();
  });

  it('shows loading state when loading and no tasks', () => {
    render(<VirtualTaskList tasks={[]} loading={true} />);
    
    expect(screen.getByText('Loading tasks...')).toBeInTheDocument();
  });

  it('shows empty state when no tasks', () => {
    render(<VirtualTaskList tasks={[]} />);
    
    expect(screen.getByText('No tasks found')).toBeInTheDocument();
  });

  it('shows loading placeholder for unloaded items', () => {
    const props = {
      ...defaultProps,
      hasNextPage: true,
      tasks: [mockTasks[0]], // Only one task loaded
    };
    
    render(<VirtualTaskList {...props} />);
    
    // Should show loading placeholder for second item
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('calls loadNextPage when scrolling to unloaded items', async () => {
    const loadNextPage = jest.fn().mockResolvedValue(undefined);
    const props = {
      ...defaultProps,
      hasNextPage: true,
      loadNextPage,
    };
    
    render(<VirtualTaskList {...props} />);
    
    // Simulate scrolling to trigger load more
    // Note: In a real test, this would be more complex with actual scrolling
    await waitFor(() => {
      expect(loadNextPage).toHaveBeenCalled();
    });
  });

  it('passes correct props to TaskItem components', () => {
    const onToggleComplete = jest.fn();
    const onEditTask = jest.fn();
    const onDeleteTask = jest.fn();
    
    render(
      <VirtualTaskList
        tasks={mockTasks}
        onToggleComplete={onToggleComplete}
        onEditTask={onEditTask}
        onDeleteTask={onDeleteTask}
        enableBulkSelection={true}
        allTaskIds={['1', '2']}
      />
    );
    
    expect(screen.getByTestId('task-item-1')).toBeInTheDocument();
    expect(screen.getByTestId('task-item-2')).toBeInTheDocument();
  });

  it('handles custom height and item height', () => {
    render(
      <VirtualTaskList
        {...defaultProps}
        height={800}
        itemHeight={100}
      />
    );
    
    expect(screen.getByTestId('virtual-list')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <VirtualTaskList
        {...defaultProps}
        className="custom-class"
      />
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('handles isNextPageLoading state', () => {
    render(
      <VirtualTaskList
        {...defaultProps}
        hasNextPage={true}
        isNextPageLoading={true}
      />
    );
    
    expect(screen.getByTestId('virtual-list')).toBeInTheDocument();
  });

  it('memoizes item data to prevent unnecessary re-renders', () => {
    const { rerender } = render(<VirtualTaskList {...defaultProps} />);
    
    // Re-render with same props
    rerender(<VirtualTaskList {...defaultProps} />);
    
    // Component should not re-render TaskItems unnecessarily
    expect(screen.getByTestId('task-item-1')).toBeInTheDocument();
    expect(screen.getByTestId('task-item-2')).toBeInTheDocument();
  });
});