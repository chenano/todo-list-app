import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ListPage from '../[id]/page';
import { useList } from '@/hooks/useLists';
import { useTasks } from '@/hooks/useTasks';
import { expect } from 'playwright/test';
import { it } from 'date-fns/locale';
import { expect } from 'playwright/test';
import { it } from 'date-fns/locale';
import { expect } from 'playwright/test';
import { expect } from 'playwright/test';
import { it } from 'date-fns/locale';
import { expect } from 'playwright/test';
import { it } from 'date-fns/locale';
import { expect } from 'playwright/test';
import { it } from 'date-fns/locale';
import { expect } from 'playwright/test';
import { it } from 'date-fns/locale';
import { expect } from 'playwright/test';
import { it } from 'date-fns/locale';
import { expect } from 'playwright/test';
import { expect } from 'playwright/test';
import { expect } from 'playwright/test';
import { expect } from 'playwright/test';
import { expect } from 'playwright/test';
import { it } from 'date-fns/locale';
import { beforeEach } from 'node:test';
import { describe } from 'yargs';

// Mock the hooks
jest.mock('@/hooks/useLists');
jest.mock('@/hooks/useTasks');

// Mock Next.js navigation
const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useParams: () => ({ id: 'list1' }),
  useSearchParams: () => ({ get: jest.fn().mockReturnValue(null) }),
}));

const mockList = {
  id: 'list1',
  user_id: 'user1',
  name: 'Test List',
  description: 'Test Description',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const mockTasks = [
  {
    id: 'task1',
    list_id: 'list1',
    user_id: 'user1',
    title: 'Test Task 1',
    description: 'Test Description 1',
    completed: false,
    priority: 'medium' as const,
    due_date: '2024-12-31',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'task2',
    list_id: 'list1',
    user_id: 'user1',
    title: 'Test Task 2',
    description: 'Test Description 2',
    completed: true,
    priority: 'high' as const,
    due_date: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

const mockUseList = {
  list: mockList,
  loading: false,
  error: null,
};

const mockUseTasks = {
  tasks: mockTasks,
  loading: false,
  error: null,
  createTask: jest.fn(),
  updateTask: jest.fn(),
  toggleCompletion: jest.fn(),
  deleteTask: jest.fn(),
};

describe('ListPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useList as jest.Mock).mockReturnValue(mockUseList);
    (useTasks as jest.Mock).mockReturnValue(mockUseTasks);
  });

  it('renders list page with tasks', () => {
    render(<ListPage />);

    expect(screen.getByText('Test List')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
    expect(screen.getByText('Add Task')).toBeInTheDocument();
    expect(screen.getByText('Test Task 1')).toBeInTheDocument();
    expect(screen.getByText('Test Task 2')).toBeInTheDocument();
  });

  it('shows loading state for list', () => {
    (useList as jest.Mock).mockReturnValue({
      ...mockUseList,
      loading: true,
    });

    render(<ListPage />);

    // Check for loading spinner by looking for the animate-spin class
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('shows error state for list', () => {
    (useList as jest.Mock).mockReturnValue({
      ...mockUseList,
      error: { message: 'Failed to load list' },
    });

    render(<ListPage />);

    expect(screen.getAllByText('Failed to load list')[0]).toBeInTheDocument();
  });

  it('shows not found state when list is null', () => {
    (useList as jest.Mock).mockReturnValue({
      ...mockUseList,
      list: null,
    });

    render(<ListPage />);

    expect(screen.getByText('List not found')).toBeInTheDocument();
  });

  it('opens add task form when add task button is clicked', () => {
    render(<ListPage />);

    fireEvent.click(screen.getByText('Add Task'));

    expect(screen.getByText('Add New Task')).toBeInTheDocument();
  });

  it('shows empty state when no tasks', () => {
    (useTasks as jest.Mock).mockReturnValue({
      ...mockUseTasks,
      tasks: [],
    });

    render(<ListPage />);

    expect(screen.getByText('No tasks in this list')).toBeInTheDocument();
    expect(screen.getByText('Add your first task to get started with organizing your work.')).toBeInTheDocument();
  });

  it('calls createTask when add task form is submitted', async () => {
    render(<ListPage />);

    // Open add task form
    fireEvent.click(screen.getByText('Add Task'));

    // Fill form
    const titleInput = screen.getByPlaceholderText('Enter task title...');
    fireEvent.change(titleInput, { target: { value: 'New Task' } });

    // Submit form
    const submitButton = screen.getByRole('button', { name: /create task/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockUseTasks.createTask).toHaveBeenCalledWith('list1', {
        title: 'New Task',
        description: '',
        priority: 'medium',
        due_date: '',
      });
    });
  });

  it('calls toggleCompletion when task checkbox is clicked', async () => {
    render(<ListPage />);

    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    expect(mockUseTasks.toggleCompletion).toHaveBeenCalledWith('task1');
  });
});