import { NextResponse } from 'next/server'
import { ERP_CONFIG } from '@/lib/constants/erp'
import type { ReplenishmentReportRow, ReplenishmentReportResponse, WarehouseData } from '@/types/replenishment'

export async function GET(request: Request) {
  try {
    console.log('📊 [REPLENISHMENT] Fetching replenishment report data from server script...')
    
    const { searchParams } = new URL(request.url)
    const branch = searchParams.get('branch')
    const warehouse = searchParams.get('warehouse')
    const itemCode = searchParams.get('item_code')
    const company = searchParams.get('company')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = (page - 1) * limit

    console.log('🔍 [REPLENISHMENT] Filters:', { branch, warehouse, itemCode, company, search, page, limit })

    // Fetch from ERPNext server script endpoint
    const startTime = Date.now()
    const erpUrl = `${ERP_CONFIG.BASE_URL}/api/method/get_replenishment_data`
    
    console.log('🌐 [REPLENISHMENT] Calling:', erpUrl)
    
    const response = await fetch(erpUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`ERPNext API returned ${response.status}: ${response.statusText}`)
    }

    const erpResult = await response.json()
    const queryTime = Date.now() - startTime

    console.log(`✅ [REPLENISHMENT] ERP response in ${queryTime}ms`)

    // The server script returns data in the same structure as before
    // Extract the raw warehouse-level data
    interface RawRow {
      company: string
      branch_code: string
      branch_name: string
      warehouse: string
      warehouse_name?: string
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

    let rawRows: RawRow[] = []
    
    // Handle different possible response structures
    if (erpResult.message && Array.isArray(erpResult.message)) {
      rawRows = erpResult.message
    } else if (erpResult.data && Array.isArray(erpResult.data)) {
      rawRows = erpResult.data
    } else if (Array.isArray(erpResult)) {
      rawRows = erpResult
    } else {
      throw new Error('Unexpected response structure from ERPNext server script')
    }

    console.log(`📦 [REPLENISHMENT] Received ${rawRows.length} raw warehouse rows from ERP`)

    // Apply filters if provided
    let filteredRows = rawRows
    
    if (branch) {
      filteredRows = filteredRows.filter(row => 
        row.branch_code === branch || row.branch_name.includes(branch)
      )
    }
    
    if (warehouse) {
      filteredRows = filteredRows.filter(row => row.warehouse === warehouse)
    }
    
    if (itemCode) {
      filteredRows = filteredRows.filter(row => row.item_code === itemCode)
    }
    
    if (company) {
      filteredRows = filteredRows.filter(row => row.company === company)
    }
    
    if (search) {
      const searchLower = search.toLowerCase()
      filteredRows = filteredRows.filter(row =>
        row.branch_name?.toLowerCase().includes(searchLower) ||
        row.warehouse?.toLowerCase().includes(searchLower) ||
        row.item_code?.toLowerCase().includes(searchLower) ||
        row.item_name?.toLowerCase().includes(searchLower) ||
        row.company?.toLowerCase().includes(searchLower)
      )
    }

    console.log(`🔍 [REPLENISHMENT] After filters: ${filteredRows.length} rows`)

    // Pivot the data: Group by item_code, aggregate warehouses horizontally
    const pivotMap = new Map<string, ReplenishmentReportRow>()
    
    // First pass: collect all unique warehouses to ensure consistency
    const allWarehouses = new Map<string, { warehouse: string, branch_name: string, branch_code: string }>()
    filteredRows.forEach(raw => {
      const whKey = raw.warehouse
      if (!allWarehouses.has(whKey)) {
        allWarehouses.set(whKey, {
          warehouse: raw.warehouse,
          branch_name: raw.branch_name,
          branch_code: raw.branch_code
        })
      }
    })
    
    // Sort warehouses for consistent ordering
    const sortedWarehouses = Array.from(allWarehouses.values()).sort((a, b) => {
      const branchCompare = a.branch_name.localeCompare(b.branch_name)
      return branchCompare !== 0 ? branchCompare : a.warehouse.localeCompare(b.warehouse)
    })
    
    console.log(`🏢 [REPLENISHMENT] Found ${sortedWarehouses.length} unique warehouses`)
    
    // Second pass: build pivot structure
    filteredRows.forEach(raw => {
      const key = `${raw.company}|${raw.item_code}`
      
      if (!pivotMap.has(key)) {
        // Initialize with all warehouses (with zeros)
        const warehouseData: WarehouseData[] = sortedWarehouses.map(wh => ({
          warehouse: wh.warehouse,
          warehouse_name: wh.warehouse,
          branch_code: wh.branch_code,
          branch_name: wh.branch_name,
          current_qty: 0,
          current_stock_value: 0,
          delivery_note_qty_m0: 0,
          delivery_note_qty_m1: 0,
          delivery_note_qty_m2: 0,
          delivery_note_qty_m3: 0,
          material_issue_qty_m0: 0,
          material_issue_qty_m1: 0,
          material_issue_qty_m2: 0,
          material_issue_qty_m3: 0,
          adjusted_current_qty: 0,
          avg_flow_m1_to_m3: 0,
          doi_adjusted: null
        }))
        
        pivotMap.set(key, {
          company: raw.company,
          item_code: raw.item_code,
          item_name: raw.item_name,
          warehouses: warehouseData,
          total_current_qty: 0,
          total_stock_value: 0,
          total_avg_flow: 0,
          overall_doi: null
        })
      }
      
      const pivotRow = pivotMap.get(key)!
      
      // Find the warehouse index and update its data
      const whIndex = pivotRow.warehouses.findIndex(w => w.warehouse === raw.warehouse)
      if (whIndex !== -1) {
        pivotRow.warehouses[whIndex] = {
          warehouse: raw.warehouse,
          warehouse_name: raw.warehouse_name || raw.warehouse,
          branch_code: raw.branch_code,
          branch_name: raw.branch_name,
          current_qty: raw.current_qty || 0,
          current_stock_value: raw.current_stock_value || 0,
          delivery_note_qty_m0: raw.delivery_note_qty_m0 || 0,
          delivery_note_qty_m1: raw.delivery_note_qty_m1 || 0,
          delivery_note_qty_m2: raw.delivery_note_qty_m2 || 0,
          delivery_note_qty_m3: raw.delivery_note_qty_m3 || 0,
          material_issue_qty_m0: raw.material_issue_qty_m0 || 0,
          material_issue_qty_m1: raw.material_issue_qty_m1 || 0,
          material_issue_qty_m2: raw.material_issue_qty_m2 || 0,
          material_issue_qty_m3: raw.material_issue_qty_m3 || 0,
          adjusted_current_qty: raw.adjusted_current_qty || 0,
          avg_flow_m1_to_m3: raw.avg_flow_m1_to_m3 || 0,
          doi_adjusted: raw.doi_adjusted
        }
        
        // Update totals
        pivotRow.total_current_qty += raw.current_qty || 0
        pivotRow.total_stock_value += raw.current_stock_value || 0
        pivotRow.total_avg_flow += raw.avg_flow_m1_to_m3 || 0
      }
    })
    
    // Calculate overall DOI for each item
    pivotMap.forEach(row => {
      if (row.total_avg_flow > 0) {
        row.overall_doi = row.total_current_qty / row.total_avg_flow
      }
    })
    
    // Convert map to array and apply pagination
    const allPivotedRows = Array.from(pivotMap.values())
    const total = allPivotedRows.length
    const totalPages = Math.ceil(total / limit)
    const paginatedRows = allPivotedRows.slice(offset, offset + limit)

    console.log(`📊 [REPLENISHMENT] Pivoted ${filteredRows.length} raw rows into ${total} items`)
    console.log(`📦 [REPLENISHMENT] Returning ${paginatedRows.length} rows (page ${page}/${totalPages})`)

    const responseData: ReplenishmentReportResponse = {
      success: true,
      data: paginatedRows,
      total: total,
      page: page,
      limit: limit,
      totalPages: totalPages,
      timestamp: new Date().toISOString()
    }

    return NextResponse.json(responseData, {
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
        'Content-Type': 'application/json',
      }
    })

  } catch (error) {
    console.error('❌ [REPLENISHMENT] Error fetching data:', error)
    
    const errorResponse: ReplenishmentReportResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString()
    }

    return NextResponse.json(errorResponse, { 
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      }
    })
  }
}
