import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import DashboardPage from '../page';
import { useAuthContext } from '@/contexts/AuthContext';
import { useLists } from '@/hooks/useLists';

// Mock the hooks and router
jest.mock('next/navigation');
jest.mock('@/contexts/AuthContext');
jest.mock('@/hooks/useLists');

const mockRouter = {
  push: jest.fn(),
};

const mockAuthContext = {
  user: { id: 'user1', email: 'test@example.com' },
  signOut: jest.fn(),
};

const mockUseLists = {
  lists: [
    {
      id: '1',
      user_id: 'user1',
      name: 'Test List',
      description: 'Test Description',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      task_count: 5,
    },
  ],
  loading: false,
  error: null,
  createList: jest.fn(),
  updateList: jest.fn(),
  deleteList: jest.fn(),
};

describe('DashboardPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useAuthContext as jest.Mock).mockReturnValue(mockAuthContext);
    (useLists as jest.Mock).mockReturnValue(mockUseLists);
  });

  it('renders dashboard with lists', () => {
    render(<DashboardPage />);

    expect(screen.getByText('My Lists')).toBeInTheDocument();
    expect(screen.getByText('Create List')).toBeInTheDocument();
    expect(screen.getByText('Test List')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    (useLists as jest.Mock).mockReturnValue({
      ...mockUseLists,
      loading: true,
    });

    render(<DashboardPage />);

    expect(screen.getByText('Loading lists...')).toBeInTheDocument();
  });

  it('shows error state', () => {
    (useLists as jest.Mock).mockReturnValue({
      ...mockUseLists,
      error: { message: 'Failed to load lists' },
    });

    render(<DashboardPage />);

    expect(screen.getByText('Failed to load lists')).toBeInTheDocument();
  });

  it('shows empty state when no lists', () => {
    (useLists as jest.Mock).mockReturnValue({
      ...mockUseLists,
      lists: [],
    });

    render(<DashboardPage />);

    expect(screen.getByText('No lists yet')).toBeInTheDocument();
    expect(screen.getByText('Create your first list to start organizing your tasks.')).toBeInTheDocument();
  });

  it('opens create list form when create button is clicked', () => {
    render(<DashboardPage />);

    fireEvent.click(screen.getByText('Create List'));

    expect(screen.getByText('Create New List')).toBeInTheDocument();
  });

  it('navigates to list when list is clicked', () => {
    render(<DashboardPage />);

    const listCard = screen.getByText('Test List').closest('.cursor-pointer');
    fireEvent.click(listCard!);

    expect(mockRouter.push).toHaveBeenCalledWith('/dashboard/lists/1');
  });

  it('calls signOut when sign out button is clicked', async () => {
    render(<DashboardPage />);

    fireEvent.click(screen.getByText('Sign Out'));

    expect(mockAuthContext.signOut).toHaveBeenCalled();
  });

  it('creates a new list when form is submitted', async () => {
    render(<DashboardPage />);

    // Open create form
    fireEvent.click(screen.getByText('Create List'));

    // Fill form
    const nameInput = screen.getByPlaceholderText('Enter list name');
    fireEvent.change(nameInput, { target: { value: 'New List' } });

    // Submit form
    const submitButton = screen.getByRole('button', { name: /create list/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockUseLists.createList).toHaveBeenCalledWith({
        name: 'New List',
        description: '',
      });
    });
  });
});