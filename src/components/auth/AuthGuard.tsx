'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useAuthContext } from '@/contexts/AuthContext'

interface AuthGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
  redirectTo?: string
  fallback?: React.ReactNode
}

export function AuthGuard({ 
  children, 
  requireAuth = true, 
  redirectTo,
  fallback 
}: AuthGuardProps) {
  const { user, loading } = useAuthContext()
  const router = useRouter()
  const pathname = usePathname()
  const [isRedirecting, setIsRedirecting] = useState(false)

  useEffect(() => {
    if (loading) return // Wait for auth state to be determined

    if (requireAuth && !user) {
      // User needs to be authenticated but isn't
      setIsRedirecting(true)
      const loginUrl = redirectTo || '/login'
      const returnUrl = pathname !== '/' ? `?returnUrl=${encodeURIComponent(pathname)}` : ''
      router.push(`${loginUrl}${returnUrl}`)
    } else if (!requireAuth && user) {
      // User is authenticated but shouldn't be (e.g., on login/register pages)
      setIsRedirecting(true)
      const dashboardUrl = redirectTo || '/dashboard'
      router.push(dashboardUrl)
    }
  }, [user, loading, requireAuth, redirectTo, pathname, router])

  // Show loading state while determining auth status or redirecting
  if (loading || isRedirecting) {
    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="text-gray-600">
            {loading ? 'Loading...' : 'Redirecting...'}
          </p>
        </div>
      </div>
    )
  }

  // If requireAuth is true and user is not authenticated, don't render children
  // (redirect will happen in useEffect)
  if (requireAuth && !user) {
    return null
  }

  // If requireAuth is false and user is authenticated, don't render children
  // (redirect will happen in useEffect)
  if (!requireAuth && user) {
    return null
  }

  // All checks passed, render children
  return <>{children}</>
}

// Convenience wrapper for pages that require authentication
export function ProtectedRoute({ children, ...props }: Omit<AuthGuardProps, 'requireAuth'>) {
  return (
    <AuthGuard requireAuth={true} {...props}>
      {children}
    </AuthGuard>
  )
}

// Convenience wrapper for pages that should redirect authenticated users (login/register)
export function PublicRoute({ children, ...props }: Omit<AuthGuardProps, 'requireAuth'>) {
  return (
    <AuthGuard requireAuth={false} {...props}>
      {children}
    </AuthGuard>
  )
}

// Higher-order component for protecting pages
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options?: Omit<AuthGuardProps, 'children'>
) {
  const WrappedComponent = (props: P) => {
    return (
      <AuthGuard {...options}>
        <Component {...props} />
      </AuthGuard>
    )
  }

  WrappedComponent.displayName = `withAuth(${Component.displayName || Component.name})`
  
  return WrappedComponent
}

// Hook for checking auth status in components
export function useAuthGuard(requireAuth: boolean = true) {
  const { user, loading } = useAuthContext()
  const router = useRouter()
  const pathname = usePathname()

  const checkAuth = () => {
    if (loading) return { isAllowed: false, isLoading: true }

    if (requireAuth && !user) {
      return { isAllowed: false, isLoading: false, shouldRedirect: true, redirectTo: '/login' }
    }

    if (!requireAuth && user) {
      return { isAllowed: false, isLoading: false, shouldRedirect: true, redirectTo: '/dashboard' }
    }

    return { isAllowed: true, isLoading: false }
  }

  const redirect = (to?: string) => {
    const defaultRedirect = requireAuth ? '/login' : '/dashboard'
    const redirectUrl = to || defaultRedirect
    const returnUrl = requireAuth && pathname !== '/' ? `?returnUrl=${encodeURIComponent(pathname)}` : ''
    router.push(`${redirectUrl}${returnUrl}`)
  }

  return {
    ...checkAuth(),
    redirect,
    user,
    loading,
  }
}