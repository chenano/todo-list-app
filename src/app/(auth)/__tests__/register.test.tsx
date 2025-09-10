import { render, screen } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import RegisterPage from '../register/page'
import { useAuthContext } from '@/contexts/AuthContext'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

// Mock AuthContext
jest.mock('@/contexts/AuthContext', () => ({
  useAuthContext: jest.fn(),
}))

const mockPush = jest.fn()
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>
const mockUseAuthContext = useAuthContext as jest.MockedFunction<typeof useAuthContext>

describe('RegisterPage', () => {
  beforeEach(() => {
    mockUseRouter.mockReturnValue({
      push: mockPush,
    } as any)
    
    mockUseAuthContext.mockReturnValue({
      user: null,
      loading: false,
    } as any)
    
    mockPush.mockClear()
  })

  it('renders register page when user is not authenticated', () => {
    render(<RegisterPage />)
    
    expect(screen.getByRole('heading', { name: 'Create Account' })).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create Account' })).toBeInTheDocument()
  })

  it('redirects to dashboard when user is authenticated', () => {
    mockUseAuthContext.mockReturnValue({
      user: { id: '1', email: 'test@example.com' },
      loading: false,
    } as any)

    render(<RegisterPage />)
    
    expect(mockPush).toHaveBeenCalledWith('/dashboard')
  })

  it('shows loading state while checking authentication', () => {
    mockUseAuthContext.mockReturnValue({
      user: null,
      loading: true,
    } as any)

    render(<RegisterPage />)
    
    expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument()
  })
})