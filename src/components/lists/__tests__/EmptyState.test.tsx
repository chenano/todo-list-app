import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { EmptyState } from '../EmptyState'

describe('EmptyState', () => {
  it('renders default empty state', () => {
    render(<EmptyState />)
    
    expect(screen.getByText('No items found')).toBeInTheDocument()
    expect(screen.getByText('There are no items to display at the moment.')).toBeInTheDocument()
  })

  it('renders custom title and description', () => {
    render(
      <EmptyState 
        title="Custom Title"
        description="Custom description text"
      />
    )
    
    expect(screen.getByText('Custom Title')).toBeInTheDocument()
    expect(screen.getByText('Custom description text')).toBeInTheDocument()
  })

  it('renders with action button', () => {
    const mockAction = jest.fn()
    render(
      <EmptyState 
        title="No Lists"
        description="Create your first list"
        action={{
          label: 'Create List',
          onClick: mockAction
        }}
      />
    )
    
    const actionButton = screen.getByRole('button', { name: 'Create List' })
    expect(actionButton).toBeInTheDocument()
    
    fireEvent.click(actionButton)
    expect(mockAction).toHaveBeenCalledTimes(1)
  })

  it('renders with custom icon', () => {
    const CustomIcon = () => <div data-testid="custom-icon">Custom Icon</div>
    
    render(
      <EmptyState 
        icon={<CustomIcon />}
        title="Custom Empty State"
      />
    )
    
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(
      <EmptyState className="custom-class" />
    )
    
    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('renders without icon when none provided', () => {
    render(
      <EmptyState 
        title="No Icon State"
        showIcon={false}
      />
    )
    
    expect(screen.getByText('No Icon State')).toBeInTheDocument()
    // Should not have default icon
    expect(screen.queryByTestId('default-icon')).not.toBeInTheDocument()
  })

  it('renders with different sizes', () => {
    const { rerender } = render(
      <EmptyState size="sm" title="Small State" />
    )
    
    expect(screen.getByText('Small State')).toBeInTheDocument()
    
    rerender(<EmptyState size="lg" title="Large State" />)
    expect(screen.getByText('Large State')).toBeInTheDocument()
  })

  it('handles long text content', () => {
    const longTitle = 'This is a very long title that should wrap properly'
    const longDescription = 'This is a very long description that should also wrap properly and maintain good readability across multiple lines'
    
    render(
      <EmptyState 
        title={longTitle}
        description={longDescription}
      />
    )
    
    expect(screen.getByText(longTitle)).toBeInTheDocument()
    expect(screen.getByText(longDescription)).toBeInTheDocument()
  })

  it('renders action button with correct styling', () => {
    render(
      <EmptyState 
        action={{
          label: 'Primary Action',
          onClick: jest.fn(),
          variant: 'default'
        }}
      />
    )
    
    const actionButton = screen.getByRole('button', { name: 'Primary Action' })
    expect(actionButton).toHaveClass('bg-primary')
  })

  it('renders secondary action button', () => {
    render(
      <EmptyState 
        action={{
          label: 'Secondary Action',
          onClick: jest.fn(),
          variant: 'outline'
        }}
      />
    )
    
    const actionButton = screen.getByRole('button', { name: 'Secondary Action' })
    expect(actionButton).toHaveClass('border-input')
  })
})