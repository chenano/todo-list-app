import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DeleteListDialog } from '../DeleteListDialog'
import { List } from '@/lib/supabase/types'

const mockList: List & { task_count: number } = {
  id: '1',
  user_id: 'user1',
  name: 'Test List',
  description: 'Test Description',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  task_count: 5,
}

describe('DeleteListDialog', () => {
  const defaultProps = {
    open: true,
    onOpenChange: jest.fn(),
    onConfirm: jest.fn(),
    list: mockList,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders dialog with list information', () => {
    render(<DeleteListDialog {...defaultProps} />)
    
    expect(screen.getByText('Delete List')).toBeInTheDocument()
    expect(screen.getByText(/are you sure you want to delete/i)).toBeInTheDocument()
    expect(screen.getByText('Test List')).toBeInTheDocument()
    expect(screen.getByText(/this will also delete all 5 tasks/i)).toBeInTheDocument()
  })

  it('shows singular task message for one task', () => {
    const listWithOneTask = { ...mockList, task_count: 1 }
    render(<DeleteListDialog {...defaultProps} list={listWithOneTask} />)
    
    expect(screen.getByText(/this will also delete 1 task/i)).toBeInTheDocument()
  })

  it('shows no tasks message for empty list', () => {
    const emptyList = { ...mockList, task_count: 0 }
    render(<DeleteListDialog {...defaultProps} list={emptyList} />)
    
    expect(screen.queryByText(/this will also delete/i)).not.toBeInTheDocument()
  })

  it('calls onConfirm when delete is confirmed', async () => {
    const user = userEvent.setup()
    const mockOnConfirm = jest.fn().mockResolvedValue(undefined)
    
    render(<DeleteListDialog {...defaultProps} onConfirm={mockOnConfirm} />)
    
    const deleteButton = screen.getByRole('button', { name: /delete/i })
    await user.click(deleteButton)
    
    expect(mockOnConfirm).toHaveBeenCalledWith('1')
  })

  it('calls onOpenChange when cancel is clicked', async () => {
    const user = userEvent.setup()
    const mockOnOpenChange = jest.fn()
    
    render(<DeleteListDialog {...defaultProps} onOpenChange={mockOnOpenChange} />)
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    await user.click(cancelButton)
    
    expect(mockOnOpenChange).toHaveBeenCalledWith(false)
  })

  it('shows loading state during deletion', async () => {
    const user = userEvent.setup()
    let resolveDelete: () => void
    const mockOnConfirm = jest.fn(() => new Promise<void>((resolve) => {
      resolveDelete = resolve
    }))
    
    render(<DeleteListDialog {...defaultProps} onConfirm={mockOnConfirm} />)
    
    const deleteButton = screen.getByRole('button', { name: /delete/i })
    await user.click(deleteButton)
    
    expect(screen.getByText('Deleting...')).toBeInTheDocument()
    expect(deleteButton).toBeDisabled()
    
    // Resolve the promise to complete the test
    resolveDelete!()
  })

  it('handles deletion error gracefully', async () => {
    const user = userEvent.setup()
    const mockOnConfirm = jest.fn().mockRejectedValue(new Error('Deletion failed'))
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
    
    render(<DeleteListDialog {...defaultProps} onConfirm={mockOnConfirm} />)
    
    const deleteButton = screen.getByRole('button', { name: /delete/i })
    await user.click(deleteButton)
    
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error deleting list:', expect.any(Error))
    })
    
    consoleSpy.mockRestore()
  })

  it('disables buttons when loading prop is true', () => {
    render(<DeleteListDialog {...defaultProps} loading={true} />)
    
    const deleteButton = screen.getByRole('button', { name: /delete/i })
    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    
    expect(deleteButton).toBeDisabled()
    expect(cancelButton).toBeDisabled()
  })

  it('shows destructive styling on delete button', () => {
    render(<DeleteListDialog {...defaultProps} />)
    
    const deleteButton = screen.getByRole('button', { name: /delete/i })
    expect(deleteButton).toHaveClass('bg-destructive')
  })

  it('handles list without description', () => {
    const listWithoutDescription = { ...mockList, description: null }
    render(<DeleteListDialog {...defaultProps} list={listWithoutDescription} />)
    
    expect(screen.getByText('Test List')).toBeInTheDocument()
    expect(screen.getByText(/are you sure you want to delete/i)).toBeInTheDocument()
  })
})