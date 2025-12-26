import { SESSION_CONFIG } from '@/lib/constants/erp'

interface SessionData {
  timestamp: number
  lastCheck: number
  lastActivity: number // Track user's last activity for idle timeout
  user: {
    email: string
    name: string
    role?: string
    permissions: string[]
  }
}

export class SessionManager {
  private static readonly STORAGE_KEY = 'sinergia-session'
  private static activityListenersAttached = false
  
  /**
   * Check if current session is valid based on IDLE TIME (8 hours default)
   * User is kicked out if idle for more than SESSION_TIMEOUT_MINUTES
   */
  static isSessionValid(): boolean {
    try {
      const sessionData = this.getSessionData()
      if (!sessionData) return false
      
      // Check IDLE timeout (time since last activity)
      const now = Date.now()
      const idleTime = now - (sessionData.lastActivity || sessionData.timestamp)
      const idleTimeMinutes = Math.floor(idleTime / 60000)
      const timeoutMinutes = SESSION_CONFIG.TIMEOUT_MINUTES // Default 480 (8 hours)
      
      if (idleTime > SESSION_CONFIG.TIMEOUT_MS) {
        console.warn(`⏰ [SESSION] User idle for ${idleTimeMinutes} minutes (limit: ${timeoutMinutes}). Session expired!`)
        return false
      }
      
      console.log(`✅ [SESSION] Session valid. Idle: ${idleTimeMinutes}/${timeoutMinutes} minutes`)
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
      const now = Date.now()
      const sessionData: SessionData = {
        timestamp: now,
        lastCheck: now,
        lastActivity: now, // Initialize last activity
        user
      }
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sessionData))
      console.log('✅ [SESSION] Session data saved:', {
        user: user.email,
        timestamp: new Date(sessionData.timestamp).toISOString()
      })
      
      // Attach activity listeners
      this.attachActivityListeners()
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
   * Update last activity timestamp (called on user interaction)
   */
  static updateLastActivity(): void {
    try {
      const sessionData = this.getSessionData()
      if (sessionData) {
        sessionData.lastActivity = Date.now()
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sessionData))
      }
    } catch (error) {
      // Silent fail - don't spam console on every activity
    }
  }
  
  /**
   * Attach event listeners to track user activity
   * Throttled to update at most once per minute
   */
  static attachActivityListeners(): void {
    if (typeof window === 'undefined' || this.activityListenersAttached) return
    
    let lastUpdate = 0
    const THROTTLE_MS = 60000 // Update at most once per minute
    
    const handleActivity = () => {
      const now = Date.now()
      if (now - lastUpdate > THROTTLE_MS) {
        lastUpdate = now
        this.updateLastActivity()
      }
    }
    
    // Track various user activities
    window.addEventListener('click', handleActivity, { passive: true })
    window.addEventListener('keydown', handleActivity, { passive: true })
    window.addEventListener('scroll', handleActivity, { passive: true })
    window.addEventListener('mousemove', handleActivity, { passive: true })
    window.addEventListener('touchstart', handleActivity, { passive: true })
    
    this.activityListenersAttached = true
    console.log('🎯 [SESSION] Activity listeners attached for idle tracking')
  }
  
  /**
   * Get idle time in minutes
   */
  static getIdleTimeMinutes(): number {
    const sessionData = this.getSessionData()
    if (!sessionData) return 0
    
    const idleTime = Date.now() - (sessionData.lastActivity || sessionData.timestamp)
    return Math.floor(idleTime / 60000)
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
    idleMinutes: number
    minutesSinceLastCheck: number
    timeoutMinutes: number
    checkIntervalMinutes: number
    isExpired: boolean
    isIdle: boolean
    needsCookieCheck: boolean
  } | null {
    const sessionData = this.getSessionData()
    if (!sessionData) return null
    
    const now = Date.now()
    const sessionAge = now - sessionData.timestamp
    const idleTime = now - (sessionData.lastActivity || sessionData.timestamp)
    const timeSinceLastCheck = now - sessionData.lastCheck
    
    return {
      user: sessionData.user?.email,
      sessionAgeMinutes: Math.floor(sessionAge / 60000),
      idleMinutes: Math.floor(idleTime / 60000),
      minutesSinceLastCheck: Math.floor(timeSinceLastCheck / 60000),
      timeoutMinutes: SESSION_CONFIG.TIMEOUT_MINUTES,
      checkIntervalMinutes: SESSION_CONFIG.AUTH_CHECK_INTERVAL_MINUTES,
      isExpired: sessionAge > SESSION_CONFIG.TIMEOUT_MS,
      isIdle: idleTime > SESSION_CONFIG.TIMEOUT_MS,
      needsCookieCheck: timeSinceLastCheck > SESSION_CONFIG.AUTH_CHECK_INTERVAL_MS
    }
  }
}

export default SessionManager
