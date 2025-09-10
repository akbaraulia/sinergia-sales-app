import { NextRequest, NextResponse } from 'next/server'
import { ERP_CONFIG } from '@/lib/constants/erp'

export async function GET(request: NextRequest) {
  try {
    console.log('🎯 [FORM-DATA API] Starting form data fetch from ERP...')

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const getData = searchParams.get('get_data')
    const branchId = searchParams.get('branch_id')

    if (!getData) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Parameter 'get_data' is required" 
        },
        { status: 400 }
      )
    }

    // Construct the ERP API URL with parameters
    let erpUrl = `${ERP_CONFIG.BASE_URL}/api/method/get_form_bebas_pilih_data?get_data=${encodeURIComponent(getData)}`
    
    if (branchId) {
      erpUrl += `&branch_id=${encodeURIComponent(branchId)}`
    }
    
    console.log('🔗 [FORM-DATA API] ERP URL:', erpUrl)

    // Get cookies for authentication
    const cookies = request.headers.get('cookie') || ''
    
    const response = await fetch(erpUrl, {
      method: 'GET',
      headers: {
        'Cookie': cookies,
        ...ERP_CONFIG.HEADERS
      }
    })

    console.log('📡 [FORM-DATA API] ERP Response status:', response.status)

    if (!response.ok) {
      console.error('❌ [FORM-DATA API] ERP request failed:', response.status, response.statusText)
      return NextResponse.json(
        { 
          success: false, 
          error: `ERP API error: ${response.status} ${response.statusText}` 
        },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('📦 [FORM-DATA API] ERP Response data keys:', Object.keys(data))

    // Check if response has the expected structure
    if (data && data.data) {
      console.log('✅ [FORM-DATA API] Successfully fetched form data')
      
      return NextResponse.json({
        success: true,
        data: data.data
      })
    } else {
      console.warn('⚠️ [FORM-DATA API] Unexpected data structure:', data)
      return NextResponse.json({
        success: true,
        data: {},
        message: 'No form data available'
      })
    }

  } catch (error) {
    console.error('❌ [FORM-DATA API] Error fetching form data:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch form data' 
      },
      { status: 500 }
    )
  }
}
