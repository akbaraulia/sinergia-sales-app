import { ERP_CONFIG, ROLE_MAPPING, ADMIN_EMAILS, ROLE_PERMISSIONS, type UserRole } from '@/lib/constants/erp'

export interface ERPUser {
  name: string
  email: string
  first_name: string
  last_name: string
  full_name: string
  role_profile_name?: string
  roles: Array<{
    role: string
  }>
  custom_allowed_branches?: Array<{
    branch: string
    [key: string]: any
  }>
}

export interface LoginResponse {
  success: boolean
  user?: {
    email: string
    name: string
    role: UserRole
    permissions: string[]
    allowed_branches?: string[]
    cookies?: string
  }
  error?: string
}

class ERPNextClient {
  private baseUrl: string
  
  constructor() {
    this.baseUrl = ERP_CONFIG.BASE_URL
  }

  /**
   * Login ke ERPNext dengan credential
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const loginUrl = `${this.baseUrl}${ERP_CONFIG.ENDPOINTS.LOGIN}`
      const loginBody = {
        usr: email,
        pwd: password
      }
      
      // Development debugging
      if (process.env.NODE_ENV === 'development') {
        console.log('🌐 [DEV] ERP Login Request:', {
          url: loginUrl,
          body: { usr: email, pwd: '***' },
          headers: ERP_CONFIG.HEADERS
        })
      }
      
      console.log(`🔐 Attempting login to: ${this.baseUrl}`)
      
      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: ERP_CONFIG.HEADERS,
        body: JSON.stringify(loginBody),
        credentials: 'include' // Penting untuk cookies
      })

      // Development debugging - response details
      if (process.env.NODE_ENV === 'development') {
        console.log('📡 [DEV] ERP Response:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          url: response.url
        })
      }

      const data = await response.json()
      
      // Development debugging - response data
      if (process.env.NODE_ENV === 'development') {
        console.log('📋 [DEV] ERP Response Data:', data)
      }
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`)
      }

      console.log('✅ Login successful, fetching user info...')
      
      // Get cookies dari response
      const cookies = response.headers.get('set-cookie')
      
      // Fetch user info setelah login berhasil
      const userInfo = await this.getUserInfo(email)
      
      if (!userInfo.success || !userInfo.user) {
        throw new Error('Failed to fetch user information')
      }

      return {
        success: true,
        user: {
          ...userInfo.user,
          cookies: cookies || undefined
        }
      }

    } catch (error) {
      console.error('❌ Login error:', error)
      
      // Development debugging - error details
      if (process.env.NODE_ENV === 'development') {
        console.error('🐛 [DEV] Login Error Details:', {
          error: error instanceof Error ? error.message : error,
          stack: error instanceof Error ? error.stack : null,
          url: `${this.baseUrl}${ERP_CONFIG.ENDPOINTS.LOGIN}`
        })
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed'
      }
    }
  }

  /**
   * Get user information dari ERPNext
   */
  async getUserInfo(email: string): Promise<LoginResponse> {
    try {
      // Fetch specific fields including custom_allowed_branches
      const fields = encodeURIComponent(JSON.stringify([
        'email',
        'full_name',
        'role_profile_name',
        'roles',
        'custom_allowed_branches'
      ]))
      const userUrl = `${this.baseUrl}${ERP_CONFIG.ENDPOINTS.USER_INFO}/${email}?fields=${fields}`
      
      // Development debugging
      if (process.env.NODE_ENV === 'development') {
        console.log('👤 [DEV] Fetching user info:', {
          url: userUrl,
          headers: ERP_CONFIG.HEADERS
        })
      }
      
      const response = await fetch(userUrl, {
        method: 'GET',
        headers: ERP_CONFIG.HEADERS,
        credentials: 'include' // Include cookies for authentication
      })

      // Development debugging - response details
      if (process.env.NODE_ENV === 'development') {
        console.log('📡 [DEV] User Info Response:', {
          status: response.status,
          statusText: response.statusText,
          url: response.url
        })
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch user info: HTTP ${response.status} ${response.statusText}`)
      }

      const result = await response.json()
      const userData: ERPUser = result.data

      // Development debugging - user data
      if (process.env.NODE_ENV === 'development') {
        console.log('👤 [DEV] User Data:', {
          email: userData.email,
          name: userData.full_name,
          role_profile_name: userData.role_profile_name,
          roles_count: userData.roles?.length || 0,
          roles: userData.roles?.map(r => r.role).slice(0, 5), // First 5 roles only
          allowed_branches_count: userData.custom_allowed_branches?.length || 0,
          allowed_branches: userData.custom_allowed_branches?.map(b => b.branch).slice(0, 5) // First 5 branches
        })
      }

      // Determine role berdasarkan email atau role_profile_name
      const role = this.determineUserRole(userData)
      const permissions = ROLE_PERMISSIONS[role]
      
      // Extract allowed branches from custom field
      const allowedBranches = userData.custom_allowed_branches?.map(b => b.branch) || []

      // Development debugging - final result
      if (process.env.NODE_ENV === 'development') {
        console.log('🎯 [DEV] Role Determination:', {
          determined_role: role,
          permissions_count: permissions.length,
          permissions: [...permissions],
          allowed_branches_count: allowedBranches.length,
          allowed_branches: allowedBranches
        })
      }

      return {
        success: true,
        user: {
          email: userData.email,
          name: userData.full_name,
          role,
          permissions: [...permissions], // Convert readonly array to mutable array
          allowed_branches: allowedBranches
        }
      }

    } catch (error) {
      console.error('❌ Get user info error:', error)
      
      // Development debugging
      if (process.env.NODE_ENV === 'development') {
        console.error('🐛 [DEV] User Info Error:', {
          error: error instanceof Error ? error.message : error,
          url: `${this.baseUrl}${ERP_CONFIG.ENDPOINTS.USER_INFO}/${email}`
        })
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch user info'
      }
    }
  }

  /**
   * Tentukan role user berdasarkan email dan role_profile_name
   */
  private determineUserRole(user: ERPUser): UserRole {
    // Check if admin berdasarkan email
    if (ADMIN_EMAILS.includes(user.email as any)) {
      console.log(`👑 Admin detected: ${user.email}`)
      return 'admin'
    }

    // Check role_profile_name
    if (user.role_profile_name && user.role_profile_name in ROLE_MAPPING) {
      const role = ROLE_MAPPING[user.role_profile_name as keyof typeof ROLE_MAPPING]
      console.log(`📋 Role from profile: ${user.role_profile_name} → ${role}`)
      return role
    }

    // Default fallback - check specific roles in roles array
    const userRoles = user.roles?.map(r => r.role) || []
    
    if (userRoles.includes('Sales Order User') || userRoles.includes('Sales Invoice User')) {
      console.log('💼 Sales role detected from roles array')
      return 'sales'
    }

    // Default ke salon jika tidak ada yang cocok
    console.log('🏪 Defaulting to salon role')
    return 'salon'
  }

  /**
   * Logout dari ERPNext
   */
  async logout(): Promise<{ success: boolean }> {
    try {
      await fetch(`${this.baseUrl}${ERP_CONFIG.ENDPOINTS.LOGOUT}`, {
        method: 'POST',
        headers: ERP_CONFIG.HEADERS,
        credentials: 'include'
      })

      return { success: true }
    } catch (error) {
      console.error('❌ Logout error:', error)
      return { success: false }
    }
  }
}

// Export singleton instance
export const erpClient = new ERPNextClient()
export default erpClient
