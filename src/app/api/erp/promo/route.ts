import { NextRequest, NextResponse } from 'next/server'
import { ERP_CONFIG } from '@/lib/constants/erp'

export async function GET(request: NextRequest) {
  try {
    console.log('🎯 [PROMO API] Starting promo fetch from ERP...')

    // Construct the ERP API URL
    const erpUrl = `${ERP_CONFIG.BASE_URL}/api/method/get_promo_bebas_pilih`
    
    console.log('🔗 [PROMO API] ERP URL:', erpUrl)

    // Get cookies for authentication
    const cookies = request.headers.get('cookie') || ''
    
    const response = await fetch(erpUrl, {
      method: 'GET',
      headers: {
        'Cookie': cookies,
        ...ERP_CONFIG.HEADERS
      }
    })

    console.log('📡 [PROMO API] ERP Response status:', response.status)

    if (!response.ok) {
      console.error('❌ [PROMO API] ERP request failed:', response.status, response.statusText)
      return NextResponse.json(
        { 
          success: false, 
          error: `ERP API error: ${response.status} ${response.statusText}` 
        },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('📦 [PROMO API] ERP Response data keys:', Object.keys(data))

    // Check if response has the expected structure
    if (data && Array.isArray(data.data)) {
      console.log(`✅ [PROMO API] Successfully fetched ${data.data.length} promo items`)
      
      return NextResponse.json({
        success: true,
        promos: data.data,
        count: data.data.length
      })
    } else {
      console.warn('⚠️ [PROMO API] Unexpected data structure:', data)
      return NextResponse.json({
        success: true,
        promos: [],
        count: 0,
        message: 'No promo data available'
      })
    }

  } catch (error) {
    console.error('❌ [PROMO API] Error fetching promos:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch promo data' 
      },
      { status: 500 }
    )
  }
}
