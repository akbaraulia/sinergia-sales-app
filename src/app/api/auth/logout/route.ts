import { NextResponse } from 'next/server'
import { erpClient } from '@/lib/erp/auth'

export async function POST() {
  try {
    // Logout dari ERPNext
    await erpClient.logout()

    // Create response
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    })

    // Clear cookies
    response.headers.set('Set-Cookie', 'session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly')

    return response

  } catch (error) {
    console.error('❌ Logout API error:', error)
    return NextResponse.json(
      { success: false, error: 'Logout failed' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Logout endpoint - use POST method' 
  })
}
