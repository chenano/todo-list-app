'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { RegisterForm } from '@/components/auth/RegisterForm'
import { useAuthContext } from '@/contexts/AuthContext'

export default function RegisterPage() {
  const router = useRouter()
  const { user, loading } = useAuthContext()

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard')
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

  // Don't render register form if user is authenticated
  if (user) {
    return null
  }

  const handleRegistrationSuccess = () => {
    // After successful registration, redirect to login
    // The RegisterForm shows a success message first, then calls this
    router.push('/login')
  }

  const handleSwitchToLogin = () => {
    router.push('/login')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <RegisterForm 
          onSuccess={handleRegistrationSuccess}
          onSwitchToLogin={handleSwitchToLogin}
        />
      </div>
    </div>
  )
}