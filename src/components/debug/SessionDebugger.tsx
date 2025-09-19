// Debug utility for testing session management
// Add this to any component to debug session state

import SessionManager from '@/lib/utils/sessionManager'
import { useAuthStore } from '@/store/authStore'

export const SessionDebugger = () => {
  const { user, isAuthenticated } = useAuthStore()
  
  const checkSession = () => {
    const info = SessionManager.getSessionInfo()
    console.log('🔍 [SESSION-DEBUG] Current session info:', info)
    
    const validity = SessionManager.isSessionValid()
    console.log('🔍 [SESSION-DEBUG] Session validity:', validity)
    
    console.log('🔍 [SESSION-DEBUG] Auth store state:', {
      isAuthenticated,
      user: user?.email
    })
  }
  
  const testCookies = async () => {
    console.log('🧪 [SESSION-DEBUG] Testing cookie validation...')
    const valid = await SessionManager.validateCookies()
    console.log('🧪 [SESSION-DEBUG] Cookie validation result:', valid)
  }
  
  const clearSession = () => {
    console.log('🗑️ [SESSION-DEBUG] Manually clearing session...')
    SessionManager.clearSession()
    window.location.reload()
  }
  
  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-sm z-50">
      <div className="font-bold mb-2">Session Debug</div>
      <div className="space-y-2">
        <button
          onClick={checkSession}
          className="block w-full bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-xs"
        >
          Check Session
        </button>
        <button
          onClick={testCookies}
          className="block w-full bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-xs"
        >
          Test Cookies
        </button>
        <button
          onClick={clearSession}
          className="block w-full bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-xs"
        >
          Clear Session
        </button>
      </div>
    </div>
  )
}

// Usage: Add <SessionDebugger /> to any page during development
// Remove before production
