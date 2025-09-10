import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { ListGrid } from '../ListGrid'
import { List } from '@/lib/supabase/types'

const mockLists: (List & { task_count: number })[] = [
  {
    id: '1',
    user_id: 'user1',
    name: 'List 1',
    description: 'Description 1',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    task_count: 5,
  },
  {
    id: '2',
    user_id: 'user1',
    name: 'List 2',
    description: null,
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
    task_count: 0,
  },
]

describe('ListGrid', () => {
  it('renders all lists correctly', () => {
    render(<ListGrid lists={mockLists} />)
    
    expect(screen.getByText('List 1')).toBeInTheDocument()
    expect(screen.getByText('List 2')).toBeInTheDocument()
    expect(screen.getByText('Description 1')).toBeInTheDocument()
    expect(screen.getByText('5 tasks')).toBeInTheDocument()
    expect(screen.getByText('0 tasks')).toBeInTheDocument()
  })

  it('renders empty state when no lists', () => {
    render(<ListGrid lists={[]} />)
    
    expect(screen.getByText('No lists yet')).toBeInTheDocument()
    expect(screen.getByText('Create your first list to get started organizing your tasks.')).toBeInTheDocument()
  })

  it('calls onListClick when a list is clicked', () => {
    const mockOnListClick = jest.fn()
    render(<ListGrid lists={mockLists} onListClick={mockOnListClick} />)
    
    const listCard = screen.getByText('List 1').closest('.cursor-pointer')
    fireEvent.click(listCard!)
    
    expect(mockOnListClick).toHaveBeenCalledWith('1')
  })

  it('calls onEditList when edit is clicked', () => {
    const mockOnEditList = jest.fn()
    render(<ListGrid lists={mockLists} onEditList={mockOnEditList} />)
    
    // Find the first menu button and click it
    const menuButtons = screen.getAllByRole('button', { name: /open menu/i })
    fireEvent.click(menuButtons[0])
    
    // Click edit option
    const editButton = screen.getByText('Edit list')
    fireEvent.click(editButton)
    
    expect(mockOnEditList).toHaveBeenCalledWith(mockLists[0])
  })

  it('calls onDeleteList when delete is clicked', () => {
    const mockOnDeleteList = jest.fn()
    render(<ListGrid lists={mockLists} onDeleteList={mockOnDeleteList} />)
    
    // Find the first menu button and click it
    const menuButtons = screen.getAllByRole('button', { name: /open menu/i })
    fireEvent.click(menuButtons[0])
    
    // Click delete option
    const deleteButton = screen.getByText('Delete list')
    fireEvent.click(deleteButton)
    
    expect(mockOnDeleteList).toHaveBeenCalledWith('1')
  })

  it('applies custom className', () => {
    const { container } = render(
      <ListGrid lists={mockLists} className="custom-class" />
    )
    
    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('renders loading state', () => {
    render(<ListGrid lists={[]} loading={true} />)
    
    // Should show skeleton loaders
    expect(screen.getAllByTestId('list-skeleton')).toHaveLength(3)
  })

  it('handles lists without task counts', () => {
    const listsWithoutTaskCount = mockLists.map(list => {
      const { task_count, ...listWithoutCount } = list
      return listWithoutCount as List
    })
    
    render(<ListGrid lists={listsWithoutTaskCount as any} />)
    
    expect(screen.getByText('List 1')).toBeInTheDocument()
    expect(screen.getByText('List 2')).toBeInTheDocument()
  })

  it('shows correct grid layout classes', () => {
    const { container } = render(<ListGrid lists={mockLists} />)
    
    const gridContainer = container.querySelector('.grid')
    expect(gridContainer).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3')
  })
})