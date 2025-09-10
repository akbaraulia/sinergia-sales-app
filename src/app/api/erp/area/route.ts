import { NextRequest, NextResponse } from 'next/server'
import { ERP_CONFIG } from '@/lib/constants/erp'

export async function GET(request: NextRequest) {
  try {
    console.log('🎯 [AREA API] Starting area filter options fetch from ERP...')

    // Construct the ERP API URL
    const erpUrl = `${ERP_CONFIG.BASE_URL}/api/method/get_filter_area_options`
    
    console.log('🔗 [AREA API] ERP URL:', erpUrl)

    // Get cookies for authentication
    const cookies = request.headers.get('cookie') || ''
    
    const response = await fetch(erpUrl, {
      method: 'GET',
      headers: {
        'Cookie': cookies,
        ...ERP_CONFIG.HEADERS
      }
    })

    console.log('📡 [AREA API] ERP Response status:', response.status)

    if (!response.ok) {
      console.error('❌ [AREA API] ERP request failed:', response.status, response.statusText)
      return NextResponse.json(
        { 
          success: false, 
          error: `ERP API error: ${response.status} ${response.statusText}` 
        },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('📦 [AREA API] ERP Response data keys:', Object.keys(data))

    // Check if response has the expected structure
    if (data && data.data) {
      const { branches = [], rayons = [] } = data.data
      
      console.log(`✅ [AREA API] Successfully fetched ${branches.length} branches and ${rayons.length} rayons`)
      
      return NextResponse.json({
        success: true,
        branches,
        rayons,
        count: {
          branches: branches.length,
          rayons: rayons.length
        }
      })
    } else {
      console.warn('⚠️ [AREA API] Unexpected data structure:', data)
      return NextResponse.json({
        success: true,
        branches: [],
        rayons: [],
        count: {
          branches: 0,
          rayons: 0
        },
        message: 'No area data available'
      })
    }

  } catch (error) {
    console.error('❌ [AREA API] Error fetching area options:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch area data' 
      },
      { status: 500 }
    )
  }
}
