/**
 * Combined Replenishment Report Types
 * Merges SIVFU and ERP replenishment data with branch mapping
 */

export type DiscrepancyLevel = 'ok' | 'warning' | 'critical' | 'sivfu_only' | 'erp_only'

export interface SivfuData {
  stock: number
  replenishment: number
  doi: number
  avg_flow: number
  buffer: number
  sales_m1: number
  sales_m2: number
  sales_m3: number
  lain_m1: number
  lain_m2: number
  lain_m3: number
}

export interface ErpData {
  stock: number
  replenishment: number
  doi: number | null
  avg_flow: number
  buffer: number
  sales_m1: number
  sales_m2: number
  sales_m3: number
  bbk_m1: number
  bbk_m2: number
  bbk_m3: number
}

export interface DeltaData {
  stock: number
  stock_percentage: number
  replenishment: number
  replenishment_percentage: number
  doi: number | null
  avg_flow: number
}

export interface CombinedBranchData {
  branch_code: string // ERP branch code (after mapping)
  branch_name: string
  sivfu_branches: string[] // Original SIVFU branches that mapped here
  
  // SIVFU data (aggregated if multiple branches)
  sivfu: SivfuData
  
  // ERP data
  erp: ErpData
  
  // Deltas (SIVFU - ERP)
  delta: DeltaData
  
  // Discrepancy level
  discrepancy_level: DiscrepancyLevel
  
  // Data availability
  has_sivfu: boolean
  has_erp: boolean
}

export interface CombinedReportRow {
  company: string
  item_code: string
  item_name: string
  hpp_ref: number | null
  
  // Branch data
  branches: CombinedBranchData[]
  
  // Overall totals (across all branches)
  total_sivfu_stock: number
  total_erp_stock: number
  total_sivfu_replen: number
  total_erp_replen: number
  overall_discrepancy: DiscrepancyLevel
}

export interface CombinedReportResponse {
  success: boolean
  data?: CombinedReportRow[]
  total?: number
  page?: number
  limit?: number
  totalPages?: number
  timestamp: string
  error?: string
  metadata?: {
    sivfu_branches_count: number
    erp_branches_count: number
    mapped_branches_count: number
    query_time_ms: number
  }
}

// Helper function to calculate discrepancy level
export function calculateDiscrepancyLevel(
  sivfuValue: number | null,
  erpValue: number | null,
  hasSivfu: boolean,
  hasErp: boolean
): DiscrepancyLevel {
  if (!hasSivfu && hasErp) return 'erp_only'
  if (hasSivfu && !hasErp) return 'sivfu_only'
  if (!hasSivfu && !hasErp) return 'ok' // Both missing
  
  if (sivfuValue === null || erpValue === null) return 'ok'
  
  const delta = Math.abs(sivfuValue - erpValue)
  const average = (sivfuValue + erpValue) / 2
  
  if (average === 0) return 'ok'
  
  const percentage = (delta / average) * 100
  
  if (percentage < 10) return 'ok'
  if (percentage < 30) return 'warning'
  return 'critical'
}

// Helper to calculate percentage difference
export function calculatePercentageDiff(
  value1: number,
  value2: number
): number {
  const average = (value1 + value2) / 2
  if (average === 0) return 0
  return ((value1 - value2) / average) * 100
}
