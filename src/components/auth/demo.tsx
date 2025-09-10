'use client'

import React from 'react'
import { LoginForm } from './LoginForm'
import { RegisterForm } from './RegisterForm'
import { AuthProvider } from '@/contexts/AuthContext'

export function AuthDemo() {
  const [showLogin, setShowLogin] = React.useState(true)

  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        {showLogin ? (
          <LoginForm 
            onSwitchToRegister={() => setShowLogin(false)}
            onSuccess={() => console.log('Login successful')}
          />
        ) : (
          <RegisterForm 
            onSwitchToLogin={() => setShowLogin(true)}
            onSuccess={() => console.log('Registration successful')}
          />
        )}
      </div>
    </AuthProvider>
  )
}