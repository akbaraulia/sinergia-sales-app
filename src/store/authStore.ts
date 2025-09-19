import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import SessionManager from '@/lib/utils/sessionManager'

interface User {
  email: string
  name: string
  role?: string
  permissions: string[]
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  
  // Actions  
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  setUser: (user: User) => void
  checkAuth: () => boolean
  hasPermission: (permission: string) => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true })

        try {
          console.log('🔐 [AuthStore] Starting ERP login...')
          
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
          })

          const result = await response.json()

          if (!result.success) {
            set({ isLoading: false })
            return { success: false, error: result.error }
          }

          // Store user data from ERP
          set({ 
            user: result.user, 
            isAuthenticated: true, 
            isLoading: false 
          })

          // Save session data with SessionManager
          SessionManager.saveSessionData(result.user)

          console.log('✅ [AuthStore] Login successful:', result.user)
          return { success: true }

        } catch (error) {
          console.error('❌ [AuthStore] Login error:', error)
          set({ isLoading: false })
          return { 
            success: false, 
            error: 'Network error. Please try again.' 
          }
        }
      },

      logout: async () => {
        try {
          // Call logout API to clear server sessions
          await fetch('/api/auth/logout', { method: 'POST' })
        } catch (error) {
          console.error('❌ Logout API error:', error)
        }
        
        // Clear session data with SessionManager
        SessionManager.clearSession()
        
        // Clear local state
        set({ 
          user: null, 
          isAuthenticated: false, 
          isLoading: false 
        })
      },

      setUser: (user) => {
        set({ user, isAuthenticated: true })
        // Update session data when user is set
        SessionManager.saveSessionData(user)
      },

      checkAuth: () => {
        const { user, isAuthenticated } = get()
        return !!(user && isAuthenticated)
      },

      hasPermission: (permission) => {
        const { user } = get()
        return user?.permissions?.includes(permission) ?? false
      }
    }),
    {
      name: 'sinergia-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
)
