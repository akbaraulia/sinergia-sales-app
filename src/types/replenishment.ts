// Replenishment Report Types
export interface ReplenishmentReportRow {
  company: string
  branch_code: string
  branch_name: string
  warehouse: string
  item_code: string
  item_name: string
  
  // Current stock data
  current_qty: number
  current_stock_value: number
  
  // Sales quantities per month (m0=current, m1=1 month ago, etc)
  delivery_note_qty_m0: number
  delivery_note_qty_m1: number
  delivery_note_qty_m2: number
  delivery_note_qty_m3: number
  
  // Material Issue/BBP quantities per month
  material_issue_qty_m0: number
  material_issue_qty_m1: number
  material_issue_qty_m2: number
  material_issue_qty_m3: number
  
  // Calculated fields
  adjusted_current_qty: number        // current_qty (without transfer in)
  avg_flow_m1_to_m3: number          // Average flow (sales + issue) for m1-m3
  doi_adjusted: number | null        // Days of Inventory
}

export interface BranchWithWarehouses {
  name: string
  branch_label: string
  warehouses: {
    name: string
    warehouse_name: string
  }[]
}

export interface ReplenishmentReportFilters {
  branch?: string
  warehouse?: string
  item_code?: string
  company?: string
  search?: string
}

export interface ReplenishmentReportResponse {
  success: boolean
  data?: ReplenishmentReportRow[]
  total?: number
  page?: number
  limit?: number
  totalPages?: number
  error?: string
  timestamp: string
}

export interface StructuredFiltersResponse {
  success: boolean
  branches_with_warehouses: BranchWithWarehouses[]
  count: number
}

