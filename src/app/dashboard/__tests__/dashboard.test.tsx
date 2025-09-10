import { render, screen } from '@testing-library/react'
import DashboardPage from '../page'
import { useAuthContext } from '@/contexts/AuthContext'

// Mock AuthContext
jest.mock('@/contexts/AuthContext', () => ({
  useAuthContext: jest.fn(),
}))

const mockSignOut = jest.fn()
const mockUseAuthContext = useAuthContext as jest.MockedFunction<typeof useAuthContext>

describe('DashboardPage', () => {
  beforeEach(() => {
    mockUseAuthContext.mockReturnValue({
      user: { id: '1', email: 'test@example.com' },
      signOut: mockSignOut,
    } as any)
    
    mockSignOut.mockClear()
  })

  it('renders dashboard with user information', () => {
    render(<DashboardPage />)
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Welcome, test@example.com')).toBeInTheDocument()
    expect(screen.getByText('Welcome to your Todo Dashboard')).toBeInTheDocument()
    expect(screen.getByText(/You are successfully logged in as:/)).toBeInTheDocument()
    expect(screen.getByText('test@example.com')).toBeInTheDocument()
  })

  it('renders sign out button', () => {
    render(<DashboardPage />)
    
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument()
  })
})