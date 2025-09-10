'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LoginForm } from '@/components/auth/LoginForm'
import { useAuthContext } from '@/contexts/AuthContext'

export default function LoginPage() {
  const router = useRouter()
  const { user, loading } = useAuthContext()

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!loading && user) {
      // Check if there's a redirect URL in the query params
      const urlParams = new URLSearchParams(window.location.search)
      const redirectTo = urlParams.get('redirectTo')
      
      if (redirectTo) {
        router.push(redirectTo)
      } else {
        router.push('/dashboard')
      }
    }
  }, [user, loading, router])

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div 
          className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"
          role="status"
          aria-label="Loading"
        ></div>
      </div>
    )
  }

  // Don't render login form if user is authenticated
  if (user) {
    return null
  }

  const handleLoginSuccess = () => {
    // Redirect will be handled by the useEffect when auth state updates
  }

  const handleSwitchToRegister = () => {
    router.push('/register')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <LoginForm 
          onSuccess={handleLoginSuccess}
          onSwitchToRegister={handleSwitchToRegister}
        />
      </div>
    </div>
  )
}