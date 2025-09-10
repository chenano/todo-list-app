'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react'
import { useAuthContext } from '@/contexts/AuthContext'
import { registerSchema, type RegisterFormData } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface RegisterFormProps {
  onSuccess?: () => void
  onSwitchToLogin?: () => void
}

export function RegisterForm({ onSuccess, onSwitchToLogin }: RegisterFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [registrationSuccess, setRegistrationSuccess] = useState(false)
  
  const { signUp } = useAuthContext()

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const password = watch('password')

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true)
    setAuthError(null)

    try {
      const { error } = await signUp(data.email, data.password)

      if (error) {
        // Handle specific Supabase auth errors
        switch (error.message) {
          case 'User already registered':
            setAuthError('An account with this email already exists. Please sign in instead.')
            break
          case 'Password should be at least 6 characters':
            setAuthError('Password must be at least 8 characters long.')
            break
          case 'Signup is disabled':
            setAuthError('Account registration is currently disabled. Please contact support.')
            break
          default:
            setAuthError(error.message || 'An error occurred during registration. Please try again.')
        }
      } else {
        // Registration successful
        setRegistrationSuccess(true)
        // Call onSuccess callback after a short delay to show success message
        setTimeout(() => {
          onSuccess?.()
        }, 2000)
      }
    } catch (error) {
      console.error('Registration error:', error)
      setAuthError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Password strength indicator
  const getPasswordStrength = (password: string) => {
    const defaultChecks = {
      length: false,
      lowercase: false,
      uppercase: false,
      number: false,
      special: false,
    }
    
    if (!password) return { 
      strength: 0, 
      label: '', 
      color: 'bg-gray-300', 
      checks: defaultChecks 
    }
    
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    }

    const strength = Object.values(checks).filter(Boolean).length

    const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong']
    const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500']

    return {
      strength,
      label: labels[strength - 1] || '',
      color: colors[strength - 1] || 'bg-gray-300',
      checks,
    }
  }

  const passwordStrength = getPasswordStrength(password || '')

  if (registrationSuccess) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <div>
              <h3 className="text-lg font-semibold text-green-700">Registration Successful!</h3>
              <p className="text-sm text-gray-600 mt-2">
                Please check your email for a confirmation link to activate your account.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <h1 className="text-2xl font-bold text-center">Create Account</h1>
        <CardDescription className="text-center">
          Enter your information to create a new account
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
                placeholder="Create a password"
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
            
            {/* Password Strength Indicator */}
            {password && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                      style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-600">{passwordStrength.label}</span>
                </div>
                
                {/* Password Requirements */}
                <div className="text-xs space-y-1">
                  <div className={`flex items-center space-x-1 ${passwordStrength.checks.length ? 'text-green-600' : 'text-gray-500'}`}>
                    <span>•</span>
                    <span>At least 8 characters</span>
                  </div>
                  <div className={`flex items-center space-x-1 ${passwordStrength.checks.lowercase ? 'text-green-600' : 'text-gray-500'}`}>
                    <span>•</span>
                    <span>One lowercase letter</span>
                  </div>
                  <div className={`flex items-center space-x-1 ${passwordStrength.checks.uppercase ? 'text-green-600' : 'text-gray-500'}`}>
                    <span>•</span>
                    <span>One uppercase letter</span>
                  </div>
                  <div className={`flex items-center space-x-1 ${passwordStrength.checks.number ? 'text-green-600' : 'text-gray-500'}`}>
                    <span>•</span>
                    <span>One number</span>
                  </div>
                </div>
              </div>
            )}
            
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm your password"
                {...register('confirmPassword')}
                className={errors.confirmPassword ? 'border-red-500 focus-visible:ring-red-500 pr-10' : 'pr-10'}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                disabled={isLoading}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
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
                Creating Account...
              </>
            ) : (
              'Create Account'
            )}
          </Button>

          {/* Switch to Login */}
          {onSwitchToLogin && (
            <div className="text-center text-sm">
              <span className="text-gray-600">Already have an account? </span>
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="text-blue-600 hover:text-blue-800 font-medium focus:outline-none focus:underline"
                disabled={isLoading}
              >
                Sign in
              </button>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  )
}