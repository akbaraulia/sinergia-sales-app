// Sales Order Types
export interface SalesOrderItem {
  item_code: string
  item_name: string
  qty: number
  rate: number
  amount: number
  image: string | null
}

export interface SalesTeamMember {
  sales_person: string
  sales_person_name: string
}

export interface SalesOrder {
  name: string
  title: string
  customer: string
  customer_name: string
  transaction_date: string
  delivery_date: string
  po_no: string | null
  company: string
  grand_total: number
  status: string
  per_delivered: number
  per_billed: number
  items: SalesOrderItem[]
  sales_team: SalesTeamMember[]
}

export interface SalesOrdersResponse {
  data: SalesOrder[]
}

export interface SalesOrderDetailResponse {
  data: SalesOrder[]
}

// Status mapping for badges
export const SALES_ORDER_STATUS_MAP: Record<string, 'approved' | 'pending' | 'active' | 'rejected' | 'draft'> = {
  'Completed': 'approved',
  'To Deliver and Bill': 'active',
  'To Bill': 'active',
  'To Deliver': 'active',
  'Draft': 'draft',
  'Cancelled': 'rejected',
  'On Hold': 'pending'
}

// Helper function to get image URL
export function getImageUrl(imagePath: string | null, baseUrl: string): string {
  if (!imagePath) return '/placeholder-product.png'
  if (imagePath.startsWith('http')) return imagePath
  return `${baseUrl}${imagePath}`
}

// Helper function to format currency
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

// Helper function to format date
export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(date)
}
