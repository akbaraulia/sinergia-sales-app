'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { LoadingCard } from '@/components/ui/Loading'

interface AuthGuardProps {
  children: React.ReactNode
  requiredPermissions?: string[]
}

export default function AuthGuard({ children, requiredPermissions = [] }: AuthGuardProps) {
  const router = useRouter()
  const { isAuthenticated, user, hasPermission } = useAuthStore()
  
  useEffect(() => {
    // Check if user is authenticated
    if (!isAuthenticated || !user) {
      console.log('AuthGuard: User not authenticated, redirecting to login')
      router.push('/login')
      return
    }

    // Check if user has required permissions
    if (requiredPermissions.length > 0) {
      const hasRequiredPermissions = requiredPermissions.every(permission => 
        hasPermission(permission)
      )
      
      if (!hasRequiredPermissions) {
        console.log('AuthGuard: User lacks required permissions:', requiredPermissions)
        router.push('/dashboard') // Redirect to dashboard if no permission
        return
      }
    }
  }, [isAuthenticated, user, hasPermission, requiredPermissions, router])

  // Show loading while checking auth
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingCard title="Authenticating..." message="Please wait while we verify your access" />
      </div>
    )
  }

  // Check permissions again before rendering
  if (requiredPermissions.length > 0) {
    const hasRequiredPermissions = requiredPermissions.every(permission => 
      hasPermission(permission)
    )
    
    if (!hasRequiredPermissions) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <LoadingCard title="Checking permissions..." message="Verifying your access level" />
        </div>
      )
    }
  }

  return <>{children}</>
}
