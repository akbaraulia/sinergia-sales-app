'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { LoadingCard } from '@/components/ui/Loading'
import { SessionManager } from '@/lib/utils/sessionManager'
import { SESSION_CONFIG } from '@/lib/constants/erp'

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
  
  // Handle logout due to idle timeout
  const handleIdleLogout = useCallback(() => {
    const idleMinutes = SessionManager.getIdleTimeMinutes()
    console.warn(`⏰ [AuthGuard] User idle for ${idleMinutes} minutes. Auto-logout!`)
    logout()
    router.push('/login?reason=idle')
  }, [logout, router])
  
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
        console.log('🛡️ [AuthGuard] Checking auth state + idle timeout...', { 
          isAuthenticated, 
          user: user?.email,
          idleMinutes: SessionManager.getIdleTimeMinutes(),
          timeoutMinutes: SESSION_CONFIG.TIMEOUT_MINUTES
        })
        
        // Check localStorage auth state first
        if (!isAuthenticated || !user) {
          console.log('🛡️ [AuthGuard] No local auth state, redirecting to login')
          if (isMounted) {
            setAuthStatus('invalid')
            router.push('/login')
          }
          return
        }
        
        // CHECK IDLE TIMEOUT (8 hours default)
        if (!SessionManager.isSessionValid()) {
          console.warn('⏰ [AuthGuard] Session expired due to idle timeout!')
          if (isMounted) {
            handleIdleLogout()
            setAuthStatus('invalid')
          }
          return
        }
        
        // Attach activity listeners for tracking
        SessionManager.attachActivityListeners()
        
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
        
        console.log('✅ [AuthGuard] Auth state valid')
        if (isMounted) {
          setAuthStatus('valid')
          setIsValidating(false)
        }
        
      } catch (error) {
        console.error('❌ [AuthGuard] Auth check error:', error)
        if (isMounted) {
          setAuthStatus('valid')
          setIsValidating(false)
        }
      }
    }
    
    validateSession()
    
    // Periodic idle check every 5 minutes
    const idleCheckInterval = setInterval(() => {
      if (isAuthenticated && !SessionManager.isSessionValid()) {
        handleIdleLogout()
      }
    }, 5 * 60 * 1000) // 5 minutes
    
    return () => {
      isMounted = false
      clearInterval(idleCheckInterval)
    }
  }, [isAuthenticated, user, hasPermission, requiredPermissions, router, hasHydrated, handleIdleLogout])

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
