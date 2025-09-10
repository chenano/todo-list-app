import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PrioritySelect, PriorityBadge } from '../priority-select'

describe('PrioritySelect', () => {
  it('renders with placeholder text', () => {
    render(<PrioritySelect placeholder="Select priority" />)
    expect(screen.getByText('Select priority')).toBeInTheDocument()
  })

  it('shows selected priority', () => {
    render(<PrioritySelect value="high" />)
    expect(screen.getByText('High')).toBeInTheDocument()
  })
})

describe('PriorityBadge', () => {
  it('renders high priority badge', () => {
    render(<PriorityBadge priority="high" />)
    expect(screen.getByText('High')).toBeInTheDocument()
  })

  it('renders medium priority badge', () => {
    render(<PriorityBadge priority="medium" />)
    expect(screen.getByText('Medium')).toBeInTheDocument()
  })

  it('renders low priority badge', () => {
    render(<PriorityBadge priority="low" />)
    expect(screen.getByText('Low')).toBeInTheDocument()
  })
})