import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// DISABLED FOR NOW - localStorage auth cannot be checked in middleware
// Will handle auth checks on client side in components
export function middleware(request: NextRequest) {
  // Just pass through everything for now
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)  
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}