"use client"

import React from "react"
import { Loader2, Check, X, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button, ButtonProps } from "./button"

// Loading Button Component
export interface LoadingButtonProps extends ButtonProps {
  loading?: boolean
  loadingText?: string
  successState?: boolean
  errorState?: boolean
  successText?: string
  errorText?: string
  resetDelay?: number
}

export function LoadingButton({
  children,
  loading = false,
  loadingText,
  successState = false,
  errorState = false,
  successText,
  errorText,
  resetDelay = 2000,
  disabled,
  className,
  ...props
}: LoadingButtonProps) {
  const [showSuccess, setShowSuccess] = React.useState(false)
  const [showError, setShowError] = React.useState(false)

  React.useEffect(() => {
    if (successState) {
      setShowSuccess(true)
      const timer = setTimeout(() => setShowSuccess(false), resetDelay)
      return () => clearTimeout(timer)
    }
  }, [successState, resetDelay])

  React.useEffect(() => {
    if (errorState) {
      setShowError(true)
      const timer = setTimeout(() => setShowError(false), resetDelay)
      return () => clearTimeout(timer)
    }
  }, [errorState, resetDelay])

  const isDisabled = disabled || loading || showSuccess || showError

  let content = children
  let variant = props.variant

  if (loading) {
    content = (
      <>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        {loadingText || children}
      </>
    )
  } else if (showSuccess) {
    content = (
      <>
        <Check className="mr-2 h-4 w-4" />
        {successText || "Success"}
      </>
    )
    variant = "default"
  } else if (showError) {
    content = (
      <>
        <X className="mr-2 h-4 w-4" />
        {errorText || "Error"}
      </>
    )
    variant = "destructive"
  }

  return (
    <Button
      {...props}
      variant={variant}
      disabled={isDisabled}
      className={cn(
        "transition-all duration-200",
        showSuccess && "bg-green-600 hover:bg-green-700",
        className
      )}
    >
      {content}
    </Button>
  )
}

// Form Loading State
interface FormLoadingStateProps {
  isLoading: boolean
  isSubmitting?: boolean
  hasErrors?: boolean
  children: React.ReactNode
  className?: string
}

export function FormLoadingState({
  isLoading,
  isSubmitting = false,
  hasErrors = false,
  children,
  className
}: FormLoadingStateProps) {
  return (
    <div className={cn("relative", className)}>
      <div
        className={cn(
          "transition-all duration-200",
          (isLoading || isSubmitting) && "opacity-50 pointer-events-none"
        )}
      >
        {children}
      </div>
      
      {(isLoading || isSubmitting) && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm rounded-md">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {isSubmitting ? "Submitting..." : "Loading..."}
          </div>
        </div>
      )}
    </div>
  )
}

// Progress Indicator
interface ProgressIndicatorProps {
  steps: Array<{
    label: string
    status: 'pending' | 'loading' | 'completed' | 'error'
  }>
  className?: string
}

export function ProgressIndicator({ steps, className }: ProgressIndicatorProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {steps.map((step, index) => (
        <div key={index} className="flex items-center gap-3">
          <div className="flex-shrink-0">
            {step.status === 'loading' && (
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            )}
            {step.status === 'completed' && (
              <Check className="h-4 w-4 text-green-600" />
            )}
            {step.status === 'error' && (
              <X className="h-4 w-4 text-red-600" />
            )}
            {step.status === 'pending' && (
              <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
            )}
          </div>
          <span
            className={cn(
              "text-sm",
              step.status === 'completed' && "text-green-600",
              step.status === 'error' && "text-red-600",
              step.status === 'loading' && "text-blue-600",
              step.status === 'pending' && "text-gray-500"
            )}
          >
            {step.label}
          </span>
        </div>
      ))}
    </div>
  )
}

// Loading Dots Animation
interface LoadingDotsProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function LoadingDots({ className, size = 'md' }: LoadingDotsProps) {
  const sizeClasses = {
    sm: 'h-1 w-1',
    md: 'h-2 w-2',
    lg: 'h-3 w-3'
  }

  return (
    <div className={cn("flex space-x-1", className)}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            "bg-current rounded-full animate-pulse",
            sizeClasses[size]
          )}
          style={{
            animationDelay: `${i * 0.2}s`,
            animationDuration: '1s'
          }}
        />
      ))}
    </div>
  )
}

// Pulse Loading Effect
interface PulseLoaderProps {
  className?: string
  count?: number
}

export function PulseLoader({ className, count = 3 }: PulseLoaderProps) {
  return (
    <div className={cn("flex space-x-2", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="h-3 w-3 bg-current rounded-full animate-pulse"
          style={{
            animationDelay: `${i * 0.15}s`
          }}
        />
      ))}
    </div>
  )
}

// Spinner with Text
interface SpinnerWithTextProps {
  text?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function SpinnerWithText({ 
  text = "Loading...", 
  size = 'md', 
  className 
}: SpinnerWithTextProps) {
  const sizeClasses = {
    sm: { spinner: 'h-4 w-4', text: 'text-sm' },
    md: { spinner: 'h-6 w-6', text: 'text-base' },
    lg: { spinner: 'h-8 w-8', text: 'text-lg' }
  }

  return (
    <div className={cn("flex items-center justify-center gap-3", className)}>
      <Loader2 className={cn("animate-spin", sizeClasses[size].spinner)} />
      <span className={cn("text-muted-foreground", sizeClasses[size].text)}>
        {text}
      </span>
    </div>
  )
}

// Loading Card Placeholder
interface LoadingCardProps {
  className?: string
  showAvatar?: boolean
  lines?: number
}

export function LoadingCard({ 
  className, 
  showAvatar = false, 
  lines = 3 
}: LoadingCardProps) {
  return (
    <div className={cn("p-4 border rounded-lg space-y-3", className)}>
      <div className="flex items-start space-x-3">
        {showAvatar && (
          <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse" />
        )}
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
          {Array.from({ length: lines }).map((_, i) => (
            <div
              key={i}
              className="h-3 bg-gray-200 rounded animate-pulse"
              style={{ width: `${Math.random() * 40 + 60}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// Async State Hook
export function useAsyncState<T>(
  asyncFunction: () => Promise<T>,
  dependencies: React.DependencyList = []
) {
  const [state, setState] = React.useState<{
    data: T | null
    loading: boolean
    error: Error | null
  }>({
    data: null,
    loading: true,
    error: null
  })

  const execute = React.useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const data = await asyncFunction()
      setState({ data, loading: false, error: null })
    } catch (error) {
      setState({ 
        data: null, 
        loading: false, 
        error: error instanceof Error ? error : new Error('Unknown error') 
      })
    }
  }, dependencies)

  React.useEffect(() => {
    execute()
  }, [execute])

  return {
    ...state,
    refetch: execute
  }
}

// Loading State Manager Hook
export function useLoadingState(initialState = false) {
  const [isLoading, setIsLoading] = React.useState(initialState)
  const [error, setError] = React.useState<Error | null>(null)

  const withLoading = React.useCallback(
    (asyncFunction: () => Promise<any>) => {
      return async (): Promise<any> => {
        setIsLoading(true)
        setError(null)
        
        try {
          const result = await asyncFunction()
          return result
        } catch (err) {
          const error = err instanceof Error ? err : new Error('Unknown error')
          setError(error)
          return null
        } finally {
          setIsLoading(false)
        }
      }
    }, [])

  const reset = React.useCallback(() => {
    setIsLoading(false)
    setError(null)
  }, [])

  return {
    isLoading,
    error,
    withLoading,
    reset,
    setLoading: setIsLoading,
    setError
  }
}