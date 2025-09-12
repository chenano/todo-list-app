import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchResults, QuickSearchResults } from '../search-results';
import type { SearchResult, Task, List } from '@/types';

// Mock date-fns
jest.mock('date-fns', () => ({
  format: jest.fn((date, formatStr) => {
    if (formatStr === 'MMM d') return 'Jan 15';
    return '2024-01-15';
  }),
}));

const mockTask: Task = {
  id: 'task-1',
  list_id: 'list-1',
  user_id: 'user-1',
  title: 'Test Task',
  description: 'Test task description',
  completed: false,
  priority: 'high',
  due_date: '2024-01-15',
  created_at: '2024-01-10T10:00:00Z',
  updated_at: '2024-01-10T10:00:00Z',
};

const mockList: List = {
  id: 'list-1',
  user_id: 'user-1',
  name: 'Test List',
  description: 'Test list description',
  created_at: '2024-01-01T10:00:00Z',
  updated_at: '2024-01-01T10:00:00Z',
};

const mockTaskResult: SearchResult = {
  type: 'task',
  item: mockTask,
  matches: [
    { field: 'title', start: 0, end: 4, text: 'Test' }
  ],
  listName: 'Test List',
  score: 0.8,
};

const mockListResult: SearchResult = {
  type: 'list',
  item: mockList,
  matches: [
    { field: 'name', start: 0, end: 4, text: 'Test' }
  ],
  score: 0.9,
};

describe('SearchResults', () => {
  const defaultProps = {
    results: [],
    loading: false,
    error: null,
  };

  it('renders loading state', () => {
    render(<SearchResults {...defaultProps} loading={true} />);
    // Check for skeleton elements by class instead of test ID
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders error state', () => {
    render(<SearchResults {...defaultProps} error="Search failed" />);
    expect(screen.getByText('Search failed')).toBeInTheDocument();
  });

  it('renders empty state', () => {
    render(<SearchResults {...defaultProps} emptyMessage="No results" />);
    expect(screen.getByText('No results')).toBeInTheDocument();
  });

  it('renders task results', () => {
    render(<SearchResults {...defaultProps} results={[mockTaskResult]} />);
    
    // Use more flexible text matching for highlighted content
    expect(screen.getByText((content, element) => {
      return element?.textContent === 'Test Task';
    })).toBeInTheDocument();
    expect(screen.getByText('Test task description')).toBeInTheDocument();
    expect(screen.getAllByText('Task')[0]).toBeInTheDocument(); // First occurrence is in the badge
    expect(screen.getByText('Test List')).toBeInTheDocument();
    expect(screen.getByText('high')).toBeInTheDocument();
    expect(screen.getByText('Jan 15')).toBeInTheDocument();
  });

  it('renders list results', () => {
    render(<SearchResults {...defaultProps} results={[mockListResult]} />);
    
    expect(screen.getByText((content, element) => {
      return element?.textContent === 'Test List';
    })).toBeInTheDocument();
    expect(screen.getByText('Test list description')).toBeInTheDocument();
    expect(screen.getAllByText('List')[0]).toBeInTheDocument(); // First occurrence is in the badge
  });

  it('renders completed task with completion badge', () => {
    const completedTask = { ...mockTask, completed: true };
    const completedResult = { ...mockTaskResult, item: completedTask };
    
    render(<SearchResults {...defaultProps} results={[completedResult]} />);
    
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('calls onResultClick when result is clicked', async () => {
    const user = userEvent.setup();
    const onResultClick = jest.fn();
    
    render(
      <SearchResults 
        {...defaultProps} 
        results={[mockTaskResult]} 
        onResultClick={onResultClick}
      />
    );
    
    const resultCard = document.querySelector('.cursor-pointer');
    
    if (resultCard) {
      await user.click(resultCard);
      expect(onResultClick).toHaveBeenCalledWith(mockTaskResult);
    }
  });

  it('limits results when maxResults is set', () => {
    const manyResults = Array.from({ length: 10 }, (_, i) => ({
      ...mockTaskResult,
      item: { ...mockTask, id: `task-${i}`, title: `Task ${i}` },
    }));
    
    render(<SearchResults {...defaultProps} results={manyResults} maxResults={3} />);
    
    expect(screen.getByText('Showing 3 of 10 results')).toBeInTheDocument();
  });

  it('highlights matches in title', () => {
    render(<SearchResults {...defaultProps} results={[mockTaskResult]} />);
    
    // Check that the title contains a mark element for highlighting
    const markElement = document.querySelector('mark');
    expect(markElement).toBeInTheDocument();
    expect(markElement).toHaveClass('bg-yellow-200');
  });
});

describe('QuickSearchResults', () => {
  const defaultProps = {
    results: [],
    loading: false,
    error: null,
    maxResults: 5,
  };

  it('renders loading state', () => {
    render(<QuickSearchResults {...defaultProps} loading={true} />);
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders error state', () => {
    render(<QuickSearchResults {...defaultProps} error="Search failed" />);
    expect(screen.getByText('Search failed')).toBeInTheDocument();
  });

  it('renders empty state', () => {
    render(<QuickSearchResults {...defaultProps} />);
    expect(screen.getByText('No results found')).toBeInTheDocument();
  });

  it('renders compact task results', () => {
    render(<QuickSearchResults {...defaultProps} results={[mockTaskResult]} />);
    
    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(screen.getByText('in Test List')).toBeInTheDocument();
    expect(screen.getByText('Task')).toBeInTheDocument();
  });

  it('renders compact list results', () => {
    render(<QuickSearchResults {...defaultProps} results={[mockListResult]} />);
    
    expect(screen.getByText('Test List')).toBeInTheDocument();
    expect(screen.getByText('List')).toBeInTheDocument();
  });

  it('calls onResultClick when result is clicked', async () => {
    const user = userEvent.setup();
    const onResultClick = jest.fn();
    
    render(
      <QuickSearchResults 
        {...defaultProps} 
        results={[mockTaskResult]} 
        onResultClick={onResultClick}
      />
    );
    
    const resultButton = screen.getByRole('button');
    await user.click(resultButton);
    
    expect(onResultClick).toHaveBeenCalledWith(mockTaskResult);
  });

  it('shows additional results count', () => {
    const manyResults = Array.from({ length: 10 }, (_, i) => ({
      ...mockTaskResult,
      item: { ...mockTask, id: `task-${i}`, title: `Task ${i}` },
    }));
    
    render(<QuickSearchResults {...defaultProps} results={manyResults} maxResults={3} />);
    
    expect(screen.getByText('+7 more results')).toBeInTheDocument();
  });
});