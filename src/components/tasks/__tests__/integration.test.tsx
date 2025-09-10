import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskItem, TaskForm, TaskList } from '../index';
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

describe('Task Components Integration', () => {
  it('renders TaskItem with all required props', () => {
    render(<TaskItem task={mockTask} />);
    
    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
    expect(screen.getByText('Medium')).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });

  it('renders TaskForm in create mode', () => {
    render(
      <TaskForm 
        open={true} 
        onOpenChange={() => {}} 
        onSubmit={async () => {}} 
      />
    );
    
    expect(screen.getByText('Create New Task')).toBeInTheDocument();
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
  });

  it('renders TaskList with tasks', () => {
    render(<TaskList tasks={[mockTask]} />);
    
    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(screen.getByText('1 task total')).toBeInTheDocument();
  });

  it('handles task completion toggle', async () => {
    const mockToggle = jest.fn();
    render(<TaskItem task={mockTask} onToggleComplete={mockToggle} />);
    
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    
    await waitFor(() => {
      expect(mockToggle).toHaveBeenCalledWith('1');
    });
  });

  it('shows completed task styling', () => {
    const completedTask = { ...mockTask, completed: true };
    render(<TaskItem task={completedTask} />);
    
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();
    
    const title = screen.getByText('Test Task');
    expect(title).toHaveClass('line-through');
  });
});