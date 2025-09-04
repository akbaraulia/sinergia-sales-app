// ERPNext API Constants
export const ERP_CONFIG = {
  // Base URLs - use custom env selector
  BASE_URL: process.env.NEXT_PUBLIC_ERP_ENV === 'PROD'
    ? process.env.ERP_BASE_URL || 'https://sinergia.digitalasiasolusindo.com'
    : process.env.ERP_DEV_BASE_URL || 'https://sinergiadev.digitalasiasolusindo.com',
  
  // API Endpoints
  ENDPOINTS: {
    LOGIN: '/api/method/login',
    USER_INFO: '/api/resource/User',
    LOGOUT: '/api/method/logout'
  },

  // Headers untuk semua request ke ERPNext
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
