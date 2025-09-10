import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginForm } from '../LoginForm'
import { AuthProvider } from '@/contexts/AuthContext'
import { it } from 'date-fns/locale'
import { it } from 'date-fns/locale'
import { it } from 'date-fns/locale'
import { it } from 'date-fns/locale'
import { it } from 'date-fns/locale'
import { it } from 'date-fns/locale'
import { it } from 'date-fns/locale'
import { beforeEach } from 'node:test'
import { describe } from 'yargs'

// Mock the Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: jest.fn(),
      getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: jest.fn().mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } }
      })
    }
  })
}))

const MockedAuthProvider = ({ children }: { children: React.ReactNode }) => {
  return <AuthProvider>{children}</AuthProvider>
}

describe('LoginForm', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders login form with all required fields', () => {
    render(
      <MockedAuthProvider>
        <LoginForm />
      </MockedAuthProvider>
    )

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Sign In')
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('shows validation errors for empty fields', async () => {
    render(
      <MockedAuthProvider>
        <LoginForm />
      </MockedAuthProvider>
    )

    const submitButton = screen.getByRole('button', { name: /sign in/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/Email is required/)).toBeInTheDocument()
      expect(screen.getByText(/Password is required/)).toBeInTheDocument()
    })
  })

  it('shows validation error for invalid email format', async () => {
    render(
      <MockedAuthProvider>
        <LoginForm />
      </MockedAuthProvider>
    )

    const emailInput = screen.getByLabelText(/email/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    await user.type(emailInput, 'invalid-email')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/Please enter a valid email address/)).toBeInTheDocument()
    })
  })

  it('shows validation error for short password', async () => {
    render(
      <MockedAuthProvider>
        <LoginForm />
      </MockedAuthProvider>
    )

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, '123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/Password must be at least 8 characters/)).toBeInTheDocument()
    })
  })

  it('toggles password visibility', async () => {
    render(
      <MockedAuthProvider>
        <LoginForm />
      </MockedAuthProvider>
    )

    const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement
    const toggleButton = screen.getByRole('button', { name: '' }) // Eye icon button

    expect(passwordInput.type).toBe('password')

    await user.click(toggleButton)
    expect(passwordInput.type).toBe('text')

    await user.click(toggleButton)
    expect(passwordInput.type).toBe('password')
  })

  it('calls onSwitchToRegister when register link is clicked', async () => {
    const mockOnSwitchToRegister = jest.fn()

    render(
      <MockedAuthProvider>
        <LoginForm onSwitchToRegister={mockOnSwitchToRegister} />
      </MockedAuthProvider>
    )

    const registerLink = screen.getByRole('button', { name: /sign up/i })
    await user.click(registerLink)

    expect(mockOnSwitchToRegister).toHaveBeenCalledTimes(1)
  })

  it('has proper form structure', () => {
    render(
      <MockedAuthProvider>
        <LoginForm />
      </MockedAuthProvider>
    )

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    expect(emailInput).toHaveAttribute('type', 'email')
    expect(passwordInput).toHaveAttribute('type', 'password')
    expect(submitButton).toHaveAttribute('type', 'submit')
  })
})