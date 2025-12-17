import { NextRequest, NextResponse } from 'next/server'
import { ERP_CONFIG } from '@/lib/constants/erp'

/**
 * API Route to fetch Form Bebas Pilih list
 * Uses ERP server script: get_form_bebas_pilih
 * 
 * Query params:
 * - created_by: User email who created the form (required)
 * - created_at: Date filter YYYY-MM-DD or YYYY-MM-DD HH:mm (optional, defaults to today)
 */

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [FORM_BEBAS_PILIH_LIST] Fetching Form Bebas Pilih list...')

    const { searchParams } = new URL(request.url)
    const createdBy = searchParams.get('created_by')
    const createdAt = searchParams.get('created_at')

    // Validate required params
    if (!createdBy) {
      console.error('❌ [FORM_BEBAS_PILIH_LIST] Missing created_by parameter')
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required parameter: created_by' 
        },
        { status: 400 }
      )
    }

    // Default to today's date if not provided
    const dateFilter = createdAt || new Date().toISOString().split('T')[0]

    console.log('📋 [FORM_BEBAS_PILIH_LIST] Query params:', {
      created_by: createdBy,
      created_at: dateFilter
    })

    // Build ERP API URL using server script endpoint
    const erpUrl = `${ERP_CONFIG.BASE_URL}/api/method/get_form_bebas_pilih?created_by=${encodeURIComponent(createdBy)}&created_at=${encodeURIComponent(dateFilter)}`
    console.log('🔗 [FORM_BEBAS_PILIH_LIST] ERP URL:', erpUrl)

    // Get cookies for authentication
    const cookies = request.headers.get('cookie') || ''
    console.log('🍪 [FORM_BEBAS_PILIH_LIST] Cookies available:', cookies ? 'Yes' : 'No')

    // Call ERP server script
    const response = await fetch(erpUrl, {
      method: 'GET',
      headers: {
        'Cookie': cookies,
        ...ERP_CONFIG.HEADERS
      }
    })

    console.log('📡 [FORM_BEBAS_PILIH_LIST] ERP Response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ [FORM_BEBAS_PILIH_LIST] ERP request failed:', response.status, response.statusText)
      console.error('❌ [FORM_BEBAS_PILIH_LIST] Error response:', errorText)
      
      return NextResponse.json(
        { 
          success: false, 
          error: `ERP API error: ${response.status} ${response.statusText}`,
          details: errorText
        },
        { status: response.status }
      )
    }

    const erpData = await response.json()
    console.log('📦 [FORM_BEBAS_PILIH_LIST] ERP Response received:', JSON.stringify(erpData, null, 2))
    
    // ERP server script returns: { data: { mode, count, filters_used, data: [...] } }
    // Or sometimes: { message: { data: [...] } }
    let formList: any[] = []
    
    if (erpData.data?.data && Array.isArray(erpData.data.data)) {
      // Standard response: data.data.data
      formList = erpData.data.data
      console.log('📊 [FORM_BEBAS_PILIH_LIST] Using erpData.data.data')
    } else if (erpData.message?.data && Array.isArray(erpData.message.data)) {
      // Alternative response: message.data
      formList = erpData.message.data
      console.log('📊 [FORM_BEBAS_PILIH_LIST] Using erpData.message.data')
    } else if (Array.isArray(erpData.data)) {
      // Direct array in data
      formList = erpData.data
      console.log('📊 [FORM_BEBAS_PILIH_LIST] Using erpData.data directly')
    } else if (Array.isArray(erpData.message)) {
      // Direct array in message
      formList = erpData.message
      console.log('📊 [FORM_BEBAS_PILIH_LIST] Using erpData.message directly')
    }
    
    console.log('📊 [FORM_BEBAS_PILIH_LIST] Forms count:', formList.length)

    return NextResponse.json({
      success: true,
      data: formList,
      count: formList.length,
      filters: {
        created_by: createdBy,
        created_at: dateFilter
      },
      // Include raw response for debugging
      _debug: {
        rawStructure: {
          hasData: !!erpData.data,
          hasDataData: !!erpData.data?.data,
          hasMessage: !!erpData.message,
          hasMessageData: !!erpData.message?.data
        }
      }
    })

  } catch (error) {
    console.error('❌ [FORM_BEBAS_PILIH_LIST] API Error:', error)
    console.error('❌ [FORM_BEBAS_PILIH_LIST] Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch Form Bebas Pilih list',
        type: error instanceof Error ? error.constructor.name : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
