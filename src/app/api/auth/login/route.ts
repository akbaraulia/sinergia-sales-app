import { NextRequest, NextResponse } from 'next/server'
import { erpClient } from '@/lib/erp/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    // Development debugging
    if (process.env.NODE_ENV === 'development') {
      console.log('🔐 [DEV] Login attempt:', {
        email,
        timestamp: new Date().toISOString(),
        userAgent: request.headers.get('user-agent')?.slice(0, 50) + '...'
      })
    }

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Attempt login via ERPNext
    const result = await erpClient.login(email, password)

    // Development debugging - log response
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 [DEV] ERP Login result:', {
        success: result.success,
        userEmail: result.user?.email,
        userRole: result.user?.role,
        permissions: result.user?.permissions?.length || 0,
        error: result.error,
        timestamp: new Date().toISOString()
      })
      
      if (result.success && result.user) {
        console.log('👤 [DEV] User details:', {
          name: result.user.name,
          role: result.user.role,
          permissions: result.user.permissions
        })
      }
    }

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 401 }
      )
    }

    // Create response with user data
    const response = NextResponse.json({
      success: true,
      user: result.user
    })

    // Set cookies if available from ERPNext
    if (result.user?.cookies) {
      response.headers.set('Set-Cookie', result.user.cookies)
    }

    return response

  } catch (error) {
    console.error('❌ Login API error:', error)
    
    // Development debugging - detailed error
    if (process.env.NODE_ENV === 'development') {
      console.error('🐛 [DEV] Detailed error:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : null,
        timestamp: new Date().toISOString()
      })
    }
    
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Login endpoint - use POST method',
    endpoints: {
      login: 'POST /api/auth/login',
      logout: 'POST /api/auth/logout'
    }
  })
}
