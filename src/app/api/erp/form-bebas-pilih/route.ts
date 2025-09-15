import { NextRequest, NextResponse } from 'next/server'
import { ERP_CONFIG, BRIDGING_CONFIG } from '@/lib/constants/erp'

interface BebasPilihItem {
  item_code: string
  item_name: string
  stock_uom: string
  qty: number
  price_list_rate: number
  total_price: number
}

interface BebasPilihFreeItem {
  item_code: string
  item_name: string
  stock_uom: string
  qty: number
  price_list_rate: number
  total_price: number
}

interface FormBebasPilihData {
  // Header fields
  naming_series: string
  kode: string // Link to Voucher Bebas Pilih
  brand: string
  customer_code: string // Link to Customer
  branch: string // Link to Branch
  price_list: string // Link to Price List
  sales_person_name: string // Link to Sales Person
  expired: string // Date
  nilai: number
  total_harga: number
  status: string
  
  // Child table: Bebas Pilih Item
  items: BebasPilihItem[]
  
  // Child table: Bebas Pilih Item Gratis (Free Items)
  free_items: BebasPilihFreeItem[]
  
  // System fields
  disabled: boolean
  api_sent: boolean
}

// Bridging callback function
async function triggerBridgingCallback(documentName: string) {
  try {
    console.log('🌉 [BRIDGING] Triggering bridging callback for document:', documentName)
    
    const bridgingUrl = `${BRIDGING_CONFIG.BASE_URL}${BRIDGING_CONFIG.ENDPOINTS.BEBAS_PILIH_QUEUE}/${documentName}`
    console.log('🔗 [BRIDGING] Bridging URL:', bridgingUrl)

    const response = await fetch(bridgingUrl, {
      method: 'POST',
      headers: {
        ...BRIDGING_CONFIG.HEADERS
      },
      // Add timeout for bridging requests
      signal: AbortSignal.timeout(10000) // 10 second timeout
    })

    console.log('📡 [BRIDGING] Bridging response status:', response.status)
    console.log('📡 [BRIDGING] Bridging response headers:', Object.fromEntries(response.headers.entries()))

    if (response.ok) {
      const data = await response.json()
      console.log('✅ [BRIDGING] Bridging callback successful:', JSON.stringify(data, null, 2))
      return { success: true, data }
    } else {
      const errorText = await response.text()
      console.warn('⚠️ [BRIDGING] Bridging callback failed:', response.status, response.statusText)
      console.warn('⚠️ [BRIDGING] Error response:', errorText)
      
      // Try to parse error response if it's JSON
      let errorData = null
      try {
        errorData = JSON.parse(errorText)
        console.warn('⚠️ [BRIDGING] Parsed error data:', errorData)
      } catch (e) {
        console.warn('⚠️ [BRIDGING] Could not parse error response as JSON')
      }
      
      return { 
        success: false, 
        error: `HTTP ${response.status}: ${response.statusText}`, 
        details: errorData || errorText 
      }
    }
  } catch (error) {
    console.error('❌ [BRIDGING] Bridging callback error:', error)
    console.error('❌ [BRIDGING] Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    })
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Bridging request failed',
      type: error instanceof Error ? error.constructor.name : 'Unknown error'
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🎯 [FORM_BEBAS_PILIH] Starting form submission process...')

    const requestBody = await request.json()
    console.log('📦 [FORM_BEBAS_PILIH] Request body received:', JSON.stringify(requestBody, null, 2))

    // Validate required fields
    const {
      promoCode,
      cartItems,
      total,
      voucherValue,
      voucherType, // NEW: Voucher type selected by user
      branch,
      salesPerson,
      customerUser,
      priceList,
      promo,
      freeItems = []
    } = requestBody

    console.log('🔍 [FORM_BEBAS_PILIH] Validating required fields...')
    const missingFields = []

    if (!promoCode) missingFields.push('promoCode')
    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) missingFields.push('cartItems')
    if (!total && total !== 0) missingFields.push('total')
    if (!voucherValue && voucherValue !== 0) missingFields.push('voucherValue')
    if (!voucherType) missingFields.push('voucherType') // NEW: Validate voucher type
    if (!branch) missingFields.push('branch')
    if (!salesPerson) missingFields.push('salesPerson')
    if (!customerUser) missingFields.push('customerUser')
    if (!priceList) missingFields.push('priceList')

    if (missingFields.length > 0) {
      console.error('❌ [FORM_BEBAS_PILIH] Missing required fields:', missingFields)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields',
          missingFields 
        },
        { status: 400 }
      )
    }

    console.log('✅ [FORM_BEBAS_PILIH] All required fields present')

    // Prepare items data - convert cart items to ERP format
    console.log('📋 [FORM_BEBAS_PILIH] Preparing items data...')
    const items: BebasPilihItem[] = cartItems.map((cartItem: any) => {
      const item = {
        item_code: cartItem.item.item_code,
        item_name: cartItem.item.item_name,
        stock_uom: cartItem.item.stock_uom || 'Unit',
        qty: cartItem.quantity,
        price_list_rate: cartItem.item.price,
        total_price: cartItem.subtotal
      }
      console.log(`  📦 [FORM_BEBAS_PILIH] Cart item: ${item.item_code} x${item.qty} = ${item.total_price}`)
      return item
    })

    // Prepare free items data
    console.log('🆓 [FORM_BEBAS_PILIH] Preparing free items data...')
    const free_items: BebasPilihFreeItem[] = freeItems.map((freeItem: any) => {
      const item = {
        item_code: freeItem.item_code,
        item_name: freeItem.item_name,
        stock_uom: freeItem.stock_uom || 'Unit',
        qty: freeItem.qty,
        price_list_rate: freeItem.price_list_rate || 0,
        total_price: freeItem.total_price || 0
      }
      console.log(`  🎁 [FORM_BEBAS_PILIH] Free item: ${item.item_code} x${item.qty} = ${item.total_price}`)
      return item
    })

    // Generate current date for expired field
    const currentDate = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
    
    // Prepare Form Bebas Pilih data for ERP
    const formData: FormBebasPilihData = {
      // Use selected voucher type instead of auto-detecting
      naming_series: voucherType, // Direct use of user-selected voucher type (BBP-TKO-.YYYY.- or BBP-SLN-.YYYY.-)
      
      kode: promoCode, // Link to Voucher Bebas Pilih
      brand: promo?.brand || '', // Brand/Subbrand from promo
      customer_code: customerUser, // Link to Customer
      branch: branch, // Link to Branch
      price_list: priceList, // Link to Price List
      sales_person_name: salesPerson, // Link to Sales Person
      expired: promo?.expired || currentDate, // Use promo expiry or current date
      nilai: voucherValue, // Voucher value
      total_harga: total, // Total price of selected items
      status: 'Approved', // AUTO-APPROVE: Set to Approved instead of Draft
      
      items: items, // Selected items
      free_items: free_items, // Free items from promo
      
      disabled: false,
      api_sent: true // Mark as sent via API
    }

    console.log('📄 [FORM_BEBAS_PILIH] Form data prepared:', JSON.stringify(formData, null, 2))
    console.log('🎟️ [FORM_BEBAS_PILIH] Using voucher type (naming_series):', voucherType)

    // Construct ERP API URL for Form Bebas Pilih doctype
    const erpUrl = `${ERP_CONFIG.BASE_URL}/api/resource/Form%20Bebas%20Pilih`
    console.log('🔗 [FORM_BEBAS_PILIH] ERP URL:', erpUrl)

    // Get cookies for authentication
    const cookies = request.headers.get('cookie') || ''
    console.log('🍪 [FORM_BEBAS_PILIH] Cookies available:', cookies ? 'Yes' : 'No')

    // Submit to ERPNext
    console.log('📤 [FORM_BEBAS_PILIH] Submitting to ERP...')
    const response = await fetch(erpUrl, {
      method: 'POST',
      headers: {
        'Cookie': cookies,
        ...ERP_CONFIG.HEADERS
      },
      body: JSON.stringify(formData)
    })

    console.log('📡 [FORM_BEBAS_PILIH] ERP Response status:', response.status)
    console.log('📡 [FORM_BEBAS_PILIH] ERP Response headers:', Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ [FORM_BEBAS_PILIH] ERP request failed:', response.status, response.statusText)
      console.error('❌ [FORM_BEBAS_PILIH] ERP error response:', errorText)
      
      // Try to parse error response
      let errorData = null
      try {
        errorData = JSON.parse(errorText)
        console.error('❌ [FORM_BEBAS_PILIH] Parsed error data:', errorData)
      } catch (e) {
        console.error('❌ [FORM_BEBAS_PILIH] Could not parse error response as JSON')
      }

      return NextResponse.json(
        { 
          success: false, 
          error: `ERP API error: ${response.status} ${response.statusText}`,
          details: errorData,
          submittedData: formData // Include for debugging
        },
        { status: response.status }
      )
    }

    const erpData = await response.json()
    console.log('📦 [FORM_BEBAS_PILIH] ERP Response data:', JSON.stringify(erpData, null, 2))

    // Check if submission was successful
    if (erpData && erpData.data) {
      console.log('✅ [FORM_BEBAS_PILIH] Form successfully created in ERP!')
      console.log('🆔 [FORM_BEBAS_PILIH] New document name:', erpData.data.name)
      console.log('📊 [FORM_BEBAS_PILIH] Document status:', erpData.data.status)
      console.log('💰 [FORM_BEBAS_PILIH] Total value:', erpData.data.total_harga)
      console.log('📦 [FORM_BEBAS_PILIH] Items count:', erpData.data.items?.length || 0)
      console.log('🎁 [FORM_BEBAS_PILIH] Free items count:', erpData.data.free_items?.length || 0)

      // Trigger bridging callback for mobile apps integration
      const documentName = erpData.data.name
      console.log('🌉 [FORM_BEBAS_PILIH] Triggering bridging callback for:', documentName)
      
      // Don't await bridging callback - run it async to prevent blocking
      const bridgingPromise = triggerBridgingCallback(documentName)
      const bridgingResult = await bridgingPromise
      
      if (bridgingResult.success) {
        console.log('✅ [FORM_BEBAS_PILIH] Bridging callback completed successfully')
        console.log('📱 [FORM_BEBAS_PILIH] Mobile apps queue updated for document:', documentName)
      } else {
        console.warn('⚠️ [FORM_BEBAS_PILIH] Bridging callback failed but form creation was successful')
        console.warn('⚠️ [FORM_BEBAS_PILIH] Bridging error:', bridgingResult.error)
        console.warn('⚠️ [FORM_BEBAS_PILIH] Bridging details:', bridgingResult.details)
        
        // Log comprehensive bridging failure info for debugging
        console.error('🔧 [FORM_BEBAS_PILIH] BRIDGING DEBUG INFO:', {
          documentName,
          bridgingUrl: `${BRIDGING_CONFIG.BASE_URL}${BRIDGING_CONFIG.ENDPOINTS.BEBAS_PILIH_QUEUE}/${documentName}`,
          errorType: bridgingResult.type,
          errorMessage: bridgingResult.error,
          errorDetails: bridgingResult.details
        })
        
        // Don't fail the entire request if bridging fails - form was created successfully
      }

      return NextResponse.json({
        success: true,
        message: 'Form Bebas Pilih created and approved successfully',
        data: {
          name: erpData.data.name,
          status: erpData.data.status,
          total_harga: erpData.data.total_harga,
          nilai: erpData.data.nilai,
          customer_code: erpData.data.customer_code,
          branch: erpData.data.branch,
          items_count: erpData.data.items?.length || 0,
          free_items_count: erpData.data.free_items?.length || 0
        },
        bridging: bridgingResult, // Include bridging callback result
        submittedData: formData // Include for reference
      })
    } else {
      console.warn('⚠️ [FORM_BEBAS_PILIH] Unexpected response structure:', erpData)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Unexpected response from ERP',
          details: erpData,
          submittedData: formData // Include for debugging
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('❌ [FORM_BEBAS_PILIH] API Error:', error)
    console.error('❌ [FORM_BEBAS_PILIH] Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to submit Form Bebas Pilih',
        type: error instanceof Error ? error.constructor.name : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET method to retrieve existing forms (optional)
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [FORM_BEBAS_PILIH] Fetching Form Bebas Pilih records...')

    const { searchParams } = new URL(request.url)
    const customer = searchParams.get('customer')
    const branch = searchParams.get('branch')
    const status = searchParams.get('status')
    const limit = searchParams.get('limit') || '20'

    // Build filters
    const filters: string[] = []
    if (customer) filters.push(`customer_code="${customer}"`)
    if (branch) filters.push(`branch="${branch}"`)
    if (status) filters.push(`status="${status}"`)

    const filterString = filters.length > 0 ? `&filters=[${filters.map(f => `["${f}"]`).join(',')}]` : ''
    
    // Construct ERP API URL
    const erpUrl = `${ERP_CONFIG.BASE_URL}/api/resource/Form%20Bebas%20Pilih?limit_page_length=${limit}${filterString}`
    console.log('🔗 [FORM_BEBAS_PILIH] ERP URL:', erpUrl)

    // Get cookies for authentication
    const cookies = request.headers.get('cookie') || ''

    const response = await fetch(erpUrl, {
      method: 'GET',
      headers: {
        'Cookie': cookies,
        ...ERP_CONFIG.HEADERS
      }
    })

    console.log('📡 [FORM_BEBAS_PILIH] ERP Response status:', response.status)

    if (!response.ok) {
      console.error('❌ [FORM_BEBAS_PILIH] ERP request failed:', response.status, response.statusText)
      return NextResponse.json(
        { 
          success: false, 
          error: `ERP API error: ${response.status} ${response.statusText}` 
        },
        { status: response.status }
      )
    }

    const erpData = await response.json()
    console.log('📦 [FORM_BEBAS_PILIH] Retrieved forms count:', erpData.data?.length || 0)

    return NextResponse.json({
      success: true,
      data: erpData.data || [],
      count: erpData.data?.length || 0
    })

  } catch (error) {
    console.error('❌ [FORM_BEBAS_PILIH] GET Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch Form Bebas Pilih records'
      },
      { status: 500 }
    )
  }
}
