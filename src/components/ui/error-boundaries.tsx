"use client"

import React from "react"
import { AlertTriangle, RefreshCw, Wifi, WifiOff, Home } from "lucide-react"
import { Button } from "./button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card"
import { AppError, NetworkError, AuthenticationError, AuthorizationError } from "@/lib/errors"

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

interface BaseErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error?: Error; resetError: () => void }>
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

// Base Error Boundary
export class BaseErrorBoundary extends React.Component<BaseErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: BaseErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo)
    this.props.onError?.(error, errorInfo)
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return <FallbackComponent error={this.state.error} resetError={this.resetError} />
      }

      return <DefaultErrorFallback error={this.state.error} resetError={this.resetError} />
    }

    return this.props.children
  }
}

// Network Error Boundary
interface NetworkErrorBoundaryProps extends BaseErrorBoundaryProps {
  onRetry?: () => void
}

export class NetworkErrorBoundary extends BaseErrorBoundary {
  render() {
    if (this.state.hasError && this.state.error instanceof NetworkError) {
      return (
        <NetworkErrorFallback 
          error={this.state.error} 
          resetError={this.resetError}
          onRetry={(this.props as NetworkErrorBoundaryProps).onRetry}
        />
      )
    }

    return super.render()
  }
}

// Authentication Error Boundary
export class AuthErrorBoundary extends BaseErrorBoundary {
  render() {
    if (this.state.hasError) {
      const error = this.state.error
      if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
        return (
          <AuthErrorFallback 
            error={error} 
            resetError={this.resetError}
          />
        )
      }
    }

    return super.render()
  }
}

// Feature-specific Error Boundary
interface FeatureErrorBoundaryProps extends BaseErrorBoundaryProps {
  featureName: string
  showHomeButton?: boolean
}

export class FeatureErrorBoundary extends BaseErrorBoundary {
  render() {
    if (this.state.hasError) {
      return (
        <FeatureErrorFallback 
          error={this.state.error} 
          resetError={this.resetError}
          featureName={(this.props as FeatureErrorBoundaryProps).featureName}
          showHomeButton={(this.props as FeatureErrorBoundaryProps).showHomeButton}
        />
      )
    }

    return super.render()
  }
}

// Error Fallback Components
function DefaultErrorFallback({ error, resetError }: { error?: Error; resetError: () => void }) {
  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle>Something went wrong</CardTitle>
          <CardDescription>
            An unexpected error occurred. Please try refreshing the page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && process.env.NODE_ENV === "development" && (
            <div className="rounded-md bg-muted p-3">
              <p className="text-sm font-mono text-muted-foreground">
                {error.message}
              </p>
            </div>
          )}
          <Button onClick={resetError} className="w-full">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try again
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

