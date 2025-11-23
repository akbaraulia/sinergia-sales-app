import { SESSION_CONFIG } from '@/lib/constants/erp'

interface SessionData {
  timestamp: number
  lastCheck: number
  user: {
    email: string
    name: string
    role?: string
    permissions: string[]
  }
}

export class SessionManager {
  private static readonly STORAGE_KEY = 'sinergia-session'
  
  /**
   * Check if current session is valid based on timestamp
   * DISABLED AUTO-LOGOUT - Always returns true if session data exists
   */
  static isSessionValid(): boolean {
    try {
      const sessionData = this.getSessionData()
      if (!sessionData) return false
      
      // JUST CHECK IF DATA EXISTS - NO EXPIRY ENFORCEMENT!
      console.log('✅ [SESSION] Session data exists (no expiry check)')
      return true
      
    } catch (error) {
      console.error('❌ [SESSION] Error checking session validity:', error)
      return false
    }
  }
  
  /**
   * Get session data from localStorage
   */
  static getSessionData(): SessionData | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      return stored ? JSON.parse(stored) : null
    } catch (error) {
      console.error('❌ [SESSION] Error reading session data:', error)
      return null
    }
  }
  
  /**
   * Save session data to localStorage
   */
  static saveSessionData(user: {
    email: string
    name: string
    role?: string
    permissions: string[]
  }): void {
    try {
      const sessionData: SessionData = {
        timestamp: Date.now(),
        lastCheck: Date.now(),
        user
      }
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sessionData))
      console.log('✅ [SESSION] Session data saved:', {
        user: user.email,
        timestamp: new Date(sessionData.timestamp).toISOString()
      })
    } catch (error) {
      console.error('❌ [SESSION] Error saving session data:', error)
    }
  }
  
  /**
   * Update last check timestamp
   */
  static updateLastCheck(): void {
    try {
      const sessionData = this.getSessionData()
      if (sessionData) {
        sessionData.lastCheck = Date.now()
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sessionData))
        console.log('✅ [SESSION] Last check updated:', new Date().toISOString())
      }
    } catch (error) {
      console.error('❌ [SESSION] Error updating last check:', error)
    }
  }
  
  /**
   * Clear session data
   */
  static clearSession(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY)
      console.log('🗑️ [SESSION] Session data cleared')
    } catch (error) {
      console.error('❌ [SESSION] Error clearing session:', error)
    }
  }
  
  /**
   * Check if cookies are valid by making a test API call
   */
  static async validateCookies(): Promise<boolean> {
    try {
      console.log('🍪 [SESSION] Validating cookies with health check...')
      
      const response = await fetch('/api/auth/health-check', {
        method: 'GET',
        credentials: 'include'
      })
      
      const result = await response.json()
      
      if (result.success && result.authenticated) {
        console.log('✅ [SESSION] Cookies are valid')
        this.updateLastCheck()
        return true
      } else {
        console.warn('⚠️ [SESSION] Cookies are invalid or expired')
        return false
      }
    } catch (error) {
      console.error('❌ [SESSION] Error validating cookies:', error)
      return false
    }
  }
  
  /**
   * Get session info for debugging
   */
  static getSessionInfo(): {
    user: string | undefined
    sessionAgeMinutes: number
    minutesSinceLastCheck: number
    timeoutMinutes: number
    checkIntervalMinutes: number
    isExpired: boolean
    needsCookieCheck: boolean
  } | null {
    const sessionData = this.getSessionData()
    if (!sessionData) return null
    
    const now = Date.now()
    const sessionAge = now - sessionData.timestamp
    const timeSinceLastCheck = now - sessionData.lastCheck
    
    return {
      user: sessionData.user?.email,
      sessionAgeMinutes: Math.floor(sessionAge / 60000),
      minutesSinceLastCheck: Math.floor(timeSinceLastCheck / 60000),
      timeoutMinutes: SESSION_CONFIG.TIMEOUT_MINUTES,
      checkIntervalMinutes: SESSION_CONFIG.AUTH_CHECK_INTERVAL_MINUTES,
      isExpired: sessionAge > SESSION_CONFIG.TIMEOUT_MS,
      needsCookieCheck: timeSinceLastCheck > SESSION_CONFIG.AUTH_CHECK_INTERVAL_MS
    }
  }
}

export default SessionManager
