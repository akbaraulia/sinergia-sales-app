import { NextRequest, NextResponse } from 'next/server'
import { ERP_CONFIG } from '@/lib/constants/erp'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const so_id = searchParams.get('so_id')
    
    // Build endpoint URL
    const endpoint = '/api/method/get_sales_orders_by_sales_person'
    const url = so_id 
      ? `${ERP_CONFIG.BASE_URL}${endpoint}?so_id=${encodeURIComponent(so_id)}` 
      : `${ERP_CONFIG.BASE_URL}${endpoint}`
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        ...ERP_CONFIG.HEADERS,
        'Cookie': request.headers.get('cookie') || ''
      },
      credentials: 'include'
    })
    
    if (!response.ok) {
      throw new Error(`ERP API Error: ${response.status} ${response.statusText}`)
    }
    
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Failed to fetch sales orders:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch sales orders',
        message: error.message 
      },
      { status: error.response?.status || 500 }
    )
  }
}
