# Authentication Components

This directory contains the authentication UI components for the todo list application.

## Components

### LoginForm
A complete login form with email/password validation, loading states, and error handling.

**Props:**
- `onSuccess?: () => void` - Called when login is successful
- `onSwitchToRegister?: () => void` - Called when user clicks "Sign up" link

**Features:**
- Email and password validation using Zod schemas
- Password visibility toggle
- Loading states during authentication
- Error handling with user-friendly messages
- Responsive design with shadcn/ui components

### RegisterForm
A complete registration form with email/password validation, password strength indicator, and confirmation.

**Props:**
- `onSuccess?: () => void` - Called when registration is successful
- `onSwitchToLogin?: () => void` - Called when user clicks "Sign in" link

**Features:**
- Email and password validation with confirmation
- Password strength indicator with visual feedback
- Password requirements checklist
- Loading states during registration
- Success state with email confirmation message
- Error handling with user-friendly messages

### AuthGuard
A component for protecting routes and handling authentication state.

**Props:**
- `children: React.ReactNode` - Content to render when auth check passes
- `requireAuth?: boolean` - Whether authentication is required (default: true)
- `redirectTo?: string` - Custom redirect URL
- `fallback?: React.ReactNode` - Custom loading component

**Convenience Components:**
- `ProtectedRoute` - Wrapper for pages requiring authentication
- `PublicRoute` - Wrapper for pages that redirect authenticated users
- `withAuth` - HOC for protecting components

**Hook:**
- `useAuthGuard(requireAuth)` - Hook for checking auth status in components

## Usage Examples

### Basic Login Page
```tsx
import { LoginForm } from '@/components/auth'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoginForm 
        onSuccess={() => router.push('/dashboard')}
        onSwitchToRegister={() => router.push('/register')}
      />
    </div>
  )
}
```

### Protected Dashboard
```tsx
import { ProtectedRoute } from '@/components/auth'

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <div>
        <h1>Dashboard</h1>
        <p>This content is only visible to authenticated users.</p>
      </div>
    </ProtectedRoute>
  )
}
```

### Using AuthGuard with Custom Fallback
```tsx
import { AuthGuard } from '@/components/auth'

export default function CustomProtectedPage() {
  return (
    <AuthGuard 
      fallback={<div>Checking authentication...</div>}
      redirectTo="/custom-login"
    >
      <div>Protected content</div>
    </AuthGuard>
  )
}
```

### Using the useAuthGuard Hook
```tsx
import { useAuthGuard } from '@/components/auth'

export function MyComponent() {
  const { isAllowed, isLoading, redirect } = useAuthGuard()

  if (isLoading) return <div>Loading...</div>
  
  if (!isAllowed) {
    redirect('/login')
    return null
  }

  return <div>Authenticated content</div>
}
```

## Requirements Covered

This implementation covers the following requirements from the spec:

- **1.1**: Login page with email/password fields ✅
- **1.3**: Error handling for invalid credentials ✅  
- **1.4**: Redirect after successful login ✅
- **2.1**: Registration page with email/password fields ✅
- **2.3**: Error handling for registration errors ✅
- **2.4**: Redirect after successful registration ✅

## Dependencies

- React Hook Form for form handling
- Zod for validation schemas
- Lucide React for icons
- shadcn/ui components (Button, Input, Label, Card)
- AuthContext for authentication state management