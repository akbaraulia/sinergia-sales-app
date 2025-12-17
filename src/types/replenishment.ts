// Replenishment Report Types

// Warehouse-specific data for pivoted view
export interface WarehouseData {
  warehouse: string
  warehouse_name: string
  branch_code: string
  branch_name: string
  custom_lead_time_in_month: number
  current_qty: number
  current_stock_value: number
  delivery_note_qty_m0: number
  delivery_note_qty_m1: number
  delivery_note_qty_m2: number
  delivery_note_qty_m3: number
  material_issue_qty_m0: number
  material_issue_qty_m1: number
  material_issue_qty_m2: number
  material_issue_qty_m3: number
  adjusted_current_qty: number
  avg_flow_m1_to_m3: number
  doi_adjusted: number | null
}

// Pivoted row - one row per item with all warehouses
export interface ReplenishmentReportRow {
  company?: string  // Optional - not displayed in UI
  item_code: string
  custom_old_item_code?: string  // Old item code from ERP
  item_name: string
  
  // Array of warehouse data - each warehouse becomes a column group
  warehouses: WarehouseData[]
  
  // Totals across all warehouses (calculated from warehouses in UI)
  total_current_qty: number
  total_stock_value: number
  total_avg_flow: number
  overall_doi: number | null
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

