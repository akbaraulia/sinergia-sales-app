/**
 * CSV Generator Helper Functions
 * Generates CSV files for replenishment reports
 */

import type { ReplenishmentReportRow } from '@/types/replenishment'
import type { CombinedReportRow } from '@/types/combined-replenishment'

// 35 branches from SIVFU query
const SIVFU_BRANCHES = [
  'JKT', 'SBY', 'SMG', 'MDN', 'HO', 'MKS', 'BJM', 'PKU', 'DPS', 'PLG',
  'YGY', 'MND', 'KPG', 'PDG', 'PDG1', 'SMR1', 'DP1', 'MDN1', 'AMB', 'HO2',
  'PKU1', 'JMB1', 'BKP', 'PLU1', 'AMB1', 'PLG1', 'MKS1', 'BJM1', 'MKP', 'PHL',
  'PTK1', 'MKPS', 'MKPM', 'MKPN', 'LPG1'
]

// Buffer mapping per branch
function getBufferByBranch(branchCode: string): number {
  if (!branchCode) return 1
  const branch = branchCode.toUpperCase()
  if (['JKT', 'HO', 'MKP'].includes(branch)) return 1
  if (['YGY', 'SBY'].includes(branch)) return 2
  if (['MDN', 'PKB', 'PLG', 'PDG', 'DP', 'PKU'].includes(branch)) return 2
  if (['KPG', 'MND', 'MKS', 'BKP', 'PTK'].includes(branch)) return 4
  return 1
}

