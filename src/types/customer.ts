// Customer Data Types

export interface SalesTeamMember {
  sales_person: string
  sales_person_name: string
}

export interface Customer {
  name: string
  customer_name: string
  customer_group: string
  territory: string
  image?: string | null
  mobile_no?: string
  email_id?: string
  primary_address?: string
  custom_customer_id?: string | null
  default_price_list?: string
  custom_branch?: string
  custom_rayon?: string
  loyalty_program?: string | null
  loyalty_program_tier?: string | null
  custom_status?: string
  custom_nama_salontoko?: string | null
  custom_lifetime_omset?: number
  calculated_loyalty_points?: number
  custom_user?: string | null // Link to User doctype (mobile app user)
  sales_team?: SalesTeamMember[]
  activation_status?: string // "Activated" | "Pending Activation (Dummy)" | "Not Registered"
  linked_user_account?: {
    user_id: string
    full_name: string
    is_enabled: number
  } | null
  custom_login_email?: string | null // Email for activation (can be edited)
  is_converted?: number | null // 1 = activated/converted, 0/null = not converted
}

export interface CustomerFilters {
  branch?: string
  rayon?: string
  name?: string
  customer_id?: string
}

export interface PaginationInfo {
  page: number
  limit: number
  total: number
  hasMore: boolean
  totalPages: number
}

export interface CustomerAPIResponse {
  success: boolean
  customers: Customer[]
  count: number
  pagination: PaginationInfo
  filters?: CustomerFilters
  message?: string
  error?: string
}

export interface CustomerDetailAPIResponse {
  success: boolean
  customer?: Customer
  error?: string
}
