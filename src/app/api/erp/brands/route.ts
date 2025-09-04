import { NextRequest, NextResponse } from 'next/server'
import { ERP_CONFIG } from '@/lib/constants/erp'

export async function GET(request: NextRequest) {
  try {
    console.log('📦 [API] Fetching brands from ERP:', ERP_CONFIG.BASE_URL)
    
    const response = await fetch(`${ERP_CONFIG.BASE_URL}/api/method/get_item_brand`, {
      method: 'GET',
      headers: {
        ...ERP_CONFIG.HEADERS,
        // Pass through any cookies from the original request for session
        'Cookie': request.headers.get('cookie') || ''
      }
    })

    if (!response.ok) {
      console.error('❌ [API] ERP brands fetch failed:', response.status, response.statusText)
      throw new Error(`ERP API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    console.log('✅ [API] ERP brands response:', {
      hasData: !!data.data,
      hasBrands: !!(data.data?.brands),
      isArray: Array.isArray(data.data?.brands),
      count: Array.isArray(data.data?.brands) ? data.data.brands.length : 0
    })
    
    // Transform ERP response to our format - ERP uses data.brands structure
    const brands = data.data?.brands && Array.isArray(data.data.brands) ? data.data.brands : []
    
    return NextResponse.json({
      success: true,
      brands,
      count: brands.length
    })

  } catch (error) {
    console.error('❌ [API] Brands fetch error:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch brands from ERP'
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        brands: [] 
      },
      { status: 500 }
    )
  }
}
