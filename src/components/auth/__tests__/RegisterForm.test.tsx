import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RegisterForm } from '../RegisterForm'
import { AuthProvider } from '@/contexts/AuthContext'

// Mock the Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signUp: jest.fn(),
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

describe('RegisterForm', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders registration form with all required fields', () => {
    render(
      <MockedAuthProvider>
        <RegisterForm />
      </MockedAuthProvider>
    )

    expect(screen.getByText(/create account/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
  })

  it('shows validation errors for empty fields', async () => {
    render(
      <MockedAuthProvider>
        <RegisterForm />
      </MockedAuthProvider>
    )

    const submitButton = screen.getByRole('button', { name: /create account/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument()
      expect(screen.getByText(/password is required/i)).toBeInTheDocument()
      expect(screen.getByText(/please confirm your password/i)).toBeInTheDocument()
    })
  })

  it('shows validation error for invalid email format', async () => {
    render(
      <MockedAuthProvider>
        <RegisterForm />
      </MockedAuthProvider>
    )

    const emailInput = screen.getByLabelText(/email/i)
    const submitButton = screen.getByRole('button', { name: /create account/i })

    await user.type(emailInput, 'invalid-email')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/Please enter a valid email address/)).toBeInTheDocument()
    })
  })

  it('shows validation error for weak password', async () => {
    render(
      <MockedAuthProvider>
        <RegisterForm />
      </MockedAuthProvider>
    )

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText('Password')
    const submitButton = screen.getByRole('button', { name: /create account/i })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'weak')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/Password must be at least 8 characters/)).toBeInTheDocument()
    })
  })

  it('shows validation error for mismatched passwords', async () => {
    render(
      <MockedAuthProvider>
        <RegisterForm />
      </MockedAuthProvider>
    )

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText('Password')
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    const submitButton = screen.getByRole('button', { name: /create account/i })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'Password123')
    await user.type(confirmPasswordInput, 'DifferentPassword123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument()
    })
  })

  it('displays password strength indicator', async () => {
    render(
      <MockedAuthProvider>
        <RegisterForm />
      </MockedAuthProvider>
    )

    const passwordInput = screen.getByLabelText('Password')

    await user.type(passwordInput, 'weak')
    expect(screen.getByText(/Very Weak/)).toBeInTheDocument()

    await user.clear(passwordInput)
    await user.type(passwordInput, 'StrongPassword123!')
    expect(screen.getByText(/Strong/)).toBeInTheDocument()
  })

  it('shows password requirements checklist', async () => {
    render(
      <MockedAuthProvider>
        <RegisterForm />
      </MockedAuthProvider>
    )

    const passwordInput = screen.getByLabelText('Password')
    await user.type(passwordInput, 'P')

    expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument()
    expect(screen.getByText(/one lowercase letter/i)).toBeInTheDocument()
    expect(screen.getByText(/one uppercase letter/i)).toBeInTheDocument()
    expect(screen.getByText(/one number/i)).toBeInTheDocument()
  })

  it('toggles password visibility for both password fields', async () => {
    render(
      <MockedAuthProvider>
        <RegisterForm />
      </MockedAuthProvider>
    )

    const passwordInput = screen.getByLabelText('Password') as HTMLInputElement
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i) as HTMLInputElement
    const toggleButtons = screen.getAllByRole('button', { name: '' }) // Eye icon buttons

    expect(passwordInput.type).toBe('password')
    expect(confirmPasswordInput.type).toBe('password')

    // Toggle password visibility
    await user.click(toggleButtons[0])
    expect(passwordInput.type).toBe('text')

    // Toggle confirm password visibility
    await user.click(toggleButtons[1])
    expect(confirmPasswordInput.type).toBe('text')
  })

  it('calls onSwitchToLogin when login link is clicked', async () => {
    const mockOnSwitchToLogin = jest.fn()

    render(
      <MockedAuthProvider>
        <RegisterForm onSwitchToLogin={mockOnSwitchToLogin} />
      </MockedAuthProvider>
    )

    const loginLink = screen.getByRole('button', { name: /sign in/i })
    await user.click(loginLink)

    expect(mockOnSwitchToLogin).toHaveBeenCalledTimes(1)
  })
})