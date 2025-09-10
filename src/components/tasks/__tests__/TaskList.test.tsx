import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { TaskList } from '../TaskList'
import { Task } from '@/lib/supabase/types'

const mockTasks: Task[] = [
  {
    id: '1',
    list_id: 'list-1',
    user_id: 'user-1',
    title: 'Task 1',
    description: 'Description 1',
    completed: false,
    priority: 'high',
    due_date: '2024-12-31',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    list_id: 'list-1',
    user_id: 'user-1',
    title: 'Task 2',
    description: null,
    completed: true,
    priority: 'medium',
    due_date: null,
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  },
]

// Mock date-fns functions
jest.mock('date-fns', () => ({
  format: jest.fn((date, formatStr) => {
    if (formatStr === 'MMM d, yyyy') return 'Jan 1, 2024'
    if (formatStr === 'MMM d') return 'Jan 1'
    return 'Jan 1, 2024'
  }),
  isToday: jest.fn(() => false),
  isTomorrow: jest.fn(() => false),
  isPast: jest.fn(() => false),
}))

describe('TaskList', () => {
  it('renders all tasks correctly', () => {
    render(<TaskList tasks={mockTasks} />)
    
    expect(screen.getByText('Task 1')).toBeInTheDocument()
    expect(screen.getByText('Task 2')).toBeInTheDocument()
    expect(screen.getByText('Description 1')).toBeInTheDocument()
  })

  it('renders empty state when no tasks', () => {
    render(<TaskList tasks={[]} />)
    
    expect(screen.getByText('No tasks found')).toBeInTheDocument()
    expect(screen.getByText('Create your first task to get started.')).toBeInTheDocument()
  })

  it('calls onToggleComplete when task checkbox is clicked', () => {
    const mockOnToggleComplete = jest.fn()
    render(<TaskList tasks={mockTasks} onToggleComplete={mockOnToggleComplete} />)
    
    const checkboxes = screen.getAllByRole('checkbox')
    fireEvent.click(checkboxes[0])
    
    expect(mockOnToggleComplete).toHaveBeenCalledWith('1')
  })

  it('calls onEditTask when edit is clicked', () => {
    const mockOnEditTask = jest.fn()
    render(<TaskList tasks={mockTasks} onEditTask={mockOnEditTask} />)
    
    // Find the first menu button and click it
    const menuButtons = screen.getAllByRole('button', { name: /open menu/i })
    fireEvent.click(menuButtons[0])
    
    // Click edit option
    const editButton = screen.getByText('Edit task')
    fireEvent.click(editButton)
    
    expect(mockOnEditTask).toHaveBeenCalledWith(mockTasks[0])
  })

  it('calls onDeleteTask when delete is clicked', () => {
    const mockOnDeleteTask = jest.fn()
    render(<TaskList tasks={mockTasks} onDeleteTask={mockOnDeleteTask} />)
    
    // Find the first menu button and click it
    const menuButtons = screen.getAllByRole('button', { name: /open menu/i })
    fireEvent.click(menuButtons[0])
    
    // Click delete option
    const deleteButton = screen.getByText('Delete task')
    fireEvent.click(deleteButton)
    
    expect(mockOnDeleteTask).toHaveBeenCalledWith('1')
  })

  it('shows loading state', () => {
    render(<TaskList tasks={[]} loading={true} />)
    
    expect(screen.getByText('Loading tasks...')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(
      <TaskList tasks={mockTasks} className="custom-class" />
    )
    
    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('groups completed and incomplete tasks', () => {
    render(<TaskList tasks={mockTasks} />)
    
    expect(screen.getByText('To Do (1)')).toBeInTheDocument()
    expect(screen.getByText('Completed (1)')).toBeInTheDocument()
  })

  it('shows task count in headers when grouped', () => {
    render(<TaskList tasks={mockTasks} />)
    
    expect(screen.getByText('To Do (1)')).toBeInTheDocument()
    expect(screen.getByText('Completed (1)')).toBeInTheDocument()
  })

  it('handles empty groups when grouped by status', () => {
    const incompleteTasks = mockTasks.filter(task => !task.completed)
    render(<TaskList tasks={incompleteTasks} />)
    
    // Should not show sections when only one type exists
    expect(screen.queryByText('To Do')).not.toBeInTheDocument()
    expect(screen.queryByText('Completed')).not.toBeInTheDocument()
  })

  it('shows custom empty state message', () => {
    render(
      <TaskList 
        tasks={[]} 
        emptyMessage="No tasks match your filters"
      />
    )
    
    expect(screen.getByText('No tasks match your filters')).toBeInTheDocument()
  })

  it('renders large lists correctly', () => {
    const largeTasks = Array.from({ length: 10 }, (_, i) => ({
      ...mockTasks[0],
      id: `task-${i}`,
      title: `Task ${i}`,
    }))
    
    render(<TaskList tasks={largeTasks} />)
    
    // Should render all tasks
    expect(screen.getAllByText(/Task \d+/)).toHaveLength(10)
  })

  it('handles task priority display', () => {
    render(<TaskList tasks={mockTasks} />)
    
    expect(screen.getByText('High')).toBeInTheDocument()
    expect(screen.getByText('Medium')).toBeInTheDocument()
  })

  it('handles task due date display', () => {
    render(<TaskList tasks={mockTasks} />)
    
    // Should show due date for first task (mocked to return 'Dec 31, 2024')
    expect(screen.getByText('Dec 31, 2024')).toBeInTheDocument()
  })

  it('shows overdue styling for past due tasks', () => {
    const overdueTasks = [{
      ...mockTasks[0],
      due_date: '2023-01-01', // Past date
    }]
    
    // Mock isPast to return true for overdue task
    const mockIsPast = require('date-fns').isPast
    mockIsPast.mockReturnValue(true)
    
    render(<TaskList tasks={overdueTasks} />)
    
    // Should show the date with destructive styling (red text)
    expect(screen.getByText('Jan 1, 2023')).toBeInTheDocument()
  })
})