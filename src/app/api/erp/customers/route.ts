import { NextRequest, NextResponse } from 'next/server'
import { ERP_CONFIG } from '@/lib/constants/erp'

export async function GET(request: NextRequest) {
  try {
    console.log('🎯 [CUSTOMERS API] Starting customer detail fetch from ERP...')

    // Get query parameters with pagination
    const { searchParams } = new URL(request.url)
    const branch = searchParams.get('branch')
    const rayon = searchParams.get('rayon')
    const name = searchParams.get('name')
    const customer_id = searchParams.get('customer_id')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100) // Max 100 per page
    
    console.log('🔍 [CUSTOMERS API] Query params:', { branch, rayon, name, customer_id, page, limit })

    // Build ERP API URL
    let erpUrl = `${ERP_CONFIG.BASE_URL}/api/method/get_customer_detail_for_sales`
    
    // Add query parameters including pagination
    const params = new URLSearchParams()
    if (branch) params.append('branch', branch)
    if (rayon) params.append('rayon', rayon)
    if (name) params.append('name', name)
    if (customer_id) params.append('customer_id', customer_id)
    params.append('page', page.toString())
    params.append('limit', limit.toString())
    
    if (params.toString()) {
      erpUrl += `?${params.toString()}`
    }
    
    console.log('🔗 [CUSTOMERS API] ERP URL:', erpUrl)

    // Get cookies for authentication
    const cookies = request.headers.get('cookie') || ''
    
    const response = await fetch(erpUrl, {
      method: 'GET',
      headers: {
        'Cookie': cookies,
        ...ERP_CONFIG.HEADERS
      }
    })

    console.log('📡 [CUSTOMERS API] ERP Response status:', response.status)

    if (!response.ok) {
      console.error('❌ [CUSTOMERS API] ERP request failed:', response.status, response.statusText)
      return NextResponse.json(
        { 
          success: false, 
          error: `ERP API error: ${response.status} ${response.statusText}` 
        },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('📦 [CUSTOMERS API] ERP Response data keys:', Object.keys(data))

    // Check if response has the expected structure
    if (data && Array.isArray(data.data)) {
      const customers = data.data
      const totalCount = data.total || customers.length
      const hasMore = data.has_more || (page * limit < totalCount)
      
      console.log(`✅ [CUSTOMERS API] Successfully fetched ${customers.length} customers (page ${page})`)
      
      return NextResponse.json({
        success: true,
        customers,
        count: customers.length,
        pagination: {
          page,
          limit,
          total: totalCount,
          hasMore,
          totalPages: Math.ceil(totalCount / limit)
        },
        filters: {
          branch,
          rayon,
          name,
          customer_id
        }
      })
    } else {
      console.warn('⚠️ [CUSTOMERS API] Unexpected data structure:', data)
      return NextResponse.json({
        success: true,
        customers: [],
        count: 0,
        pagination: {
          page,
          limit,
          total: 0,
          hasMore: false,
          totalPages: 0
        },
        message: 'No customer data available'
      })
    }

  } catch (error) {
    console.error('❌ [CUSTOMERS API] Error fetching customers:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch customer data' 
      },
      { status: 500 }
    )
  }
}
