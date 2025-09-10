import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskForm } from '../TaskForm';
import { Task } from '@/lib/supabase/types';

const mockTask: Task = {
  id: '1',
  list_id: 'list-1',
  user_id: 'user-1',
  title: 'Test Task',
  description: 'Test Description',
  completed: false,
  priority: 'high',
  due_date: '2024-12-31',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

describe('TaskForm', () => {
  const defaultProps = {
    open: true,
    onOpenChange: jest.fn(),
    onSubmit: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders create form correctly', () => {
    render(<TaskForm {...defaultProps} />);
    
    expect(screen.getByText('Create New Task')).toBeInTheDocument();
    expect(screen.getByText('Fill in the details to create a new task.')).toBeInTheDocument();
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByText('Create Task')).toBeInTheDocument();
  });

  it('renders edit form correctly', () => {
    render(<TaskForm {...defaultProps} task={mockTask} />);
    
    expect(screen.getByText('Edit Task')).toBeInTheDocument();
    expect(screen.getByText('Update the task details below.')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Task')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Description')).toBeInTheDocument();
    expect(screen.getByText('Update Task')).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();
    render(<TaskForm {...defaultProps} />);
    
    const submitButton = screen.getByRole('button', { name: /create task/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/title is required/i)).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    const mockSubmit = jest.fn().mockResolvedValue(undefined);
    
    render(<TaskForm {...defaultProps} onSubmit={mockSubmit} />);
    
    const titleInput = screen.getByLabelText(/title/i);
    const descriptionInput = screen.getByLabelText(/description/i);
    
    await user.type(titleInput, 'New Task');
    await user.type(descriptionInput, 'New Description');
    
    const submitButton = screen.getByRole('button', { name: /create task/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith({
        title: 'New Task',
        description: 'New Description',
        priority: 'medium',
        due_date: '',
      });
    });
  });

  it('handles form submission error gracefully', async () => {
    const user = userEvent.setup();
    const mockSubmit = jest.fn().mockRejectedValue(new Error('Submission failed'));
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    render(<TaskForm {...defaultProps} onSubmit={mockSubmit} />);
    
    const titleInput = screen.getByLabelText(/title/i);
    await user.type(titleInput, 'New Task');
    
    const submitButton = screen.getByRole('button', { name: /create task/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error submitting task form:', expect.any(Error));
    });
    
    consoleSpy.mockRestore();
  });

  it('disables form when loading', () => {
    render(<TaskForm {...defaultProps} loading={true} />);
    
    const titleInput = screen.getByLabelText(/title/i);
    const submitButton = screen.getByRole('button', { name: /create task/i });
    
    expect(titleInput).toBeDisabled();
    expect(submitButton).toBeDisabled();
  });

  it('shows loading state during submission', async () => {
    const user = userEvent.setup();
    let resolveSubmit: () => void;
    const mockSubmit = jest.fn(() => new Promise<void>((resolve) => {
      resolveSubmit = resolve;
    }));
    
    render(<TaskForm {...defaultProps} onSubmit={mockSubmit} />);
    
    const titleInput = screen.getByLabelText(/title/i);
    await user.type(titleInput, 'New Task');
    
    const submitButton = screen.getByRole('button', { name: /create task/i });
    await user.click(submitButton);
    
    expect(screen.getByText('Creating...')).toBeInTheDocument();
    
    // Resolve the promise to complete the test
    resolveSubmit!();
  });

  it('closes dialog on cancel', async () => {
    const user = userEvent.setup();
    const mockOnOpenChange = jest.fn();
    
    render(<TaskForm {...defaultProps} onOpenChange={mockOnOpenChange} />);
    
    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);
    
    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it('uses custom title and description when provided', () => {
    render(
      <TaskForm 
        {...defaultProps} 
        title="Custom Title"
        description="Custom Description"
      />
    );
    
    expect(screen.getByText('Custom Title')).toBeInTheDocument();
    expect(screen.getByText('Custom Description')).toBeInTheDocument();
  });
});