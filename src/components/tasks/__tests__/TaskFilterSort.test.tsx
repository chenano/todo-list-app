import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TaskFilterSort, QuickFilters } from '../TaskFilterSort';
import { TaskFilters, TaskSort } from '../../../types';

const mockFilters: TaskFilters = {
  status: 'all',
  priority: 'all',
  overdue: false,
};

const mockSort: TaskSort = {
  field: 'created_at',
  direction: 'desc',
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
  sort: mockSort,
  onFiltersChange: jest.fn(),
  onSortChange: jest.fn(),
  onClearFilters: jest.fn(),
  onResetSort: jest.fn(),
  onReset: jest.fn(),
  hasActiveFilters: false,
  hasCustomSort: false,
  taskCounts: mockTaskCounts,
};

describe('TaskFilterSort', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders filter and sort toggle button', () => {
    render(<TaskFilterSort {...mockProps} />);
    
    expect(screen.getByText('Filter & Sort Tasks')).toBeInTheDocument();
  });

  it('shows customization badge when filters or sort are active', () => {
    render(
      <TaskFilterSort 
        {...mockProps} 
        hasActiveFilters={true} 
        hasCustomSort={true} 
      />
    );
    
    expect(screen.getByText('Filtered, Sorted')).toBeInTheDocument();
  });

  it('expands to show filter and sort controls when clicked', () => {
    render(<TaskFilterSort {...mockProps} defaultOpen={true} />);
    
    expect(screen.getByText('Filters')).toBeInTheDocument();
    expect(screen.getByText('Sort')).toBeInTheDocument();
  });

  it('shows reset all button when customizations are active', () => {
    render(
      <TaskFilterSort 
        {...mockProps} 
        hasActiveFilters={true} 
        defaultOpen={true} 
      />
    );
    
    expect(screen.getByText('Reset All Filters & Sort')).toBeInTheDocument();
  });

  it('calls onReset when reset all button is clicked', () => {
    render(
      <TaskFilterSort 
        {...mockProps} 
        hasActiveFilters={true} 
        defaultOpen={true} 
      />
    );
    
    fireEvent.click(screen.getByText('Reset All Filters & Sort'));
    expect(mockProps.onReset).toHaveBeenCalledTimes(1);
  });

  describe('compact mode', () => {
    it('renders compact layout', () => {
      render(<TaskFilterSort {...mockProps} compact={true} />);
      
      expect(screen.getByText('Sort & Filter')).toBeInTheDocument();
      // Should show compact sort controls
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('shows reset all button in compact mode when customizations are active', () => {
      render(
        <TaskFilterSort 
          {...mockProps} 
          compact={true} 
          hasActiveFilters={true} 
        />
      );
      
      expect(screen.getByText('Reset All')).toBeInTheDocument();
    });

    it('calls onReset when compact reset button is clicked', () => {
      render(
        <TaskFilterSort 
          {...mockProps} 
          compact={true} 
          hasActiveFilters={true} 
        />
      );
      
      fireEvent.click(screen.getByText('Reset All'));
      expect(mockProps.onReset).toHaveBeenCalledTimes(1);
    });
  });
});

describe('QuickFilters', () => {
  const mockQuickFiltersProps = {
    onApplyPreset: jest.fn(),
    currentFilters: mockFilters,
    currentSort: mockSort,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders preset filter buttons', () => {
    render(<QuickFilters {...mockQuickFiltersProps} />);
    
    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('To Do')).toBeInTheDocument();
    expect(screen.getByText('Done')).toBeInTheDocument();
    expect(screen.getByText('High Priority')).toBeInTheDocument();
    expect(screen.getByText('Overdue')).toBeInTheDocument();
  });

  it('highlights active preset', () => {
    render(<QuickFilters {...mockQuickFiltersProps} />);
    
    // The "All" preset should be active by default (matches mockFilters and mockSort)
    const allButton = screen.getByText('All');
    expect(allButton).toHaveClass('bg-primary'); // Default variant styling
  });

  it('calls onApplyPreset when preset button is clicked', () => {
    render(<QuickFilters {...mockQuickFiltersProps} />);
    
    fireEvent.click(screen.getByText('To Do'));
    
    expect(mockQuickFiltersProps.onApplyPreset).toHaveBeenCalledWith(
      { status: 'incomplete', priority: 'all', overdue: false },
      { field: 'created_at', direction: 'desc' }
    );
  });

  it('applies high priority preset correctly', () => {
    render(<QuickFilters {...mockQuickFiltersProps} />);
    
    fireEvent.click(screen.getByText('High Priority'));
    
    expect(mockQuickFiltersProps.onApplyPreset).toHaveBeenCalledWith(
      { status: 'incomplete', priority: 'high', overdue: false },
      { field: 'due_date', direction: 'asc' }
    );
  });

  it('applies overdue preset correctly', () => {
    render(<QuickFilters {...mockQuickFiltersProps} />);
    
    fireEvent.click(screen.getByText('Overdue'));
    
    expect(mockQuickFiltersProps.onApplyPreset).toHaveBeenCalledWith(
      { status: 'incomplete', priority: 'all', overdue: true },
      { field: 'due_date', direction: 'asc' }
    );
  });
});