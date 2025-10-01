import { NextRequest, NextResponse } from 'next/server'
import { ERP_CONFIG } from '@/lib/constants/erp'

export async function GET(request: NextRequest) {
  try {
    console.log('🎯 [STRUCTURED FILTERS API] Starting structured filter options fetch from ERP...')

    // Construct the ERP API URL
    const erpUrl = `${ERP_CONFIG.BASE_URL}/api/method/get_structured_filter_options`
    
    console.log('🔗 [STRUCTURED FILTERS API] ERP URL:', erpUrl)

    // Get cookies for authentication
    const cookies = request.headers.get('cookie') || ''
    
    const response = await fetch(erpUrl, {
      method: 'GET',
      headers: {
        'Cookie': cookies,
        ...ERP_CONFIG.HEADERS
      }
    })

    console.log('📡 [STRUCTURED FILTERS API] ERP Response status:', response.status)

    if (!response.ok) {
      console.error('❌ [STRUCTURED FILTERS API] ERP request failed:', response.status, response.statusText)
      return NextResponse.json(
        { 
          success: false, 
          error: `ERP API error: ${response.status} ${response.statusText}` 
        },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('📦 [STRUCTURED FILTERS API] ERP Response data keys:', Object.keys(data))

    // Check if response has the expected structure
    if (data && data.data && data.data.branches_with_warehouses) {
      const branches = data.data.branches_with_warehouses
      
      console.log(`✅ [STRUCTURED FILTERS API] Successfully fetched ${branches.length} branches with warehouses`)
      
      return NextResponse.json({
        success: true,
        branches_with_warehouses: branches,
        count: branches.length
      })
    } else {
      console.warn('⚠️ [STRUCTURED FILTERS API] Unexpected data structure:', data)
      return NextResponse.json({
        success: true,
        branches_with_warehouses: [],
        count: 0,
        message: 'No structured filter data available'
      })
    }

  } catch (error) {
    console.error('❌ [STRUCTURED FILTERS API] Error fetching structured filter options:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch structured filter data' 
      },
      { status: 500 }
    )
  }
}
