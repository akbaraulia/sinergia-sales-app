import { NextRequest, NextResponse } from 'next/server'
import { ERP_CONFIG } from '@/lib/constants/erp'

export async function GET(request: NextRequest) {
  try {
    console.log('📦 [API] Fetching sellable items from ERP:', ERP_CONFIG.BASE_URL)
    
    const response = await fetch(`${ERP_CONFIG.BASE_URL}/api/method/get_sellable_item`, {
      method: 'GET',
      headers: {
        ...ERP_CONFIG.HEADERS,
        // Pass through any cookies from the original request for session
        'Cookie': request.headers.get('cookie') || ''
      }
    })

    if (!response.ok) {
      console.error('❌ [API] ERP items fetch failed:', response.status, response.statusText)
      throw new Error(`ERP API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    console.log('✅ [API] ERP items response:', {
      hasData: !!data.data,
      hasItems: !!(data.data?.items),
      isArray: Array.isArray(data.data?.items),
      count: Array.isArray(data.data?.items) ? data.data.items.length : 0
    })
    
    // Transform ERP response to our format - ERP uses data.items structure
    const items = data.data?.items && Array.isArray(data.data.items) ? data.data.items : []
    
    return NextResponse.json({
      success: true,
      items,
      count: items.length
    })

  } catch (error) {
    console.error('❌ [API] Items fetch error:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch items from ERP'
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        items: [] 
      },
      { status: 500 }
    )
  }
}
