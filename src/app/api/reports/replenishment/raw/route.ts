import { NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db/mysql'

const REPLENISHMENT_QUERY = `
/* Replenishment Monthly Pivot (m0..m3) + Override Jun/Jul/Agu 2025 */
WITH params AS (
  SELECT
    DATE_SUB(CURDATE(), INTERVAL DAY(CURDATE())-1 DAY) AS m0_start,
    EXTRACT(YEAR_MONTH FROM CURDATE())                AS m0_ym
),
month_window AS (
  SELECT
    YEAR(DATE_SUB(p.m0_start, INTERVAL seq.mo MONTH))  AS report_year,
    MONTH(DATE_SUB(p.m0_start, INTERVAL seq.mo MONTH)) AS report_month,
    DATE_SUB(p.m0_start, INTERVAL seq.mo MONTH)        AS period_start,
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
    AND sle.posting_date <= (SELECT MAX(period_end)   FROM month_window)
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
    stock_value          AS month_end_stock_value
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
             THEN -s.actual_qty ELSE 0 END) AS material_issue_qty_sle,
    SUM(CASE WHEN s.voucher_type = 'Stock Entry'
              AND s.stock_entry_type = 'Material Transfer'
              AND COALESCE(s.workflow_state,'') = 'Hold in Transit'
              AND s.actual_qty > 0
             THEN s.actual_qty ELSE 0 END) AS transfer_in_qty
  FROM sle_with_refs s
  GROUP BY s.report_year, s.report_month, s.company, s.warehouse, s.item_code
),
rep_src AS (
  SELECT
    CAST(r.year  AS UNSIGNED) AS report_year,
    CAST(r.month AS UNSIGNED) AS report_month,
    r.warehouse,
    r.item       AS item_code,
    SUM(CAST(r.sales_qty AS DECIMAL(18,6))) AS delivery_note_qty_rep,
    SUM(CAST(r.issue_qty AS DECIMAL(18,6))) AS material_issue_qty_rep
  FROM \`tabSivfu Replenishment\` r
  WHERE CAST(r.year  AS UNSIGNED) = 2025
    AND CAST(r.month AS UNSIGNED) IN (6,7,8)
  GROUP BY CAST(r.year AS UNSIGNED), CAST(r.month AS UNSIGNED), r.warehouse, r.item
),
month_item_keys AS (
  SELECT report_year, report_month, warehouse, item_code
  FROM monthly_totals_sle
  UNION
  SELECT rs.report_year, rs.report_month, rs.warehouse, rs.item_code
  FROM rep_src rs
),
monthly_totals_merged AS (
  SELECT
    mik.report_year, mik.report_month,
    mik.warehouse, mik.item_code,
    CASE
      WHEN mik.report_year = 2025 AND mik.report_month IN (6,7,8)
      THEN COALESCE(rs.delivery_note_qty_rep, 0)
      ELSE COALESCE(mts.delivery_note_qty_sle, 0)
    END AS delivery_note_qty,
    CASE
      WHEN mik.report_year = 2025 AND mik.report_month IN (6,7,8)
      THEN COALESCE(rs.material_issue_qty_rep, 0)
      ELSE COALESCE(mts.material_issue_qty_sle, 0)
    END AS material_issue_qty,
    COALESCE(mts.transfer_in_qty, 0) AS transfer_in_qty
  FROM month_item_keys mik
  LEFT JOIN monthly_totals_sle mts
    ON mts.report_year = mik.report_year
   AND mts.report_month = mik.report_month
   AND mts.warehouse = mik.warehouse
   AND mts.item_code = mik.item_code
  LEFT JOIN rep_src rs
    ON rs.report_year = mik.report_year
   AND rs.report_month = mik.report_month
   AND rs.warehouse   = mik.warehouse
   AND rs.item_code   = mik.item_code
),
monthly_with_offset AS (
  SELECT
    mtm.warehouse, mtm.item_code,
    PERIOD_DIFF((SELECT p.m0_ym FROM params p), mtm.report_year*100 + mtm.report_month) AS m_off,
    mtm.delivery_note_qty, mtm.material_issue_qty, mtm.transfer_in_qty
  FROM monthly_totals_merged mtm
),
current_month_snapshot AS (
  SELECT
    ml.warehouse, ml.item_code,
    ml.month_end_qty AS current_month_qty,
    ml.month_end_stock_value AS current_month_stock_value
  FROM monthly_latest ml
  JOIN params p
    ON ml.report_year  = YEAR(p.m0_start)
   AND ml.report_month = MONTH(p.m0_start)
),
base_pivot AS (
  SELECT
    w.company AS company,
    COALESCE(w.custom_branch, w.custom_branch_id) AS branch_code,
    COALESCE(b.custom_nama, b.branch, b.name, w.company) AS branch_name,
    p.warehouse,
    p.item_code,
    i.item_name,

    COALESCE(cms.current_month_qty, 0)         AS current_qty,
    COALESCE(cms.current_month_stock_value, 0) AS current_stock_value,

    SUM(CASE WHEN p.m_off = 0 THEN p.delivery_note_qty ELSE 0 END) AS delivery_note_qty_m0,
    SUM(CASE WHEN p.m_off = 1 THEN p.delivery_note_qty ELSE 0 END) AS delivery_note_qty_m1,
    SUM(CASE WHEN p.m_off = 2 THEN p.delivery_note_qty ELSE 0 END) AS delivery_note_qty_m2,
    SUM(CASE WHEN p.m_off = 3 THEN p.delivery_note_qty ELSE 0 END) AS delivery_note_qty_m3,

    SUM(CASE WHEN p.m_off = 0 THEN p.material_issue_qty ELSE 0 END) AS material_issue_qty_m0,
    SUM(CASE WHEN p.m_off = 1 THEN p.material_issue_qty ELSE 0 END) AS material_issue_qty_m1,
    SUM(CASE WHEN p.m_off = 2 THEN p.material_issue_qty ELSE 0 END) AS material_issue_qty_m2,
    SUM(CASE WHEN p.m_off = 3 THEN p.material_issue_qty ELSE 0 END) AS material_issue_qty_m3,

    SUM(CASE WHEN p.m_off = 0 THEN p.transfer_in_qty ELSE 0 END) AS transfer_in_qty_m0,
    SUM(CASE WHEN p.m_off = 1 THEN p.transfer_in_qty ELSE 0 END) AS transfer_in_qty_m1,
    SUM(CASE WHEN p.m_off = 2 THEN p.transfer_in_qty ELSE 0 END) AS transfer_in_qty_m2,
    SUM(CASE WHEN p.m_off = 3 THEN p.transfer_in_qty ELSE 0 END) AS transfer_in_qty_m3
  FROM monthly_with_offset p
  JOIN \`tabWarehouse\` w
    ON w.name = p.warehouse
  LEFT JOIN \`tabBranch\` b
    ON (b.name = w.custom_branch OR b.custom_id_branch = w.custom_branch_id)
  LEFT JOIN \`tabItem\` i
    ON i.name = p.item_code
  LEFT JOIN current_month_snapshot cms
    ON cms.warehouse = p.warehouse
   AND cms.item_code = p.item_code
  WHERE p.m_off BETWEEN 0 AND 3
  GROUP BY
    w.company, branch_code, branch_name, p.warehouse, p.item_code, i.item_name,
    cms.current_month_qty, cms.current_month_stock_value
)
SELECT
  bp.company,
  bp.branch_code,
  bp.branch_name,
  bp.warehouse,
  bp.item_code,
  bp.item_name,
  bp.current_qty,
  bp.current_stock_value,
  bp.delivery_note_qty_m0,
  bp.delivery_note_qty_m1,
  bp.delivery_note_qty_m2,
  bp.delivery_note_qty_m3,
  bp.material_issue_qty_m0,
  bp.material_issue_qty_m1,
  bp.material_issue_qty_m2,
  bp.material_issue_qty_m3,
  COALESCE(bp.current_qty,0) AS adjusted_current_qty,
  (
    (COALESCE(bp.delivery_note_qty_m1,0) + COALESCE(bp.material_issue_qty_m1,0)
    + COALESCE(bp.delivery_note_qty_m2,0) + COALESCE(bp.material_issue_qty_m2,0)
    + COALESCE(bp.delivery_note_qty_m3,0) + COALESCE(bp.material_issue_qty_m3,0)) / 3.0
  ) AS avg_flow_m1_to_m3,
  CASE
    WHEN (
      (COALESCE(bp.delivery_note_qty_m1,0) + COALESCE(bp.material_issue_qty_m1,0)
     + COALESCE(bp.delivery_note_qty_m2,0) + COALESCE(bp.material_issue_qty_m2,0)
     + COALESCE(bp.delivery_note_qty_m3,0) + COALESCE(bp.material_issue_qty_m3,0)) / 3.0
    ) > 0
    THEN (
      COALESCE(bp.current_qty,0)
      /
      ((COALESCE(bp.delivery_note_qty_m1,0) + COALESCE(bp.material_issue_qty_m1,0)
       + COALESCE(bp.delivery_note_qty_m2,0) + COALESCE(bp.material_issue_qty_m2,0)
       + COALESCE(bp.delivery_note_qty_m3,0) + COALESCE(bp.material_issue_qty_m3,0)) / 3.0)
    )
    ELSE NULL
  END AS doi_adjusted
FROM base_pivot bp
ORDER BY bp.branch_name, bp.warehouse, bp.item_code
`

interface RawRow {
  company: string
  branch_code: string
  branch_name: string
  warehouse: string
  item_code: string
  item_name: string
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

export async function GET(request: Request) {
  try {
    console.log('🔍 [RAW DATA DEBUG] Fetching raw unpivoted data...')
    
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '50')

    const whereClauses: string[] = []
    if (search) {
      whereClauses.push(`(
        bp.item_code LIKE '%${search}%' OR 
        bp.item_name LIKE '%${search}%' OR 
        bp.warehouse LIKE '%${search}%' OR
        bp.branch_name LIKE '%${search}%'
      )`)
    }

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : ''

    const query = `
${REPLENISHMENT_QUERY.substring(0, REPLENISHMENT_QUERY.lastIndexOf('ORDER BY'))}
${whereClause}
ORDER BY bp.branch_name, bp.warehouse, bp.item_code
LIMIT ${limit}
`

    const startTime = Date.now()
    const rawRows = await executeQuery<RawRow>(query)
    const queryTime = Date.now() - startTime

    console.log(`✅ [RAW DATA DEBUG] Query executed in ${queryTime}ms, returned ${rawRows.length} raw rows`)

    return NextResponse.json({
      success: true,
      data: rawRows,
      count: rawRows.length,
      queryTime: `${queryTime}ms`,
      timestamp: new Date().toISOString()
    }, {
      headers: {
        'Cache-Control': 'no-store',
        'Content-Type': 'application/json',
      }
    })

  } catch (error) {
    console.error('❌ [RAW DATA DEBUG] Error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { 
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      }
    })
  }
}
