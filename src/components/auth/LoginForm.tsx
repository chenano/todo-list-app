'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { useAuthContext } from '@/contexts/AuthContext'
import { loginSchema, type LoginFormData } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface LoginFormProps {
  onSuccess?: () => void
  onSwitchToRegister?: () => void
}

export function LoginForm({ onSuccess, onSwitchToRegister }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  
  const { signIn } = useAuthContext()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    setAuthError(null)

    try {
      const { error } = await signIn(data.email, data.password)

      if (error) {
        // Handle specific Supabase auth errors
        switch (error.message) {
          case 'Invalid login credentials':
            setAuthError('Invalid email or password. Please check your credentials and try again.')
            break
          case 'Email not confirmed':
            setAuthError('Please check your email and click the confirmation link before signing in. If you need a new confirmation email, please contact support.')
            break
          case 'Too many requests':
            setAuthError('Too many login attempts. Please wait a moment before trying again.')
            break
          default:
            setAuthError(error.message || 'An error occurred during sign in. Please try again.')
        }
      } else {
        // Success - call onSuccess callback if provided
        onSuccess?.()
      }
    } catch (error) {
      console.error('Login error:', error)
      setAuthError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <h1 className="text-2xl font-bold text-center">Sign In</h1>
        <CardDescription className="text-center">
          Enter your email and password to access your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              {...register('email')}
              className={errors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}
              disabled={isLoading}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                {...register('password')}
                className={errors.password ? 'border-red-500 focus-visible:ring-red-500 pr-10' : 'pr-10'}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>

          {/* Auth Error Display */}
          {authError && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {authError}
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing In...
              </>
            ) : (
              'Sign In'
            )}
          </Button>

          {/* Switch to Register */}
          {onSwitchToRegister && (
            <div className="text-center text-sm">
              <span className="text-gray-600">Don't have an account? </span>
              <button
                type="button"
                onClick={onSwitchToRegister}
                className="text-blue-600 hover:text-blue-800 font-medium focus:outline-none focus:underline"
                disabled={isLoading}
              >
                Sign up
              </button>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  )
}