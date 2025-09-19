import { NextRequest, NextResponse } from 'next/server'
import { ERP_CONFIG } from '@/lib/constants/erp'

export async function GET(request: NextRequest, { params }: { params: Promise<{ customerName: string }> }) {
  try {
    console.log('🎯 [CUSTOMER DETAIL API] Starting customer detail fetch from ERP...')

    const { customerName } = await params
    const decodedCustomerName = decodeURIComponent(customerName)
    
    console.log('📝 [CUSTOMER DETAIL API] Customer name:', decodedCustomerName)

    // Build ERP API URL with customer name filter
    const erpUrl = `${ERP_CONFIG.BASE_URL}/api/method/get_customer_detail_for_sales?customer_name=${encodeURIComponent(decodedCustomerName)}`
    
    console.log('🔗 [CUSTOMER DETAIL API] ERP URL:', erpUrl)

    // Get cookies for authentication
    const cookies = request.headers.get('cookie') || ''
    
    const response = await fetch(erpUrl, {
      method: 'GET',
      headers: {
        'Cookie': cookies,
        ...ERP_CONFIG.HEADERS
      }
    })

    console.log('📡 [CUSTOMER DETAIL API] ERP Response status:', response.status)

    if (!response.ok) {
      console.error('❌ [CUSTOMER DETAIL API] ERP request failed:', response.status, response.statusText)
      return NextResponse.json(
        { 
          success: false, 
          error: `ERP API error: ${response.status} ${response.statusText}` 
        },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('📦 [CUSTOMER DETAIL API] ERP Response data keys:', Object.keys(data))

    // Check if response has the expected structure and find the customer
    if (data && Array.isArray(data.data)) {
      const customer = data.data.find((c: { name: string; customer_name: string }) => 
        c.name === decodedCustomerName || c.customer_name === decodedCustomerName
      )
      
      if (customer) {
        console.log(`✅ [CUSTOMER DETAIL API] Successfully fetched customer: ${customer.customer_name}`)
        
        return NextResponse.json({
          success: true,
          customer
        })
      } else {
        console.warn('⚠️ [CUSTOMER DETAIL API] Customer not found:', decodedCustomerName)
        return NextResponse.json({
          success: false,
          error: 'Customer not found'
        }, { status: 404 })
      }
    } else {
      console.warn('⚠️ [CUSTOMER DETAIL API] Unexpected data structure:', data)
      return NextResponse.json({
        success: false,
        error: 'Invalid response structure'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('❌ [CUSTOMER DETAIL API] Error fetching customer detail:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch customer detail' 
      },
      { status: 500 }
    )
  }
}
