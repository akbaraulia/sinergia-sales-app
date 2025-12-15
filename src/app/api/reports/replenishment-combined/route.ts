import { NextResponse } from 'next/server'
import { executeQuery2 } from '@/lib/db/mysql2'
import { executeQuery } from '@/lib/db/mysql'
import fs from 'fs'
import path from 'path'
import { 
  BRANCH_MAPPING, 
  mapSivfuToErp, 
  getActiveSivfuBranches,
  ACTIVE_ERP_BRANCHES 
} from '@/lib/constants/branch-mapping'
import type { 
  CombinedReportRow, 
  CombinedReportResponse
} from '@/types/combined-replenishment'

// Import helpers
function calcDiscrepancyLevel(
  sivfuValue: number | null,
  erpValue: number | null,
  hasSivfu: boolean,
  hasErp: boolean
): 'ok' | 'warning' | 'critical' | 'sivfu_only' | 'erp_only' {
  if (!hasSivfu && hasErp) return 'erp_only'
  if (hasSivfu && !hasErp) return 'sivfu_only'
  if (!hasSivfu && !hasErp) return 'ok'
  
  if (sivfuValue === null || erpValue === null) return 'ok'
  
  const delta = Math.abs(sivfuValue - erpValue)
  const average = (sivfuValue + erpValue) / 2
  
  if (average === 0) return 'ok'
  
  const percentage = (delta / average) * 100
  
  if (percentage < 10) return 'ok'
  if (percentage < 30) return 'warning'
  return 'critical'
}

function calcPercentageDiff(value1: number, value2: number): number {
  const average = (value1 + value2) / 2
  if (average === 0) return 0
  return ((value1 - value2) / average) * 100
}

