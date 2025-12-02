import { NextRequest, NextResponse } from 'next/server'
import { Customer } from '@/types/customer'
import { ERP_CONFIG } from '@/lib/constants/erp'

/**
 * Get activation user session cookies
 * Uses dedicated credentials from .env
 * Independent from logged-in user session
 */
async function getActivationUserSession(): Promise<string> {
  const activationEmail = process.env.ACTIVATION_USER_EMAIL
  const activationPassword = process.env.ACTIVATION_USER_PASSWORD

  if (!activationEmail || !activationPassword) {
    throw new Error('Missing activation user credentials in .env')
  }

  console.log('🔐 [ACTIVATION AUTH] Logging in as dedicated activation user:', activationEmail)

  const loginUrl = `${ERP_CONFIG.BASE_URL}/api/method/login`
  
  const loginResponse = await fetch(loginUrl, {
    method: 'POST',
    headers: {
      ...ERP_CONFIG.HEADERS
    },
    body: JSON.stringify({
      usr: activationEmail,
      pwd: activationPassword
    })
  })

  if (!loginResponse.ok) {
    const errorText = await loginResponse.text().catch(() => 'No error body')
    console.error('❌ [ACTIVATION AUTH] Login failed:', loginResponse.status)
    console.error('❌ [ACTIVATION AUTH] Error:', errorText)
    throw new Error(`Failed to authenticate activation user: ${loginResponse.status}`)
  }

  // Extract session cookies
  const setCookieHeaders = loginResponse.headers.getSetCookie()
  const cookies = setCookieHeaders
    .map(cookie => cookie.split(';')[0])
    .join('; ')

  console.log('✅ [ACTIVATION AUTH] Successfully authenticated as activation user')
  
  return cookies
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [ACTIVATION SEARCH] Searching for customers to activate...')

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const customer_id = searchParams.get('customer_id')
    const name = searchParams.get('name')
    const branch = searchParams.get('branch')
    const rayon = searchParams.get('rayon')

    console.log('📋 [ACTIVATION SEARCH] Search params:', { customer_id, name, branch, rayon })

    // Build ERP API URL - using the same endpoint as customer list
    let erpUrl = `${ERP_CONFIG.BASE_URL}/api/method/get_customer_detail_for_sales`
    
    // Add query parameters
    const params = new URLSearchParams()
    if (branch) params.append('branch', branch)
    if (rayon) params.append('rayon', rayon)
    if (name) params.append('name', name)
    if (customer_id) params.append('customer_id', customer_id)
    // Get more results for search (no pagination limit for activation search)
    params.append('limit', '1000')
    
    if (params.toString()) {
      erpUrl += `?${params.toString()}`
    }
    
    console.log('🔗 [ACTIVATION SEARCH] ERP URL:', erpUrl)

    // Get activation user session (INDEPENDENT from logged-in user)
    const cookies = await getActivationUserSession()
    
    const response = await fetch(erpUrl, {
      method: 'GET',
      headers: {
        'Cookie': cookies,
        ...ERP_CONFIG.HEADERS
      }
    })

    console.log('📡 [ACTIVATION SEARCH] ERP Response status:', response.status)

    if (!response.ok) {
      console.error('❌ [ACTIVATION SEARCH] ERP request failed:', response.status, response.statusText)
      return NextResponse.json(
        { 
          success: false, 
          error: `ERP API error: ${response.status} ${response.statusText}` 
        },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('📦 [ACTIVATION SEARCH] ERP Response data keys:', Object.keys(data))

    // Check if response has the expected structure
    if (data && Array.isArray(data.data)) {
      const customers = data.data
      
      console.log(`✅ [ACTIVATION SEARCH] Found ${customers.length} customers`)
      console.log('📊 [ACTIVATION SEARCH] Sample activation statuses:', 
        customers.slice(0, 3).map((c: Customer) => ({
          name: c.customer_name,
          status: c.activation_status,
          has_account: !!c.linked_user_account
        }))
      )
      
      return NextResponse.json({
        success: true,
        customers,
        count: customers.length,
        message: `Found ${customers.length} customers`
      })
    } else {
      console.warn('⚠️ [ACTIVATION SEARCH] Unexpected data structure:', data)
      return NextResponse.json({
        success: true,
        customers: [],
        count: 0,
        message: 'No customers found'
      })
    }

  } catch (error) {
    console.error('❌ [ACTIVATION SEARCH] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to search customers'
      },
      { status: 500 }
    )
  }
}
