import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ListForm } from '../ListForm'
import { List } from '@/lib/supabase/types'

const mockList: List = {
  id: '1',
  user_id: 'user1',
  name: 'Test List',
  description: 'Test Description',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

describe('ListForm', () => {
  const defaultProps = {
    open: true,
    onOpenChange: jest.fn(),
    onSubmit: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders create form correctly', () => {
    render(<ListForm {...defaultProps} />)
    
    expect(screen.getByRole('heading', { name: 'Create List' })).toBeInTheDocument()
    expect(screen.getByText('Create a new list to organize your tasks.')).toBeInTheDocument()
    expect(screen.getByLabelText(/list name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create list/i })).toBeInTheDocument()
  })

  it('renders edit form correctly', () => {
    render(<ListForm {...defaultProps} initialData={mockList} title="Edit List" description="Update your list details." submitText="Update List" />)
    
    expect(screen.getByText('Edit List')).toBeInTheDocument()
    expect(screen.getByText('Update your list details.')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Test List')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Test Description')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /update list/i })).toBeInTheDocument()
  })

  it('validates required fields', async () => {
    const user = userEvent.setup()
    render(<ListForm {...defaultProps} />)
    
    const submitButton = screen.getByRole('button', { name: /create list/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/List name is required/i)).toBeInTheDocument()
    })
  })

  it('submits form with valid data', async () => {
    const user = userEvent.setup()
    const mockSubmit = jest.fn().mockResolvedValue(undefined)
    
    render(<ListForm {...defaultProps} onSubmit={mockSubmit} />)
    
    const nameInput = screen.getByLabelText(/list name/i)
    const descriptionInput = screen.getByLabelText(/description/i)
    
    await user.type(nameInput, 'New List')
    await user.type(descriptionInput, 'New Description')
    
    const submitButton = screen.getByRole('button', { name: /create list/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith({
        name: 'New List',
        description: 'New Description',
      })
    })
  })

  it('handles form submission error gracefully', async () => {
    const user = userEvent.setup()
    const mockSubmit = jest.fn().mockRejectedValue(new Error('Submission failed'))
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
    
    render(<ListForm {...defaultProps} onSubmit={mockSubmit} />)
    
    const nameInput = screen.getByLabelText(/list name/i)
    await user.type(nameInput, 'New List')
    
    const submitButton = screen.getByRole('button', { name: /create list/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error submitting form:', expect.any(Error))
    })
    
    consoleSpy.mockRestore()
  })

  it('disables form when loading', () => {
    render(<ListForm {...defaultProps} isLoading={true} />)
    
    const nameInput = screen.getByLabelText(/list name/i)
    const submitButton = screen.getByRole('button', { name: /create list/i })
    
    expect(nameInput).toBeDisabled()
    expect(submitButton).toBeDisabled()
  })

  it('shows loading state during submission', async () => {
    const user = userEvent.setup()
    let resolveSubmit: () => void
    const mockSubmit = jest.fn(() => new Promise<void>((resolve) => {
      resolveSubmit = resolve
    }))
    
    render(<ListForm {...defaultProps} onSubmit={mockSubmit} />)
    
    const nameInput = screen.getByLabelText(/list name/i)
    await user.type(nameInput, 'New List')
    
    const submitButton = screen.getByRole('button', { name: /create list/i })
    await user.click(submitButton)
    
    expect(submitButton).toBeDisabled()
    
    // Resolve the promise to complete the test
    resolveSubmit!()
  })

  it('closes dialog on cancel', async () => {
    const user = userEvent.setup()
    const mockOnOpenChange = jest.fn()
    
    render(<ListForm {...defaultProps} onOpenChange={mockOnOpenChange} />)
    
    const cancelButton = screen.getByText('Cancel')
    await user.click(cancelButton)
    
    expect(mockOnOpenChange).toHaveBeenCalledWith(false)
  })

  it('validates name length', async () => {
    const user = userEvent.setup()
    render(<ListForm {...defaultProps} />)
    
    const nameInput = screen.getByLabelText(/list name/i)
    const longName = 'a'.repeat(101) // Assuming max length is 100
    
    await user.type(nameInput, longName)
    
    const submitButton = screen.getByRole('button', { name: /create list/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/must be less than 100 characters/i)).toBeInTheDocument()
    })
  })

  it('handles optional description', async () => {
    const user = userEvent.setup()
    const mockSubmit = jest.fn().mockResolvedValue(undefined)
    
    render(<ListForm {...defaultProps} onSubmit={mockSubmit} />)
    
    const nameInput = screen.getByLabelText(/list name/i)
    await user.type(nameInput, 'List without description')
    
    const submitButton = screen.getByRole('button', { name: /create list/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith({
        name: 'List without description',
        description: '',
      })
    })
  })
})