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
  
  useEffect(() => {
    let isMounted = true
    
    const validateSession = async () => {
      try {
        console.log('🛡️ [AuthGuard] Starting session validation...')
        
        // First check localStorage auth state
        if (!isAuthenticated || !user) {
          console.log('🛡️ [AuthGuard] No local auth state, redirecting to login')
          if (isMounted) {
            setAuthStatus('invalid')
            router.push('/login')
          }
          return
        }
        
        // Check session validity and cookie health
        const sessionCheck = SessionManager.isSessionValid()
        
        if (sessionCheck === false) {
          console.warn('🛡️ [AuthGuard] Session expired, logging out')
          if (isMounted) {
            SessionManager.clearSession()
            await logout()
            setAuthStatus('invalid')
            router.push('/login')
          }
          return
        }
        
        if (sessionCheck === 'NEEDS_COOKIE_CHECK') {
          console.log('🛡️ [AuthGuard] Performing cookie health check...')
          
          const cookieValid = await SessionManager.validateCookies()
          
          if (!cookieValid) {
            console.warn('🛡️ [AuthGuard] Cookies expired but localStorage has auth state')
            if (isMounted) {
              SessionManager.clearSession()
              await logout()
              setAuthStatus('invalid')
              router.push('/login')
            }
            return
          }
        }
        
        // Check permissions if required
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
        
        // All checks passed
        console.log('✅ [AuthGuard] Session validation successful')
        if (isMounted) {
          setAuthStatus('valid')
          setIsValidating(false)
        }
        
      } catch (error) {
        console.error('❌ [AuthGuard] Session validation error:', error)
        if (isMounted) {
          setAuthStatus('invalid')
          router.push('/login')
        }
      }
    }
    
    validateSession()
    
    return () => {
      isMounted = false
    }
  }, [isAuthenticated, user, hasPermission, requiredPermissions, router, logout])

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
