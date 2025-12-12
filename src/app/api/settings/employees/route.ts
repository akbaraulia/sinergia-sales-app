import { NextRequest, NextResponse } from 'next/server'

const ERP_BASE_URL = process.env.ERP_BASE_URL || 'https://sinergia.digitalasiasolusindo.com'

/**
 * Proxy endpoint to fetch employee list from ERP
 * This avoids CORS issues by fetching server-side
 */
export async function GET(request: NextRequest) {
  try {
    console.log('📋 [EMPLOYEES] Fetching employee list from ERP...')
    
    // Get cookies from the incoming request (user's session)
    const cookies = request.headers.get('cookie') || ''
    
    const response = await fetch(`${ERP_BASE_URL}/api/method/get_employee_user`, {
      method: 'GET',
      headers: {
        'Cookie': cookies,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      console.error(`❌ [EMPLOYEES] ERP returned ${response.status}: ${response.statusText}`)
      return NextResponse.json(
        { success: false, error: `ERP API error: ${response.statusText}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    if (data.data?.employees) {
      console.log(`✅ [EMPLOYEES] Fetched ${data.data.employees.length} employees`)
      return NextResponse.json({
        success: true,
        data: data.data.employees,
        count: data.data.employees.length
      })
    } else {
      console.warn('⚠️ [EMPLOYEES] No employees found in ERP response')
      return NextResponse.json({
        success: true,
        data: [],
        count: 0
      })
    }

  } catch (error) {
    console.error('❌ [EMPLOYEES] Error fetching from ERP:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch employees' 
      },
      { status: 500 }
    )
  }
}
