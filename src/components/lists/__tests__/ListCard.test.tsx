import { render, screen, fireEvent } from '@testing-library/react';
import { ListCard } from '../ListCard';
import { List } from '@/lib/supabase/types';

const mockList: List & { task_count: number } = {
  id: '1',
  user_id: 'user1',
  name: 'Test List',
  description: 'Test Description',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  task_count: 5,
};

describe('ListCard', () => {
  it('renders list information correctly', () => {
    render(<ListCard list={mockList} />);

    expect(screen.getByText('Test List')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
    expect(screen.getByText('5 tasks')).toBeInTheDocument();
    expect(screen.getByText(/Created/)).toBeInTheDocument();
  });

  it('handles singular task count', () => {
    const listWithOneTask = { ...mockList, task_count: 1 };
    render(<ListCard list={listWithOneTask} />);

    expect(screen.getByText('1 task')).toBeInTheDocument();
  });

  it('shows updated date when different from created date', () => {
    const updatedList = {
      ...mockList,
      updated_at: '2024-01-02T00:00:00Z',
    };
    render(<ListCard list={updatedList} />);

    expect(screen.getByText(/Updated/)).toBeInTheDocument();
  });

  it('calls onClick when card is clicked', () => {
    const handleClick = jest.fn();
    render(<ListCard list={mockList} onClick={handleClick} />);

    // Click on the card itself (the div with cursor-pointer class)
    const card = screen.getByText('Test List').closest('.cursor-pointer');
    fireEvent.click(card!);
    expect(handleClick).toHaveBeenCalledWith('1');
  });

  it('shows menu button when handlers are provided', () => {
    const handleEdit = jest.fn();
    const handleDelete = jest.fn();
    render(<ListCard list={mockList} onEdit={handleEdit} onDelete={handleDelete} />);

    expect(screen.getByRole('button', { name: /open menu/i })).toBeInTheDocument();
  });

  it('does not show menu button when no handlers are provided', () => {
    render(<ListCard list={mockList} />);

    expect(screen.queryByRole('button', { name: /open menu/i })).not.toBeInTheDocument();
  });

  it('renders without description', () => {
    const listWithoutDescription = { ...mockList, description: null };
    render(<ListCard list={listWithoutDescription} />);

    expect(screen.getByText('Test List')).toBeInTheDocument();
    expect(screen.queryByText('Test Description')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <ListCard list={mockList} className="custom-class" />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('prevents event propagation on menu interactions', () => {
    const handleClick = jest.fn();
    const handleEdit = jest.fn();
    
    render(
      <ListCard 
        list={mockList} 
        onClick={handleClick} 
        onEdit={handleEdit} 
      />
    );

    // Open menu - should not trigger card click
    fireEvent.click(screen.getByRole('button', { name: /open menu/i }));
    
    expect(handleClick).not.toHaveBeenCalled();
  });
});