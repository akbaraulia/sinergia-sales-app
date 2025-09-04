'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { useToast } from '@/components/common/ToastProvider'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Form'
import { Alert } from '@/components/ui/Alert'
import { ERP_CONFIG } from '@/lib/constants/erp'
import Link from 'next/link'
import Image from 'next/image'

export default function LoginPageERP() {
  const router = useRouter()
  const { showToast } = useToast()
  const { isAuthenticated, isLoading, login } = useAuthStore()
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [error, setError] = useState('')

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.email || !formData.password) {
      setError('Please fill in all fields')
      return
    }

    try {
      console.log('🔐 Attempting login with ERPNext API...')
      
      // Use auth store login method
      const result = await login(formData.email, formData.password)

      if (!result.success) {
        throw new Error(result.error || 'Login failed')
      }

      console.log('✅ Login successful via auth store')
      showToast.success('Login successful!', 'Welcome back!')
      
      // AuthStore will handle redirection via useEffect above

    } catch (error: any) {
      console.error('❌ Login error:', error)
      setError(error.message || 'Login failed. Please try again.')
      showToast.error('Login failed', error.message || 'Please check your credentials')
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  // Credential helpers untuk testing - USE ENVIRONMENT VARIABLES
  const fillTestCredentials = (type: 'admin' | 'sales' | 'salon') => {
    const credentials = {
      admin: { 
        email: process.env.NEXT_PUBLIC_DEMO_ADMIN_EMAIL || 'admin@example.com', 
        password: process.env.NEXT_PUBLIC_DEMO_ADMIN_PASSWORD || 'demo_password' 
      },
      sales: { 
        email: process.env.NEXT_PUBLIC_DEMO_SALES_EMAIL || 'sales@example.com', 
        password: process.env.NEXT_PUBLIC_DEMO_SALES_PASSWORD || 'demo_password' 
      },
      salon: { 
        email: process.env.NEXT_PUBLIC_DEMO_SALON_EMAIL || 'salon@example.com', 
        password: process.env.NEXT_PUBLIC_DEMO_SALON_PASSWORD || 'demo_password' 
      }
    }
    
    setFormData(credentials[type])
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-asparagus-50 via-champagne-50 to-isabelline-50 dark:from-jet-900 dark:via-jet-800 dark:to-jet-700 px-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-r from-asparagus-500 to-asparagus-600 rounded-xl flex items-center justify-center mb-6">
            <Image 
              src="/logo-sinergia_black-min.png" 
              alt="Sinergia Logo" 
              width={40} 
              height={40}
              className="invert dark:invert-0"
            />
          </div>
          <h2 className="text-3xl font-bold text-jet-900 dark:text-white">
            Welcome Back
          </h2>
          <p className="mt-2 text-sm text-jet-600 dark:text-jet-300">
            Sign in to your Sinergia ERP account
          </p>
          <div className="mt-2 text-xs text-jet-500 dark:text-jet-400">
            Environment: <span className="font-semibold">
              {process.env.NEXT_PUBLIC_ERP_ENV === 'PROD' ? 'Production' : 'Development'}
            </span> | ERP: <span className="font-mono text-xs">{ERP_CONFIG.BASE_URL}</span>
          </div>
        </div>

        {/* Login Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="bg-white dark:bg-jet-800 rounded-xl shadow-lg p-8 border border-asparagus-100 dark:border-jet-700">
            
            {error && (
              <Alert 
                variant="error" 
                className="mb-6"
              >
                {error}
              </Alert>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-jet-700 dark:text-jet-300 mb-2">
                  Email Address
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-jet-700 dark:text-jet-300 mb-2">
                  Password
                </label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full"
                />
              </div>
            </div>

            <div className="mt-6">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-asparagus-500 to-asparagus-600 hover:from-asparagus-600 hover:to-asparagus-700 text-white"
              >
                {isLoading ? 'Signing in...' : 'Sign in to Sinergia'}
              </Button>
            </div>

            {/* Test Credentials - Development Only */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-6 pt-6 border-t border-jet-200 dark:border-jet-700">
                <p className="text-xs text-jet-500 dark:text-jet-400 mb-3 text-center">
                  Development: Quick Fill Credentials
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={() => fillTestCredentials('admin')}
                    className="flex-1 text-xs bg-purple-100 hover:bg-purple-200 text-purple-800 dark:bg-purple-900 dark:hover:bg-purple-800 dark:text-purple-200"
                  >
                    Admin
                  </Button>
                  <Button
                    type="button"
                    onClick={() => fillTestCredentials('sales')}
                    className="flex-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 dark:bg-blue-900 dark:hover:bg-blue-800 dark:text-blue-200"
                  >
                    Sales
                  </Button>
                  <Button
                    type="button"
                    onClick={() => fillTestCredentials('salon')}
                    className="flex-1 text-xs bg-green-100 hover:bg-green-200 text-green-800 dark:bg-green-900 dark:hover:bg-green-800 dark:text-green-200"
                  >
                    Salon
                  </Button>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="mt-6 text-center">
              <p className="text-sm text-jet-600 dark:text-jet-400">
                Don't have an account?{' '}
                <Link 
                  href="/register" 
                  className="font-medium text-asparagus-600 hover:text-asparagus-500 dark:text-asparagus-400 dark:hover:text-asparagus-300"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </form>

        {/* API Info */}
        <div className="text-center">
          <p className="text-xs text-jet-500 dark:text-jet-400">
            Connected to: <span className="font-mono">{ERP_CONFIG.BASE_URL}</span>
          </p>
        </div>
      </div>
    </div>
  )
}