function NetworkErrorFallback({ 
  error, 
  resetError, 
  onRetry 
}: { 
  error?: Error
  resetError: () => void
  onRetry?: () => void
}) {
  const isOffline = !navigator.onLine

  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
            {isOffline ? (
              <WifiOff className="h-6 w-6 text-orange-600" />
            ) : (
              <Wifi className="h-6 w-6 text-orange-600" />
            )}
          </div>
          <CardTitle>
            {isOffline ? "You're offline" : "Connection problem"}
          </CardTitle>
          <CardDescription>
            {isOffline 
              ? "Please check your internet connection and try again."
              : "We're having trouble connecting to our servers."
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && process.env.NODE_ENV === "development" && (
            <div className="rounded-md bg-muted p-3">
              <p className="text-sm font-mono text-muted-foreground">
                {error.message}
              </p>
            </div>
          )}
          <div className="flex gap-2">
            <Button onClick={onRetry || resetError} className="flex-1">
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
            {onRetry && (
              <Button onClick={resetError} variant="outline" className="flex-1">
                Dismiss
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function AuthErrorFallback({ error, resetError }: { error?: Error; resetError: () => void }) {
  const isAuthError = error instanceof AuthenticationError
  const isAuthzError = error instanceof AuthorizationError

  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle>
            {isAuthError ? "Authentication Required" : "Access Denied"}
          </CardTitle>
          <CardDescription>
            {isAuthError 
              ? "Please sign in to continue."
              : "You don't have permission to access this resource."
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-3 border border-red-200">
              <p className="text-sm text-red-600">
                {error.message}
              </p>
            </div>
          )}
          <div className="flex gap-2">
            {isAuthError && (
              <Button onClick={() => window.location.href = '/login'} className="flex-1">
                Sign In
              </Button>
            )}
            <Button onClick={resetError} variant="outline" className="flex-1">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function FeatureErrorFallback({ 
  error, 
  resetError, 
  featureName,
  showHomeButton = true
}: { 
  error?: Error
  resetError: () => void
  featureName: string
  showHomeButton?: boolean
}) {
  return (
    <div className="flex items-center justify-center min-h-[300px] p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
            <AlertTriangle className="h-6 w-6 text-yellow-600" />
          </div>
          <CardTitle>
            {featureName} Error
          </CardTitle>
          <CardDescription>
            We're having trouble loading this feature. Please try again.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && process.env.NODE_ENV === "development" && (
            <div className="rounded-md bg-muted p-3">
              <p className="text-sm font-mono text-muted-foreground">
                {error.message}
              </p>
            </div>
          )}
          <div className="flex gap-2">
            <Button onClick={resetError} className="flex-1">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            {showHomeButton && (
              <Button 
                onClick={() => window.location.href = '/dashboard'} 
                variant="outline" 
                className="flex-1"
              >
                <Home className="mr-2 h-4 w-4" />
                Home
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Inline Error Display Component
interface InlineErrorProps {
  error: Error | string | null
  className?: string
  showIcon?: boolean
  onDismiss?: () => void
}

export function InlineError({ 
  error, 
  className = "", 
  showIcon = true, 
  onDismiss 
}: InlineErrorProps) {
  if (!error) return null

  const message = typeof error === 'string' ? error : error.message

  return (
    <div className={`flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md ${className}`}>
      {showIcon && <AlertTriangle className="h-4 w-4 flex-shrink-0" />}
      <span className="flex-1">{message}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-red-400 hover:text-red-600 focus:outline-none"
          aria-label="Dismiss error"
        >
          ×
        </button>
      )}
    </div>
  )
}

// Success Message Component
interface SuccessMessageProps {
  message: string | null
  className?: string
  showIcon?: boolean
  onDismiss?: () => void
}

export function SuccessMessage({ 
  message, 
  className = "", 
  showIcon = true, 
  onDismiss 
}: SuccessMessageProps) {
  if (!message) return null

  return (
    <div className={`flex items-center gap-2 p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md ${className}`}>
      {showIcon && <div className="h-4 w-4 flex-shrink-0 rounded-full bg-green-600 flex items-center justify-center">
        <div className="h-2 w-2 bg-white rounded-full" />
      </div>}
      <span className="flex-1">{message}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-green-400 hover:text-green-600 focus:outline-none"
          aria-label="Dismiss message"
        >
          ×
        </button>
      )}
    </div>
  )
}

// Hook for managing error and success states
export function useErrorAndSuccess() {
  const [error, setError] = React.useState<Error | string | null>(null)
  const [success, setSuccess] = React.useState<string | null>(null)

  const clearError = React.useCallback(() => setError(null), [])
  const clearSuccess = React.useCallback(() => setSuccess(null), [])
  const clearAll = React.useCallback(() => {
    setError(null)
    setSuccess(null)
  }, [])

  const handleError = React.useCallback((error: Error | string) => {
    setError(error)
    setSuccess(null)
  }, [])

  const handleSuccess = React.useCallback((message: string) => {
    setSuccess(message)
    setError(null)
  }, [])

  return {
    error,
    success,
    setError: handleError,
    setSuccess: handleSuccess,
    clearError,
    clearSuccess,
    clearAll
  }
}