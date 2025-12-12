'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { LoadingCard } from '@/components/ui/Loading'
import SessionManager from '@/lib/utils/sessionManager'

interface AuthGuardProps {
  children: React.ReactNode
  requiredPermissions?: string[]
}

export default function AuthGuard({ children, requiredPermissions = [] }: AuthGuardProps) {
  const router = useRouter()
  const { isAuthenticated, user, hasPermission, logout } = useAuthStore()
  const [isValidating, setIsValidating] = useState(true)
  const [authStatus, setAuthStatus] = useState<'checking' | 'valid' | 'invalid'>('checking')
  const [hasHydrated, setHasHydrated] = useState(false)
  
  // Wait for Zustand persist hydration
  useEffect(() => {
    setHasHydrated(true)
  }, [])
  
  useEffect(() => {
    // Don't validate until store has hydrated from localStorage
    if (!hasHydrated) {
      console.log('🛡️ [AuthGuard] Waiting for store hydration...')
      return
    }
    
    let isMounted = true
    
    const validateSession = async () => {
      try {
        console.log('🛡️ [AuthGuard] Quick auth check (NO AUTO-LOGOUT)...', { isAuthenticated, user: user?.email })
        
        // ONLY check localStorage auth state - NO SESSION EXPIRY CHECK
        if (!isAuthenticated || !user) {
          console.log('🛡️ [AuthGuard] No local auth state, redirecting to login')
          if (isMounted) {
            setAuthStatus('invalid')
            router.push('/login')
          }
          return
        }
        
        // Check permissions if required (NO COOKIE/SESSION VALIDATION)
        if (requiredPermissions.length > 0) {
          const hasRequiredPermissions = requiredPermissions.every(permission => 
            hasPermission(permission)
          )
          
          if (!hasRequiredPermissions) {
            console.log('🛡️ [AuthGuard] User lacks required permissions:', requiredPermissions)
            if (isMounted) {
              setAuthStatus('invalid')
              router.push('/dashboard')
            }
            return
          }
        }
        
        // All checks passed - NO SESSION EXPIRY ENFORCEMENT
        console.log('✅ [AuthGuard] Auth state valid (no auto-logout)')
        if (isMounted) {
          setAuthStatus('valid')
          setIsValidating(false)
        }
        
      } catch (error) {
        console.error('❌ [AuthGuard] Auth check error:', error)
        // DON'T auto-logout on error
        if (isMounted) {
          setAuthStatus('valid')
          setIsValidating(false)
        }
      }
    }
    
    validateSession()
    
    return () => {
      isMounted = false
    }
  }, [isAuthenticated, user, hasPermission, requiredPermissions, router, hasHydrated])

  // Show loading while validating
  if (isValidating || authStatus === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingCard 
          title="Validating Session..." 
          message="Checking authentication and session health" 
        />
      </div>
    )
  }
  
  // If validation failed, show loading while redirecting
  if (authStatus === 'invalid') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingCard 
          title="Redirecting..." 
          message="Session expired, redirecting to login" 
        />
      </div>
    )
  }

  return <>{children}</>
}
