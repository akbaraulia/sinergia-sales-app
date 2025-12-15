import { NextResponse } from 'next/server'
import { ERP_CONFIG } from '@/lib/constants/erp'
import type { ReplenishmentReportRow, ReplenishmentReportResponse } from '@/types/replenishment'

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
    
    // Get cookies from the incoming request (user's session)
    const cookies = new Headers(request.headers).get('cookie') || ''
    
    console.log('🔑 [REPLENISHMENT] Using Cookie-based authentication from user session')
    
    const response = await fetch(erpUrl, {
      method: 'GET',
      headers: {
        'Cookie': cookies,
        ...ERP_CONFIG.HEADERS
      }
    })

    if (!response.ok) {
      throw new Error(`ERPNext API returned ${response.status}: ${response.statusText}`)
    }

    const erpResult = await response.json()
    const queryTime = Date.now() - startTime

    console.log(`✅ [REPLENISHMENT] ERP response in ${queryTime}ms`)
    console.log('📦 [REPLENISHMENT] Full ERP Response Structure:', JSON.stringify(erpResult, null, 2))
    console.log('🔍 [REPLENISHMENT] Response keys:', Object.keys(erpResult))
    
    if (erpResult.data) {
      console.log('📦 [REPLENISHMENT] erpResult.data keys:', Object.keys(erpResult.data))
      console.log('📦 [REPLENISHMENT] erpResult.data type:', Array.isArray(erpResult.data) ? 'Array' : typeof erpResult.data)
      
      if (erpResult.data.data) {
        console.log('📦 [REPLENISHMENT] erpResult.data.data type:', Array.isArray(erpResult.data.data) ? 'Array' : typeof erpResult.data.data)
        console.log('📦 [REPLENISHMENT] erpResult.data.data sample (first item):', JSON.stringify(erpResult.data.data[0], null, 2))
      }
    }
    
    if (erpResult.message) {
      console.log('📦 [REPLENISHMENT] erpResult.message type:', Array.isArray(erpResult.message) ? 'Array' : typeof erpResult.message)
    }

    // The server script returns data ALREADY PIVOTED (one row per item with warehouses array)
    let pivotedData: ReplenishmentReportRow[] = []
    
    // Handle different possible response structures
    if (erpResult.data?.data && Array.isArray(erpResult.data.data)) {
      console.log('✅ [REPLENISHMENT] Using erpResult.data.data path')
      pivotedData = erpResult.data.data
    } else if (erpResult.message && Array.isArray(erpResult.message)) {
      console.log('✅ [REPLENISHMENT] Using erpResult.message path')
      pivotedData = erpResult.message
    } else if (erpResult.data && Array.isArray(erpResult.data)) {
      console.log('✅ [REPLENISHMENT] Using erpResult.data path')
      pivotedData = erpResult.data
    } else if (Array.isArray(erpResult)) {
      console.log('✅ [REPLENISHMENT] Using erpResult (direct array) path')
      pivotedData = erpResult
    } else {
      console.error('❌ [REPLENISHMENT] None of the expected paths matched!')
      console.error('Expected one of:')
      console.error('  - erpResult.data.data as Array')
      console.error('  - erpResult.message as Array')
      console.error('  - erpResult.data as Array')
      console.error('  - erpResult as Array')
      console.error('Got:', JSON.stringify(erpResult, null, 2))
      throw new Error('Unexpected response structure from ERPNext server script')
    }

    console.log(`📦 [REPLENISHMENT] Received ${pivotedData.length} items from ERP (already pivoted)`)

    // Apply filters to the ALREADY PIVOTED data
    let filteredData = pivotedData
    
    if (itemCode) {
      filteredData = filteredData.filter(row => row.item_code === itemCode)
    }
    
    if (company) {
      filteredData = filteredData.filter(row => row.company === company)
    }
    
    if (branch) {
      filteredData = filteredData.filter(row =>
        row.warehouses.some(wh => wh.branch_code === branch || wh.branch_name.includes(branch))
      )
    }
    
    if (warehouse) {
      filteredData = filteredData.filter(row =>
        row.warehouses.some(wh => wh.warehouse === warehouse)
      )
    }
    
    if (search) {
      const searchLower = search.toLowerCase()
      filteredData = filteredData.filter(row =>
        row.item_code?.toLowerCase().includes(searchLower) ||
        row.item_name?.toLowerCase().includes(searchLower) ||
        row.company?.toLowerCase().includes(searchLower) ||
        row.warehouses.some(wh => 
          wh.branch_name?.toLowerCase().includes(searchLower) ||
          wh.warehouse?.toLowerCase().includes(searchLower)
        )
      )
    }

    console.log(`🔍 [REPLENISHMENT] After filters: ${filteredData.length} items`)

    // Data is already pivoted by server script - just paginate
    const total = filteredData.length
    const totalPages = Math.ceil(total / limit)
    const paginatedRows = filteredData.slice(offset, offset + limit)

    console.log(`📦 [REPLENISHMENT] Returning ${paginatedRows.length} items (page ${page}/${totalPages}, total: ${total})`)

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
