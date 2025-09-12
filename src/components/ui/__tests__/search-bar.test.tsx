import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchBar } from '../search-bar';

describe('SearchBar', () => {
  const defaultProps = {
    value: '',
    onChange: jest.fn(),
    onClear: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with placeholder text', () => {
    render(<SearchBar {...defaultProps} placeholder="Search here..." />);
    expect(screen.getByPlaceholderText('Search here...')).toBeInTheDocument();
  });

  it('displays the current value', () => {
    render(<SearchBar {...defaultProps} value="test query" />);
    expect(screen.getByDisplayValue('test query')).toBeInTheDocument();
  });

  it('calls onChange when typing', async () => {
    const user = userEvent.setup();
    render(<SearchBar {...defaultProps} />);
    
    const input = screen.getByRole('textbox');
    await user.type(input, 'hello');
    
    // userEvent.type calls onChange for each character
    expect(defaultProps.onChange).toHaveBeenCalledTimes(5);
    // Check that the last call was with 'o' (the last character)
    expect(defaultProps.onChange).toHaveBeenLastCalledWith('o');
  });

  it('shows clear button when value is present', () => {
    render(<SearchBar {...defaultProps} value="test" />);
    expect(screen.getByRole('button', { name: /clear search/i })).toBeInTheDocument();
  });

  it('hides clear button when value is empty', () => {
    render(<SearchBar {...defaultProps} value="" />);
    expect(screen.queryByRole('button', { name: /clear search/i })).not.toBeInTheDocument();
  });

  it('calls onClear when clear button is clicked', async () => {
    const user = userEvent.setup();
    render(<SearchBar {...defaultProps} value="test" />);
    
    const clearButton = screen.getByRole('button', { name: /clear search/i });
    await user.click(clearButton);
    
    expect(defaultProps.onClear).toHaveBeenCalled();
  });

  it('shows suggestions when focused and has suggestions', async () => {
    const user = userEvent.setup();
    const suggestions = ['suggestion 1', 'suggestion 2'];
    
    render(
      <SearchBar 
        {...defaultProps} 
        value="test"
        suggestions={suggestions}
        showSuggestions={true}
      />
    );
    
    const input = screen.getByRole('textbox');
    await user.click(input);
    
    expect(screen.getByText('suggestion 1')).toBeInTheDocument();
    expect(screen.getByText('suggestion 2')).toBeInTheDocument();
  });

  it('shows recent searches when focused and no value', async () => {
    const user = userEvent.setup();
    const recentSearches = ['recent 1', 'recent 2'];
    
    render(
      <SearchBar 
        {...defaultProps} 
        value=""
        recentSearches={recentSearches}
        showSuggestions={true}
      />
    );
    
    const input = screen.getByRole('textbox');
    await user.click(input);
    
    expect(screen.getByText('Recent searches')).toBeInTheDocument();
    expect(screen.getByText('recent 1')).toBeInTheDocument();
    expect(screen.getByText('recent 2')).toBeInTheDocument();
  });

  it('calls onSuggestionSelect when suggestion is clicked', async () => {
    const user = userEvent.setup();
    const onSuggestionSelect = jest.fn();
    const suggestions = ['test suggestion'];
    
    render(
      <SearchBar 
        {...defaultProps} 
        value="test"
        suggestions={suggestions}
        onSuggestionSelect={onSuggestionSelect}
        showSuggestions={true}
      />
    );
    
    const input = screen.getByRole('textbox');
    await user.click(input);
    
    const suggestion = screen.getByText('test suggestion');
    await user.click(suggestion);
    
    expect(onSuggestionSelect).toHaveBeenCalledWith('test suggestion');
  });

  it('navigates suggestions with arrow keys', async () => {
    const user = userEvent.setup();
    const suggestions = ['suggestion 1', 'suggestion 2'];
    
    render(
      <SearchBar 
        {...defaultProps} 
        value="test"
        suggestions={suggestions}
        showSuggestions={true}
      />
    );
    
    const input = screen.getByRole('textbox');
    await user.click(input);
    
    // Arrow down should select first suggestion
    await user.keyboard('{ArrowDown}');
    
    // The first suggestion should have focus/selection styling
    const firstSuggestion = screen.getByText('suggestion 1').closest('button');
    expect(firstSuggestion).toHaveClass('bg-accent');
  });

  it('selects suggestion with Enter key', async () => {
    const user = userEvent.setup();
    const onSuggestionSelect = jest.fn();
    const suggestions = ['test suggestion'];
    
    render(
      <SearchBar 
        {...defaultProps} 
        value="test"
        suggestions={suggestions}
        onSuggestionSelect={onSuggestionSelect}
        showSuggestions={true}
      />
    );
    
    const input = screen.getByRole('textbox');
    await user.click(input);
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Enter}');
    
    expect(onSuggestionSelect).toHaveBeenCalledWith('test suggestion');
  });

  it('closes suggestions with Escape key', async () => {
    const user = userEvent.setup();
    const suggestions = ['suggestion 1'];
    
    render(
      <SearchBar 
        {...defaultProps} 
        value="test"
        suggestions={suggestions}
        showSuggestions={true}
      />
    );
    
    const input = screen.getByRole('textbox');
    await user.click(input);
    
    expect(screen.getByText('suggestion 1')).toBeInTheDocument();
    
    await user.keyboard('{Escape}');
    
    await waitFor(() => {
      expect(screen.queryByText('suggestion 1')).not.toBeInTheDocument();
    });
  });

  it('shows loading state', () => {
    render(<SearchBar {...defaultProps} loading={true} />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('animate-pulse');
  });

  it('auto-focuses when autoFocus is true', () => {
    render(<SearchBar {...defaultProps} autoFocus={true} />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveFocus();
  });
});