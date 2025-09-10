import { render, screen } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import LoginPage from '../login/page'
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

describe('LoginPage', () => {
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

  it('renders login page when user is not authenticated', () => {
    render(<LoginPage />)
    
    expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument()
  })

  it('redirects to dashboard when user is authenticated', () => {
    mockUseAuthContext.mockReturnValue({
      user: { id: '1', email: 'test@example.com' },
      loading: false,
    } as any)

    render(<LoginPage />)
    
    expect(mockPush).toHaveBeenCalledWith('/dashboard')
  })

  it('shows loading state while checking authentication', () => {
    mockUseAuthContext.mockReturnValue({
      user: null,
      loading: true,
    } as any)

    render(<LoginPage />)
    
    expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument()
  })
})