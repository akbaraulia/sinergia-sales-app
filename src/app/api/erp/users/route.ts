import { NextRequest, NextResponse } from 'next/server'
import { ERP_CONFIG } from '@/lib/constants/erp'

export async function GET(request: NextRequest) {
  try {
    console.log('🎯 [USERS] Fetching users from ERP')

    // Construct the ERP API URL - using direct resource API
    const erpUrl = `${ERP_CONFIG.BASE_URL}/api/resource/User`
    
    console.log('🔗 [USERS] ERP URL:', erpUrl)

    // Get cookies for authentication
    const cookies = request.headers.get('cookie') || ''

    // Fetch from ERPNext
    const response = await fetch(erpUrl, {
      method: 'GET',
      headers: {
        'Cookie': cookies,
        ...ERP_CONFIG.HEADERS
      }
    })

    console.log('📡 [USERS] ERP Response status:', response.status)

    if (!response.ok) {
      console.error('❌ [USERS] ERP request failed:', response.status, response.statusText)
      return NextResponse.json(
        { 
          success: false, 
          error: `ERP API error: ${response.status} ${response.statusText}` 
        },
        { status: response.status }
      )
    }

    const erpData = await response.json()
    console.log('📦 [USERS] ERP Response data structure:', Object.keys(erpData))

    if (erpData && Array.isArray(erpData.data)) {
      // Transform the data to match our interface
      const users = erpData.data.map((item: any) => ({
        name: item.name,
        email: item.name, // Email is the 'name' field in User doctype
        full_name: item.name, // We only get name from this endpoint
        user_type: 'System User'
      }))

      console.log(`✅ [USERS] Found ${users.length} users`)
      
      return NextResponse.json({
        success: true,
        users: users
      })
    } else {
      console.warn('⚠️ [USERS] Unexpected response structure:', erpData)
      return NextResponse.json({
        success: true,
        users: []
      })
    }

  } catch (error) {
    console.error('❌ [USERS] API Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch users'
      },
      { status: 500 }
    )
  }
}
