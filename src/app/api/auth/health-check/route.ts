import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    console.log('🍪 [HEALTH-CHECK] Cookie validation request received')
    
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('sid')
    const userCookie = cookieStore.get('user_id')
    const systemUserCookie = cookieStore.get('system_user')
    
    console.log('🍪 [HEALTH-CHECK] Cookie status:', {
      hasSid: !!sessionCookie,
      hasUserId: !!userCookie,
      hasSystemUser: !!systemUserCookie,
      sidValue: sessionCookie?.value?.substring(0, 20) + '...',
      userIdValue: userCookie?.value
    })
    
    // Check if essential cookies exist
    if (!sessionCookie || !userCookie) {
      console.warn('⚠️ [HEALTH-CHECK] Missing essential cookies')
      return NextResponse.json({ 
        success: false, 
        authenticated: false,
        error: 'Missing essential cookies',
        details: {
          hasSid: !!sessionCookie,
          hasUserId: !!userCookie,
          hasSystemUser: !!systemUserCookie
        }
      })
    }
    
    // Try to validate cookies with ERPNext
    try {
      const erpResponse = await fetch(`${process.env.ERPNEXT_URL}/api/method/frappe.auth.get_logged_user`, {
        method: 'GET',
        headers: {
          'Cookie': `sid=${sessionCookie.value}; user_id=${userCookie.value}${systemUserCookie ? `; system_user=${systemUserCookie.value}` : ''}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      })
      
      if (erpResponse.ok) {
        const erpData = await erpResponse.json()
        console.log('✅ [HEALTH-CHECK] ERP validation successful:', {
          user: erpData.message,
          status: erpResponse.status
        })
        
        return NextResponse.json({ 
          success: true, 
          authenticated: true,
          user: erpData.message,
          timestamp: new Date().toISOString()
        })
      } else {
        console.warn('⚠️ [HEALTH-CHECK] ERP validation failed:', {
          status: erpResponse.status,
          statusText: erpResponse.statusText
        })
        
        return NextResponse.json({ 
          success: false, 
          authenticated: false,
          error: 'ERP validation failed',
          details: {
            status: erpResponse.status,
            statusText: erpResponse.statusText
          }
        })
      }
    } catch (erpError) {
      console.error('❌ [HEALTH-CHECK] ERP validation error:', erpError)
      
      return NextResponse.json({ 
        success: false, 
        authenticated: false,
        error: 'ERP connection failed',
        details: {
          message: erpError instanceof Error ? erpError.message : 'Unknown error'
        }
      })
    }
    
  } catch (error) {
    console.error('❌ [HEALTH-CHECK] Health check failed:', error)
    
    return NextResponse.json({ 
      success: false, 
      authenticated: false,
      error: 'Health check failed',
      details: {
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 500 })
  }
}
