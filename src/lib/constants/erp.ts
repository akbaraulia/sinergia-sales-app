// ERPNext API Constants
// Note: Use ERP_ENV (server-side) for runtime config, NEXT_PUBLIC_ERP_ENV is baked at build time
const isProduction = process.env.ERP_ENV === 'PROD' || process.env.NEXT_PUBLIC_ERP_ENV === 'PROD'

export const ERP_CONFIG = {
  // Base URLs - use ERP_ENV for server-side runtime selection
  BASE_URL: isProduction
    ? process.env.ERP_BASE_URL || 'https://sinergia.digitalasiasolusindo.com'
    : process.env.ERP_DEV_BASE_URL || 'https://sinergiadev.digitalasiasolusindo.com',
  
  // API Endpoints
  ENDPOINTS: {
    LOGIN: '/api/method/login',
    USER_INFO: '/api/resource/User',
    LOGOUT: '/api/method/logout'
  },

  // Headers untuk semua request ke ERPNext
  // Note: Don't use 'Expect' header - undici doesn't support it
  HEADERS: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
} as const

// Bridging API Configuration for mobile apps integration
export const BRIDGING_CONFIG = {
  BASE_URL: 'https://erpnext.showmemore.id',
  ENDPOINTS: {
    BEBAS_PILIH_QUEUE: '/api/bebas-pilih/queue' // Append /{document_name}
  },
  HEADERS: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
} as const

// Role mapping dari ERPNext role_profile_name ke sistem kita
export const ROLE_MAPPING = {
  'Customer': 'salon',    // role_profile_name = "Customer" = salon
  'Sales': 'sales',       // role_profile_name = "Sales" = sales  
  'Administrator': 'admin' // Admin tidak ada role_profile_name, handled secara khusus
} as const

// Static admin emails yang otomatis jadi admin - USE ENVIRONMENT VARIABLES
export const ADMIN_EMAILS = [
  // Add admin emails via environment variables
  ...(process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',').map(email => email.trim()) : [])
] as const

// Permission mapping per role
export const ROLE_PERMISSIONS = {
  admin: [
    'admin',
    'view_all_orders',
    'view_all_customers', 
    'view_reports',
    'manage_users',
    'system_settings'
  ],
  sales: [
    'sales',
    'view_own_orders',
    'create_orders',
    'view_customers',
    'view_sales_reports'
  ],
  salon: [
    'salon',
    'view_own_orders', 
    'view_own_profile',
    'loyalty_points',
    'salon_dashboard'
  ]
} as const

export type UserRole = keyof typeof ROLE_PERMISSIONS
export type Permission = typeof ROLE_PERMISSIONS[UserRole][number]

// Session Management Configuration
export const SESSION_CONFIG = {
  TIMEOUT_MINUTES: parseInt(process.env.SESSION_TIMEOUT_MINUTES || '60'),
  AUTH_CHECK_INTERVAL_MINUTES: parseInt(process.env.AUTH_CHECK_INTERVAL_MINUTES || '5'),
  COOKIE_MAX_AGE_MINUTES: parseInt(process.env.COOKIE_MAX_AGE_MINUTES || '120'),
  
  // Derived values in milliseconds
  get TIMEOUT_MS() { return this.TIMEOUT_MINUTES * 60 * 1000 },
  get AUTH_CHECK_INTERVAL_MS() { return this.AUTH_CHECK_INTERVAL_MINUTES * 60 * 1000 },
  get COOKIE_MAX_AGE_MS() { return this.COOKIE_MAX_AGE_MINUTES * 60 * 1000 }
} as const
