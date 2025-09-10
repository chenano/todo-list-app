import React from 'react'
import { render, screen } from '@testing-library/react'
import { LoadingSpinner } from '../loading-spinner'

describe('LoadingSpinner', () => {
  it('renders spinner correctly', () => {
    render(<LoadingSpinner />)
    
    const spinner = screen.getByTestId('loading-spinner')
    expect(spinner).toBeInTheDocument()
    expect(spinner).toHaveClass('animate-spin')
  })

  it('renders with custom size', () => {
    render(<LoadingSpinner size="lg" />)
    
    const spinner = screen.getByTestId('loading-spinner')
    expect(spinner).toHaveClass('h-8', 'w-8')
  })

  it('renders with small size', () => {
    render(<LoadingSpinner size="sm" />)
    
    const spinner = screen.getByTestId('loading-spinner')
    expect(spinner).toHaveClass('h-4', 'w-4')
  })

  it('renders with default size', () => {
    render(<LoadingSpinner />)
    
    const spinner = screen.getByTestId('loading-spinner')
    expect(spinner).toHaveClass('h-6', 'w-6')
  })

  it('applies custom className', () => {
    render(<LoadingSpinner className="custom-class" />)
    
    const spinner = screen.getByTestId('loading-spinner')
    expect(spinner).toHaveClass('custom-class')
  })

  it('renders with custom color', () => {
    render(<LoadingSpinner className="text-blue-500" />)
    
    const spinner = screen.getByTestId('loading-spinner')
    expect(spinner).toHaveClass('text-blue-500')
  })

  it('has proper accessibility attributes', () => {
    render(<LoadingSpinner />)
    
    const spinner = screen.getByTestId('loading-spinner')
    expect(spinner).toHaveAttribute('role', 'status')
    expect(spinner).toHaveAttribute('aria-label', 'Loading')
  })

  it('renders with custom aria-label', () => {
    render(<LoadingSpinner aria-label="Loading data" />)
    
    const spinner = screen.getByTestId('loading-spinner')
    expect(spinner).toHaveAttribute('aria-label', 'Loading data')
  })

  it('can be hidden from screen readers', () => {
    render(<LoadingSpinner aria-hidden="true" />)
    
    const spinner = screen.getByTestId('loading-spinner')
    expect(spinner).toHaveAttribute('aria-hidden', 'true')
  })

  it('renders with text label', () => {
    render(<LoadingSpinner showText text="Loading..." />)
    
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('renders with default text when showText is true', () => {
    render(<LoadingSpinner showText />)
    
    expect(screen.getByText('Loading')).toBeInTheDocument()
  })

  it('centers content when centered prop is true', () => {
    render(<LoadingSpinner centered />)
    
    const container = screen.getByTestId('loading-spinner').parentElement
    expect(container).toHaveClass('flex', 'justify-center', 'items-center')
  })

  it('renders inline by default', () => {
    render(<LoadingSpinner />)
    
    const spinner = screen.getByTestId('loading-spinner')
    expect(spinner).toHaveClass('inline-block')
  })

  it('can render as block element', () => {
    render(<LoadingSpinner block />)
    
    const spinner = screen.getByTestId('loading-spinner')
    expect(spinner).toHaveClass('block')
  })
})