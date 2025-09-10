import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TaskItem } from '../TaskItem';
import { Task } from '@/lib/supabase/types';

// Mock date-fns functions
jest.mock('date-fns', () => ({
  format: jest.fn((date, formatStr) => {
    if (formatStr === 'MMM d, yyyy') return 'Jan 1, 2024';
    if (formatStr === 'MMM d') return 'Jan 1';
    return 'Jan 1, 2024';
  }),
  isToday: jest.fn(() => false),
  isTomorrow: jest.fn(() => false),
  isPast: jest.fn(() => false),
}));

const mockTask: Task = {
  id: '1',
  list_id: 'list-1',
  user_id: 'user-1',
  title: 'Test Task',
  description: 'Test Description',
  completed: false,
  priority: 'medium',
  due_date: '2024-12-31',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

describe('TaskItem', () => {
  it('renders task information correctly', () => {
    render(<TaskItem task={mockTask} />);
    
    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
    expect(screen.getByText('Medium')).toBeInTheDocument();
  });

  it('shows completed state correctly', () => {
    const completedTask = { ...mockTask, completed: true };
    render(<TaskItem task={completedTask} />);
    
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();
  });

  it('calls onToggleComplete when checkbox is clicked', async () => {
    const mockToggle = jest.fn();
    render(<TaskItem task={mockTask} onToggleComplete={mockToggle} />);
    
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    
    await waitFor(() => {
      expect(mockToggle).toHaveBeenCalledWith('1');
    });
  });

  it('shows action menu when provided with handlers', () => {
    const mockEdit = jest.fn();
    const mockDelete = jest.fn();
    
    render(
      <TaskItem 
        task={mockTask} 
        onEdit={mockEdit} 
        onDelete={mockDelete} 
      />
    );
    
    // The menu button should be present but hidden initially
    const menuButton = screen.getByRole('button', { name: /open menu/i });
    expect(menuButton).toBeInTheDocument();
  });

  it('calls onEdit when edit menu item is clicked', async () => {
    const mockEdit = jest.fn();
    
    render(
      <TaskItem 
        task={mockTask} 
        onEdit={mockEdit} 
      />
    );
    
    const menuButton = screen.getByRole('button', { name: /open menu/i });
    fireEvent.click(menuButton);
    
    await waitFor(() => {
      const editButton = screen.getByText('Edit task');
      fireEvent.click(editButton);
    });
    
    expect(mockEdit).toHaveBeenCalledWith(mockTask);
  });

  it('calls onDelete when delete menu item is clicked', async () => {
    const mockDelete = jest.fn();
    
    render(
      <TaskItem 
        task={mockTask} 
        onDelete={mockDelete} 
      />
    );
    
    const menuButton = screen.getByRole('button', { name: /open menu/i });
    fireEvent.click(menuButton);
    
    await waitFor(() => {
      const deleteButton = screen.getByText('Delete task');
      fireEvent.click(deleteButton);
    });
    
    expect(mockDelete).toHaveBeenCalledWith('1');
  });

  it('handles task without description', () => {
    const taskWithoutDescription = { ...mockTask, description: null };
    render(<TaskItem task={taskWithoutDescription} />);
    
    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(screen.queryByText('Test Description')).not.toBeInTheDocument();
  });

  it('handles task without due date', () => {
    const taskWithoutDueDate = { ...mockTask, due_date: null };
    render(<TaskItem task={taskWithoutDueDate} />);
    
    expect(screen.getByText('Test Task')).toBeInTheDocument();
    // Should not show calendar icon or due date
    expect(screen.queryByText('Jan 1, 2024')).not.toBeInTheDocument();
  });
});