// Calculate dynamic month labels
function getMonthLabel(monthsAgo: number): string {
  const date = new Date()
  date.setMonth(date.getMonth() - monthsAgo)
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${monthNames[date.getMonth()]} ${date.getFullYear()}`
}

const monthLabels = {
  m0: getMonthLabel(0),
  m1: getMonthLabel(1),
  m2: getMonthLabel(2),
  m3: getMonthLabel(3)
}

/**
 * Generate CSV for Replenishment (ERP) report
 */
export function generateReplenishmentCSV(data: ReplenishmentReportRow[]): string {
  // Collect all unique warehouses
  const allWarehousesSet = new Set<string>()
  const warehouseDetails = new Map<string, { branch: string, warehouse: string }>()
  
  data.forEach(row => {
    row.warehouses.forEach(wh => {
      const key = wh.warehouse
      allWarehousesSet.add(key)
      if (!warehouseDetails.has(key)) {
        warehouseDetails.set(key, {
          branch: wh.branch_name,
          warehouse: wh.warehouse
        })
      }
    })
  })

  // Sort warehouses
  const sortedWarehouseKeys = Array.from(allWarehousesSet).sort((a, b) => {
    const detailA = warehouseDetails.get(a)!
    const detailB = warehouseDetails.get(b)!
    const branchCompare = detailA.branch.localeCompare(detailB.branch)
    return branchCompare !== 0 ? branchCompare : detailA.warehouse.localeCompare(detailB.warehouse)
  })

  // Build headers
  const warehouseHeaders: string[] = []
  sortedWarehouseKeys.forEach(whKey => {
    const detail = warehouseDetails.get(whKey)!
    const whPrefix = `${detail.branch} - ${detail.warehouse}`
    warehouseHeaders.push(
      `${whPrefix} - Total Stock`,
      `${whPrefix} - Sales ${monthLabels.m0}`,
      `${whPrefix} - Sales ${monthLabels.m1}`,
      `${whPrefix} - Sales ${monthLabels.m2}`,
      `${whPrefix} - Sales ${monthLabels.m3}`,
      `${whPrefix} - BBK ${monthLabels.m0}`,
      `${whPrefix} - BBK ${monthLabels.m1}`,
      `${whPrefix} - BBK ${monthLabels.m2}`,
      `${whPrefix} - BBK ${monthLabels.m3}`,
      `${whPrefix} - Avg Flow`,
      `${whPrefix} - DOI`,
      `${whPrefix} - REPLENISHMENT`
    )
  })

  const headers = [
    'Company',
    'Item Code',
    'Item Name',
    ...warehouseHeaders,
    'Total Qty',
    'Total Stock Value',
    'Overall DOI'
  ]

  const csvRows = [
    headers.join(','),
    ...data.map(row => {
      const warehouseData: (string | number)[] = []
      
      sortedWarehouseKeys.forEach(whKey => {
        const wh = row.warehouses.find(w => w.warehouse === whKey)
        if (wh) {
          const buffer = getBufferByBranch(wh.branch_code)
          const replenishment = wh.current_qty - (wh.avg_flow_m1_to_m3 * buffer)
          
          warehouseData.push(
            wh.current_qty,
            wh.delivery_note_qty_m0,
            wh.delivery_note_qty_m1,
            wh.delivery_note_qty_m2,
            wh.delivery_note_qty_m3,
            wh.material_issue_qty_m0,
            wh.material_issue_qty_m1,
            wh.material_issue_qty_m2,
            wh.material_issue_qty_m3,
            wh.avg_flow_m1_to_m3,
            wh.doi_adjusted || '',
            replenishment
          )
        } else {
          warehouseData.push(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, '', 0)
        }
      })

      return [
        row.company,
        row.item_code,
        `"${row.item_name || ''}"`,
        ...warehouseData,
        row.total_current_qty,
        row.total_stock_value,
        row.overall_doi || ''
      ].join(',')
    })
  ]

  return csvRows.join('\n')
}

/**
 * Generate CSV for Replenishment SIVFU report
 */
export function generateReplenishmentSIVFUCSV(data: any[]): string {
  // Build CSV header
  let csvContent = 'Kode Item,Nama Item,HPP,'
  csvContent += 'Total Stock,Total Replenish,Total DOI,Total Avg Flow,'
  csvContent += `Sales ${monthLabels.m0},Sales ${monthLabels.m1},Sales ${monthLabels.m2},Sales ${monthLabels.m3},`
  csvContent += `Lain ${monthLabels.m0},Lain ${monthLabels.m1},Lain ${monthLabels.m2},Lain ${monthLabels.m3},`
  
  // Add branch columns
  SIVFU_BRANCHES.forEach(branch => {
    csvContent += `${branch} Stock,${branch} Sales M0,${branch} Sales M1,${branch} Sales M2,${branch} Sales M3,`
    csvContent += `${branch} Lain M0,${branch} Lain M1,${branch} Lain M2,${branch} Lain M3,${branch} Replenish,${branch} DOI,${branch} Avg Flow,`
  })
  csvContent += '\n'

  // Add data rows
  data.forEach(row => {
    csvContent += `"${row.kode_item}","${row.nama_item}",${row.hpp_ref || 0},`
    csvContent += `${row.Nas_Total_Stock},${row.Nas_Total_Replenish},${row.Nas_Total_DOI},${row.Nas_Avg_Flow || 0},`
    csvContent += `${row.Nas_Sales_M0},${row.Nas_Sales_M1},${row.Nas_Sales_M2},${row.Nas_Sales_M3},`
    csvContent += `${row.Nas_Lain_M0},${row.Nas_Lain_M1},${row.Nas_Lain_M2},${row.Nas_Lain_M3},`
    
    SIVFU_BRANCHES.forEach(branch => {
      const avgFlow = row[`${branch}_Avg_Flow`] || 0
      const stock = row[`${branch}_Stock`] || 0
      const salesM0 = row[`${branch}_Sales_M0`] || 0
      const salesM1 = row[`${branch}_Sales_M1`] || 0
      const salesM2 = row[`${branch}_Sales_M2`] || 0
      const salesM3 = row[`${branch}_Sales_M3`] || 0
      const lainM0 = row[`${branch}_Lain_M0`] || 0
      const lainM1 = row[`${branch}_Lain_M1`] || 0
      const lainM2 = row[`${branch}_Lain_M2`] || 0
      const lainM3 = row[`${branch}_Lain_M3`] || 0
      const doi = row[`${branch}_DOI`] || ''
      const buffer = getBufferByBranch(branch)
      const replenish = stock - (avgFlow * buffer)

      csvContent += `${stock},${salesM0},${salesM1},${salesM2},${salesM3},`
      csvContent += `${lainM0},${lainM1},${lainM2},${lainM3},${replenish},${doi},${avgFlow},`
    })
    csvContent += '\n'
  })

  return csvContent
}

/**
 * Generate CSV for Replenishment Combined report
 */
export function generateReplenishmentCombinedCSV(data: CombinedReportRow[]): string {
  let csvContent = 'Item Code,Item Name,Branch,SIVFU Stock,SIVFU Replen,SIVFU DOI,SIVFU Avg Flow,'
  csvContent += 'ERP Stock,ERP Replen,ERP DOI,ERP Avg Flow,'
  csvContent += 'Delta Stock,Delta Stock %,Delta Replen,Delta Replen %,Discrepancy\n'

  data.forEach(row => {
    row.branches.forEach(branch => {
      const safeToFixed = (num: any, decimals: number): string => {
        if (num === null || num === undefined) return ''
        const parsed = typeof num === 'string' ? parseFloat(num) : num
        if (isNaN(parsed)) return ''
        return parsed.toFixed(decimals)
      }

      csvContent += `"${row.item_code}","${row.item_name}",${branch.branch_code},`
      csvContent += `${branch.sivfu.stock},${branch.sivfu.replenishment},${branch.sivfu.doi || ''},${safeToFixed(branch.sivfu.avg_flow, 1)},`
      csvContent += `${branch.erp.stock},${safeToFixed(branch.erp.replenishment, 0)},${branch.erp.doi || ''},${safeToFixed(branch.erp.avg_flow, 1)},`
      csvContent += `${branch.delta.stock},${safeToFixed(branch.delta.stock_percentage, 1)}%,`
      csvContent += `${safeToFixed(branch.delta.replenishment, 0)},${safeToFixed(branch.delta.replenishment_percentage, 1)}%,`
      csvContent += `${branch.discrepancy_level}\n`
    })
  })

  return csvContent
}

/**
 * Helper: Get CSV file size in KB
 */
export function getCSVSize(csvContent: string): number {
  return Buffer.from(csvContent).length / 1024
}

/**
 * Helper: Count CSV rows (excluding header)
 */
export function getCSVRowCount(csvContent: string): number {
  return csvContent.split('\n').length - 2 // -2 for header and trailing newline
}
