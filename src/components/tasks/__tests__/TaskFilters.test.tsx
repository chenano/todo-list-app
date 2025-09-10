import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TaskFilters } from '../TaskFilters';
import { TaskFilters as TaskFiltersType } from '../../../types';

const mockFilters: TaskFiltersType = {
  status: 'all',
  priority: 'all',
  overdue: false,
};

const mockTaskCounts = {
  total: 10,
  completed: 3,
  incomplete: 7,
  overdue: 2,
  byPriority: {
    high: 4,
    medium: 3,
    low: 3,
  },
};

const mockProps = {
  filters: mockFilters,
  onFiltersChange: jest.fn(),
  onClearFilters: jest.fn(),
  hasActiveFilters: false,
  taskCounts: mockTaskCounts,
};

describe('TaskFilters', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders filter controls', () => {
    render(<TaskFilters {...mockProps} />);
    
    expect(screen.getByText('Filters')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Priority')).toBeInTheDocument();
    expect(screen.getByText('Special Filters')).toBeInTheDocument();
    expect(screen.getByLabelText(/overdue only/i)).toBeInTheDocument();
  });

  it('displays task counts in filter options', () => {
    render(<TaskFilters {...mockProps} />);
    
    // Check if task counts are displayed (they appear in select trigger)
    expect(screen.getByText('All Tasks (10)')).toBeInTheDocument();
  });

  it('shows active badge when filters are active', () => {
    render(<TaskFilters {...mockProps} hasActiveFilters={true} />);
    
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('shows clear button when filters are active', () => {
    render(<TaskFilters {...mockProps} hasActiveFilters={true} />);
    
    expect(screen.getByText('Clear')).toBeInTheDocument();
  });

  it('calls onClearFilters when clear button is clicked', () => {
    render(<TaskFilters {...mockProps} hasActiveFilters={true} />);
    
    fireEvent.click(screen.getByText('Clear'));
    expect(mockProps.onClearFilters).toHaveBeenCalledTimes(1);
  });

  it('calls onFiltersChange when overdue checkbox is toggled', () => {
    render(<TaskFilters {...mockProps} />);
    
    const overdueCheckbox = screen.getByLabelText(/overdue only/i);
    fireEvent.click(overdueCheckbox);
    
    expect(mockProps.onFiltersChange).toHaveBeenCalledWith({
      ...mockFilters,
      overdue: true,
    });
  });

  it('displays active filters when present', () => {
    const activeFilters: TaskFiltersType = {
      status: 'completed',
      priority: 'high',
      overdue: true,
    };
    
    render(
      <TaskFilters 
        {...mockProps} 
        filters={activeFilters} 
        hasActiveFilters={true} 
      />
    );
    
    expect(screen.getByText('Active filters:')).toBeInTheDocument();
    expect(screen.getByText(/Status:/)).toBeInTheDocument();
    expect(screen.getByText((content, element) => {
      return element?.textContent === 'Status: Completed';
    })).toBeInTheDocument();
    expect(screen.getByText(/Priority:/)).toBeInTheDocument();
    expect(screen.getByText((content, element) => {
      return element?.textContent === 'Priority: High Priority';
    })).toBeInTheDocument();
    expect(screen.getByText('Overdue')).toBeInTheDocument();
  });

  it('shows overdue count when available', () => {
    render(<TaskFilters {...mockProps} />);
    
    expect(screen.getByText('(2)', { exact: false })).toBeInTheDocument();
  });

  it('handles missing task counts gracefully', () => {
    render(<TaskFilters {...mockProps} taskCounts={undefined} />);
    
    expect(screen.getByText('Filters')).toBeInTheDocument();
    // Should not crash and should still render basic filter options
  });
});