export async function GET(request: Request) {
  const startTime = Date.now()
  
  try {
    console.log('📊 [COMBINED] Fetching combined replenishment report...')
    
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const branch = searchParams.get('branch') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = (page - 1) * limit

    // ===== STEP 1: Fetch SIVFU Data =====
    console.log('🔍 [COMBINED] Step 1: Fetching SIVFU data...')
    const sqlFilePath = path.join(process.cwd(), 'src', 'query', 'replan-sivfu.sql')
    let sivfuQuery = fs.readFileSync(sqlFilePath, 'utf-8')
    
    if (search) {
      sivfuQuery = `
        SELECT * FROM (
          ${sivfuQuery}
        ) AS filtered
        WHERE kode_item LIKE ? OR nama_item LIKE ?
      `
    }
    
    const sivfuParams = search ? [`%${search}%`, `%${search}%`] : []
    const sivfuRows = await executeQuery2<any>(sivfuQuery, sivfuParams)
    
    console.log(`✅ [COMBINED] SIVFU: ${sivfuRows.length} items fetched`)

    // ===== STEP 2: Fetch ERP Data =====
    console.log('🔍 [COMBINED] Step 2: Fetching ERP data...')
    
    const erpQuery = `
      WITH params AS (
        SELECT
          DATE_SUB(CURDATE(), INTERVAL DAY(CURDATE())-1 DAY) AS m0_start,
          EXTRACT(YEAR_MONTH FROM CURDATE()) AS m0_ym
      ),
      month_window AS (
        SELECT
          YEAR(DATE_SUB(p.m0_start, INTERVAL seq.mo MONTH)) AS report_year,
          MONTH(DATE_SUB(p.m0_start, INTERVAL seq.mo MONTH)) AS report_month,
          DATE_SUB(p.m0_start, INTERVAL seq.mo MONTH) AS period_start,
          LAST_DAY(DATE_SUB(p.m0_start, INTERVAL seq.mo MONTH)) AS period_end
        FROM params p
        CROSS JOIN (SELECT 0 AS mo UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3) seq
      ),
      bounded_sle AS (
        SELECT
          sle.posting_date, sle.posting_time, sle.creation,
          sle.company, sle.warehouse, sle.item_code,
          sle.actual_qty, sle.qty_after_transaction, sle.stock_value,
          sle.voucher_type, sle.voucher_no, sle.voucher_detail_no
        FROM \`tabStock Ledger Entry\` sle
        WHERE sle.is_cancelled = 0
          AND sle.posting_date >= (SELECT MIN(period_start) FROM month_window)
          AND sle.posting_date <= (SELECT MAX(period_end) FROM month_window)
      ),
      sle_with_refs AS (
        SELECT
          mw.report_year, mw.report_month,
          bs.posting_date, bs.posting_time, bs.creation,
          bs.company, bs.warehouse, bs.item_code,
          bs.actual_qty, bs.qty_after_transaction, bs.stock_value,
          bs.voucher_type, bs.voucher_no, bs.voucher_detail_no,
          se.stock_entry_type, se.workflow_state
        FROM bounded_sle bs
        JOIN month_window mw
          ON bs.posting_date BETWEEN mw.period_start AND mw.period_end
        LEFT JOIN \`tabStock Entry\` se
          ON se.name = bs.voucher_no
         AND bs.voucher_type = 'Stock Entry'
      ),
      monthly_snapshot AS (
        SELECT
          s.report_year, s.report_month, s.company, s.warehouse, s.item_code,
          s.qty_after_transaction, s.stock_value,
          ROW_NUMBER() OVER (
            PARTITION BY s.report_year, s.report_month, s.company, s.warehouse, s.item_code
            ORDER BY s.posting_date DESC, s.posting_time DESC, s.creation DESC
          ) rn
        FROM sle_with_refs s
      ),
      monthly_latest AS (
        SELECT
          report_year, report_month, company, warehouse, item_code,
          qty_after_transaction AS month_end_qty,
          stock_value AS month_end_stock_value
        FROM monthly_snapshot
        WHERE rn = 1
      ),
      monthly_totals_sle AS (
        SELECT
          s.report_year, s.report_month, s.company, s.warehouse, s.item_code,
          SUM(CASE WHEN s.voucher_type = 'Delivery Note'
                   THEN -s.actual_qty ELSE 0 END) AS delivery_note_qty_sle,
          SUM(CASE WHEN s.voucher_type = 'Stock Entry'
                    AND s.stock_entry_type = 'Material Issue'
                   THEN -s.actual_qty ELSE 0 END) AS material_issue_qty_sle
        FROM sle_with_refs s
        GROUP BY s.report_year, s.report_month, s.company, s.warehouse, s.item_code
      ),
      monthly_with_offset AS (
        SELECT
          mts.warehouse, mts.item_code,
          PERIOD_DIFF((SELECT p.m0_ym FROM params p), mts.report_year*100 + mts.report_month) AS m_off,
          mts.delivery_note_qty_sle AS delivery_note_qty,
          mts.material_issue_qty_sle AS material_issue_qty
        FROM monthly_totals_sle mts
      ),
      current_month_snapshot AS (
        SELECT
          ml.warehouse, ml.item_code,
          ml.month_end_qty AS current_month_qty,
          ml.month_end_stock_value AS current_month_stock_value
        FROM monthly_latest ml
        JOIN params p
          ON ml.report_year = YEAR(p.m0_start)
         AND ml.report_month = MONTH(p.m0_start)
      )
      SELECT
        w.company,
        COALESCE(w.custom_branch, w.custom_branch_id) AS branch_code,
        COALESCE(b.custom_nama, b.branch, b.name, w.company) AS branch_name,
        p.warehouse,
        p.item_code,
        i.item_name,
        COALESCE(cms.current_month_qty, 0) AS current_qty,
        SUM(CASE WHEN p.m_off = 1 THEN p.delivery_note_qty ELSE 0 END) AS delivery_note_qty_m1,
        SUM(CASE WHEN p.m_off = 2 THEN p.delivery_note_qty ELSE 0 END) AS delivery_note_qty_m2,
        SUM(CASE WHEN p.m_off = 3 THEN p.delivery_note_qty ELSE 0 END) AS delivery_note_qty_m3,
        SUM(CASE WHEN p.m_off = 1 THEN p.material_issue_qty ELSE 0 END) AS material_issue_qty_m1,
        SUM(CASE WHEN p.m_off = 2 THEN p.material_issue_qty ELSE 0 END) AS material_issue_qty_m2,
        SUM(CASE WHEN p.m_off = 3 THEN p.material_issue_qty ELSE 0 END) AS material_issue_qty_m3,
        (
          (COALESCE(SUM(CASE WHEN p.m_off = 1 THEN p.delivery_note_qty ELSE 0 END), 0) +
           COALESCE(SUM(CASE WHEN p.m_off = 1 THEN p.material_issue_qty ELSE 0 END), 0) +
           COALESCE(SUM(CASE WHEN p.m_off = 2 THEN p.delivery_note_qty ELSE 0 END), 0) +
           COALESCE(SUM(CASE WHEN p.m_off = 2 THEN p.material_issue_qty ELSE 0 END), 0) +
           COALESCE(SUM(CASE WHEN p.m_off = 3 THEN p.delivery_note_qty ELSE 0 END), 0) +
           COALESCE(SUM(CASE WHEN p.m_off = 3 THEN p.material_issue_qty ELSE 0 END), 0)) / 3.0
        ) AS avg_flow_m1_to_m3
      FROM monthly_with_offset p
      JOIN \`tabWarehouse\` w ON w.name = p.warehouse
      LEFT JOIN \`tabBranch\` b ON (b.name = w.custom_branch OR b.custom_id_branch = w.custom_branch_id)
      LEFT JOIN \`tabItem\` i ON i.name = p.item_code
      LEFT JOIN current_month_snapshot cms ON cms.warehouse = p.warehouse AND cms.item_code = p.item_code
      WHERE p.m_off BETWEEN 0 AND 3
      GROUP BY w.company, branch_code, branch_name, p.warehouse, p.item_code, i.item_name, cms.current_month_qty
      ORDER BY p.item_code, branch_name
    `
    
    interface ErpRawRow {
      company: string
      branch_code: string
      branch_name: string
      warehouse: string
      item_code: string
      item_name: string
      current_qty: number
      delivery_note_qty_m1: number
      delivery_note_qty_m2: number
      delivery_note_qty_m3: number
      material_issue_qty_m1: number
      material_issue_qty_m2: number
      material_issue_qty_m3: number
      avg_flow_m1_to_m3: number
    }
    
    const erpRows = await executeQuery<ErpRawRow>(erpQuery)
    
    console.log(`✅ [COMBINED] ERP: ${erpRows.length} warehouse rows fetched`)

    // ===== STEP 3: Build mapping structures =====
    console.log('🔄 [COMBINED] Step 3: Applying branch mapping...')
    
    // Create ERP branch → SIVFU branches mapping
    const erpBranchMap = new Map<string, string[]>() // ERP branch → SIVFU branches
    Object.entries(BRANCH_MAPPING).forEach(([sivfu, erp]) => {
      if (!erpBranchMap.has(erp)) {
        erpBranchMap.set(erp, [])
      }
      erpBranchMap.get(erp)!.push(sivfu)
    })

    // ===== STEP 4: Merge data by item_code =====
    console.log('🔗 [COMBINED] Step 4: Merging SIVFU and ERP data...')
    
    const mergedMap = new Map<string, CombinedReportRow>()
    
    // Process SIVFU data
    sivfuRows.forEach((sivfuRow: any) => {
      const itemCode = sivfuRow.kode_item
      const itemName = sivfuRow.nama_item
      const hppRef = sivfuRow.hpp_ref
      
      if (!mergedMap.has(itemCode)) {
        mergedMap.set(itemCode, {
          company: 'PT SINERGIA',
          item_code: itemCode,
          item_name: itemName,
          hpp_ref: hppRef,
          branches: [],
          total_sivfu_stock: 0,
          total_erp_stock: 0,
          total_sivfu_replen: 0,
          total_erp_replen: 0,
          overall_discrepancy: 'ok'
        })
      }
      
      const row = mergedMap.get(itemCode)!
      
      // Process each SIVFU branch
      const sivfuBranches = getActiveSivfuBranches().filter(b => b !== 'PHL') // Exclude PHL
      
      sivfuBranches.forEach(sivfuBranch => {
        const erpBranch = mapSivfuToErp(sivfuBranch)
        if (!erpBranch) return // Skip unmapped branches
        
        const stock = sivfuRow[`${sivfuBranch}_Stock`] || 0
        const replen = sivfuRow[`${sivfuBranch}_Replenish`] || 0
        const doi = sivfuRow[`${sivfuBranch}_DOI`] || 0
        const sM1 = sivfuRow[`${sivfuBranch}_S_M1`] || 0
        const sM2 = sivfuRow[`${sivfuBranch}_S_M2`] || 0
        const sM3 = sivfuRow[`${sivfuBranch}_S_M3`] || 0
        const lM1 = sivfuRow[`${sivfuBranch}_L_M1`] || 0
        const lM2 = sivfuRow[`${sivfuBranch}_L_M2`] || 0
        const lM3 = sivfuRow[`${sivfuBranch}_L_M3`] || 0
        const avgFlow = (sM1 + sM2 + sM3 + lM1 + lM2 + lM3) / 3
        
        // Find or create branch entry
        let branchData = row.branches.find(b => b.branch_code === erpBranch)
        if (!branchData) {
          branchData = {
            branch_code: erpBranch,
            branch_name: erpBranch,
            sivfu_branches: [],
            sivfu: {
              stock: 0,
              replenishment: 0,
              doi: 0,
              avg_flow: 0,
              buffer: 1.5, // Default, will get from DB if available
              sales_m1: 0,
              sales_m2: 0,
              sales_m3: 0,
              lain_m1: 0,
              lain_m2: 0,
              lain_m3: 0
            },
            erp: {
              stock: 0,
              replenishment: 0,
              doi: null,
              avg_flow: 0,
              buffer: 1,
              sales_m1: 0,
              sales_m2: 0,
              sales_m3: 0,
              bbk_m1: 0,
              bbk_m2: 0,
              bbk_m3: 0
            },
            delta: {
              stock: 0,
              stock_percentage: 0,
              replenishment: 0,
              replenishment_percentage: 0,
              doi: null,
              avg_flow: 0
            },
            discrepancy_level: 'ok',
            has_sivfu: false,
            has_erp: false
          }
          row.branches.push(branchData)
        }
        
        // Aggregate SIVFU data (sum if multiple branches map to same ERP branch)
        branchData.sivfu_branches.push(sivfuBranch)
        branchData.sivfu.stock += stock
        branchData.sivfu.replenishment += replen
        branchData.sivfu.doi = doi // Take last value or average
        branchData.sivfu.avg_flow += avgFlow
        branchData.sivfu.sales_m1 += sM1
        branchData.sivfu.sales_m2 += sM2
        branchData.sivfu.sales_m3 += sM3
        branchData.sivfu.lain_m1 += lM1
        branchData.sivfu.lain_m2 += lM2
        branchData.sivfu.lain_m3 += lM3
        branchData.has_sivfu = true
        
        row.total_sivfu_stock += stock
        row.total_sivfu_replen += replen
      })
    })
    
    // Process ERP data
    erpRows.forEach(erpRow => {
      const itemCode = erpRow.item_code
      const branchCode = erpRow.branch_code
      
      if (!mergedMap.has(itemCode)) {
        mergedMap.set(itemCode, {
          company: erpRow.company,
          item_code: itemCode,
          item_name: erpRow.item_name,
          hpp_ref: null,
          branches: [],
          total_sivfu_stock: 0,
          total_erp_stock: 0,
          total_sivfu_replen: 0,
          total_erp_replen: 0,
          overall_discrepancy: 'ok'
        })
      }
      
      const row = mergedMap.get(itemCode)!
      
      // Find or create branch entry
      let branchData = row.branches.find(b => b.branch_code === branchCode)
      if (!branchData) {
        branchData = {
          branch_code: branchCode,
          branch_name: erpRow.branch_name,
          sivfu_branches: [],
          sivfu: {
            stock: 0,
            replenishment: 0,
            doi: 0,
            avg_flow: 0,
            buffer: 1.5,
            sales_m1: 0,
            sales_m2: 0,
            sales_m3: 0,
            lain_m1: 0,
            lain_m2: 0,
            lain_m3: 0
          },
          erp: {
            stock: 0,
            replenishment: 0,
            doi: null,
            avg_flow: 0,
            buffer: 1,
            sales_m1: 0,
            sales_m2: 0,
            sales_m3: 0,
            bbk_m1: 0,
            bbk_m2: 0,
            bbk_m3: 0
          },
          delta: {
            stock: 0,
            stock_percentage: 0,
            replenishment: 0,
            replenishment_percentage: 0,
            doi: null,
            avg_flow: 0
          },
          discrepancy_level: 'ok',
          has_sivfu: false,
          has_erp: false
        }
        row.branches.push(branchData)
      }
      
      // Add ERP data
      branchData.erp.stock += erpRow.current_qty
      branchData.erp.sales_m1 += erpRow.delivery_note_qty_m1
      branchData.erp.sales_m2 += erpRow.delivery_note_qty_m2
      branchData.erp.sales_m3 += erpRow.delivery_note_qty_m3
      branchData.erp.bbk_m1 += erpRow.material_issue_qty_m1
      branchData.erp.bbk_m2 += erpRow.material_issue_qty_m2
      branchData.erp.bbk_m3 += erpRow.material_issue_qty_m3
      branchData.erp.avg_flow += erpRow.avg_flow_m1_to_m3
      branchData.has_erp = true
      
      row.total_erp_stock += erpRow.current_qty
    })
    
    // ===== STEP 5: Calculate deltas and replenishment =====
    console.log('📊 [COMBINED] Step 5: Calculating deltas and discrepancies...')
    
    mergedMap.forEach(row => {
      row.branches.forEach(branch => {
        // Calculate ERP replenishment: Stock - (AvgFlow × Buffer)
        const erpBuffer = 1 // Use buffer from SIVFU (DB) for consistency
        branch.erp.buffer = branch.sivfu.buffer // Use SIVFU buffer
        branch.erp.replenishment = branch.erp.stock - (branch.erp.avg_flow * branch.erp.buffer)
        branch.erp.doi = branch.erp.avg_flow > 0 ? branch.erp.stock / branch.erp.avg_flow : null
        
        row.total_erp_replen += branch.erp.replenishment
        
        // Calculate deltas
        branch.delta.stock = branch.sivfu.stock - branch.erp.stock
        branch.delta.stock_percentage = calcPercentageDiff(branch.sivfu.stock, branch.erp.stock)
        
        branch.delta.replenishment = branch.sivfu.replenishment - branch.erp.replenishment
        branch.delta.replenishment_percentage = calcPercentageDiff(
          branch.sivfu.replenishment,
          branch.erp.replenishment
        )
        
        branch.delta.avg_flow = branch.sivfu.avg_flow - branch.erp.avg_flow
        
        if (branch.sivfu.doi && branch.erp.doi) {
          branch.delta.doi = branch.sivfu.doi - branch.erp.doi
        }
        
        // Calculate discrepancy level
        branch.discrepancy_level = calcDiscrepancyLevel(
          branch.sivfu.stock,
          branch.erp.stock,
          branch.has_sivfu,
          branch.has_erp
        )
        
        // Update overall discrepancy
        if (branch.discrepancy_level === 'critical') {
          row.overall_discrepancy = 'critical'
        } else if (branch.discrepancy_level === 'warning' && row.overall_discrepancy !== 'critical') {
          row.overall_discrepancy = 'warning'
        }
      })
    })
    
    // ===== STEP 6: Filter and paginate =====
    const allRows = Array.from(mergedMap.values())
    
    let filteredRows = allRows
    if (branch) {
      filteredRows = allRows.filter(row => 
        row.branches.some(b => b.branch_code === branch || b.branch_name.includes(branch))
      )
    }
    
    const total = filteredRows.length
    const totalPages = Math.ceil(total / limit)
    const paginatedRows = filteredRows.slice(offset, offset + limit)
    
    const queryTime = Date.now() - startTime
    
    console.log(`✅ [COMBINED] Merged ${total} items in ${queryTime}ms`)
    
    const response: CombinedReportResponse = {
      success: true,
      data: paginatedRows,
      total,
      page,
      limit,
      totalPages,
      timestamp: new Date().toISOString(),
      metadata: {
        sivfu_branches_count: getActiveSivfuBranches().length,
        erp_branches_count: ACTIVE_ERP_BRANCHES.length,
        mapped_branches_count: Object.keys(BRANCH_MAPPING).length,
        query_time_ms: queryTime
      }
    }
    
    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
        'Content-Type': 'application/json',
      }
    })
    
  } catch (error) {
    console.error('❌ [COMBINED] Error:', error)
    
    const response: CombinedReportResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }
    
    return NextResponse.json(response, { status: 500 })
  }
}
