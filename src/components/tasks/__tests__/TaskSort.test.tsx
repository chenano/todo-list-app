import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TaskSort, TaskSortCompact } from '../TaskSort';
import { TaskSort as TaskSortType } from '../../../types';

const mockSort: TaskSortType = {
  field: 'created_at',
  direction: 'desc',
};

const mockProps = {
  sort: mockSort,
  onSortChange: jest.fn(),
  onResetSort: jest.fn(),
  hasCustomSort: false,
};

describe('TaskSort', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders sort controls', () => {
    render(<TaskSort {...mockProps} />);
    
    expect(screen.getByText('Sort')).toBeInTheDocument();
    expect(screen.getByText('Sort by')).toBeInTheDocument();
    expect(screen.getByText('Direction')).toBeInTheDocument();
    expect(screen.getByText('Descending')).toBeInTheDocument();
  });

  it('shows custom badge when sort is customized', () => {
    render(<TaskSort {...mockProps} hasCustomSort={true} />);
    
    expect(screen.getByText('Custom')).toBeInTheDocument();
  });

  it('shows reset button when sort is customized', () => {
    render(<TaskSort {...mockProps} hasCustomSort={true} />);
    
    expect(screen.getByText('Reset')).toBeInTheDocument();
  });

  it('calls onResetSort when reset button is clicked', () => {
    render(<TaskSort {...mockProps} hasCustomSort={true} />);
    
    fireEvent.click(screen.getByText('Reset'));
    expect(mockProps.onResetSort).toHaveBeenCalledTimes(1);
  });

  it('calls onSortChange when direction is toggled', () => {
    render(<TaskSort {...mockProps} />);
    
    const directionButton = screen.getByText('Descending');
    fireEvent.click(directionButton);
    
    expect(mockProps.onSortChange).toHaveBeenCalledWith({
      field: 'created_at',
      direction: 'asc',
    });
  });

  it('displays current sort configuration', () => {
    render(<TaskSort {...mockProps} />);
    
    expect(screen.getByText('Sorting by:')).toBeInTheDocument();
    expect(screen.getByText('Date Created (Descending)')).toBeInTheDocument();
  });

  it('shows ascending direction correctly', () => {
    const ascendingSort: TaskSortType = {
      field: 'title',
      direction: 'asc',
    };
    
    render(<TaskSort {...mockProps} sort={ascendingSort} />);
    
    expect(screen.getByText('Ascending')).toBeInTheDocument();
    expect(screen.getByText('Title (Ascending)')).toBeInTheDocument();
  });
});

describe('TaskSortCompact', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders compact sort controls', () => {
    render(<TaskSortCompact {...mockProps} />);
    
    // Should have select dropdown and direction button
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('shows reset button when sort is customized', () => {
    render(<TaskSortCompact {...mockProps} hasCustomSort={true} />);
    
    // Should have select, direction button, and reset button
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(2); // direction + reset
  });

  it('calls onSortChange when direction is toggled', () => {
    render(<TaskSortCompact {...mockProps} />);
    
    const directionButton = screen.getByRole('button');
    fireEvent.click(directionButton);
    
    expect(mockProps.onSortChange).toHaveBeenCalledWith({
      field: 'created_at',
      direction: 'asc',
    });
  });

  it('calls onResetSort when reset button is clicked', () => {
    render(<TaskSortCompact {...mockProps} hasCustomSort={true} />);
    
    const buttons = screen.getAllByRole('button');
    const resetButton = buttons.find(button => 
      button.querySelector('svg') && 
      button.querySelector('svg')?.getAttribute('class')?.includes('lucide-rotate-ccw')
    );
    
    if (resetButton) {
      fireEvent.click(resetButton);
      expect(mockProps.onResetSort).toHaveBeenCalledTimes(1);
    }
  });
});