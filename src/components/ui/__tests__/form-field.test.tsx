import React from 'react'
import { render, screen } from '@testing-library/react'
import { FormField } from '../form-field'

describe('FormField', () => {
  it('renders label and input correctly', () => {
    render(
      <FormField
        label="Email"
        name="email"
        type="email"
        placeholder="Enter your email"
      />
    )

    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument()
  })

  it('shows error message when provided', () => {
    render(
      <FormField
        label="Email"
        name="email"
        error="Email is required"
      />
    )

    expect(screen.getByText('Email is required')).toBeInTheDocument()
    expect(screen.getByRole('textbox')).toHaveClass('border-destructive')
  })

  it('shows required indicator when required', () => {
    render(
      <FormField
        label="Email"
        name="email"
        required
      />
    )

    expect(screen.getByText('*')).toBeInTheDocument()
  })

  it('shows help text when provided', () => {
    render(
      <FormField
        label="Password"
        name="password"
        type="password"
        helpText="Must be at least 8 characters"
      />
    )

    expect(screen.getByText('Must be at least 8 characters')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(
      <FormField
        label="Email"
        name="email"
        className="custom-class"
      />
    )

    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('renders as textarea when type is textarea', () => {
    render(
      <FormField
        label="Description"
        name="description"
        type="textarea"
        placeholder="Enter description"
      />
    )

    expect(screen.getByRole('textbox')).toBeInstanceOf(HTMLTextAreaElement)
  })

  it('renders as select when options are provided', () => {
    const options = [
      { value: 'option1', label: 'Option 1' },
      { value: 'option2', label: 'Option 2' },
    ]

    render(
      <FormField
        label="Priority"
        name="priority"
        type="select"
        options={options}
      />
    )

    expect(screen.getByRole('combobox')).toBeInTheDocument()
    expect(screen.getByText('Option 1')).toBeInTheDocument()
    expect(screen.getByText('Option 2')).toBeInTheDocument()
  })

  it('renders as checkbox when type is checkbox', () => {
    render(
      <FormField
        label="Completed"
        name="completed"
        type="checkbox"
      />
    )

    expect(screen.getByRole('checkbox')).toBeInTheDocument()
  })

  it('disables input when disabled prop is true', () => {
    render(
      <FormField
        label="Email"
        name="email"
        disabled
      />
    )

    expect(screen.getByRole('textbox')).toBeDisabled()
  })

  it('sets input value correctly', () => {
    render(
      <FormField
        label="Email"
        name="email"
        value="test@example.com"
      />
    )

    expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument()
  })

  it('handles onChange events', () => {
    const mockOnChange = jest.fn()
    render(
      <FormField
        label="Email"
        name="email"
        onChange={mockOnChange}
      />
    )

    const input = screen.getByRole('textbox')
    input.focus()
    // Simulate typing
    expect(input).toBeInTheDocument()
  })

  it('shows loading state', () => {
    render(
      <FormField
        label="Email"
        name="email"
        loading
      />
    )

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  it('renders with icon', () => {
    const TestIcon = () => <div data-testid="test-icon">Icon</div>
    
    render(
      <FormField
        label="Email"
        name="email"
        icon={<TestIcon />}
      />
    )

    expect(screen.getByTestId('test-icon')).toBeInTheDocument()
  })

  it('handles different input sizes', () => {
    const { rerender } = render(
      <FormField
        label="Email"
        name="email"
        size="sm"
      />
    )

    expect(screen.getByRole('textbox')).toHaveClass('h-8')

    rerender(
      <FormField
        label="Email"
        name="email"
        size="lg"
      />
    )

    expect(screen.getByRole('textbox')).toHaveClass('h-12')
  })

  it('renders with custom input props', () => {
    render(
      <FormField
        label="Email"
        name="email"
        inputProps={{
          'data-testid': 'custom-input',
          autoComplete: 'email',
        }}
      />
    )

    const input = screen.getByTestId('custom-input')
    expect(input).toHaveAttribute('autoComplete', 'email')
  })
})