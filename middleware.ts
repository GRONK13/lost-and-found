import { NextResponse, type NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'dcism_carolinian_lost_n_found_jwt_secret_key_2026'
)

const AUTH_COOKIE_NAME = 'auth_token'

export async function middleware(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value

  let user: { userId: string; email: string; role: 'USER' | 'ADMIN' } | null = null

  if (token) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET)
      user = payload as any
    } catch (e) {
      user = null
    }
  }

  const { pathname } = request.nextUrl

  // Protected routes that require authentication
  const isProtectedRoute =
    pathname.startsWith('/report') ||
    pathname.startsWith('/profile') ||
    pathname.startsWith('/claims') ||
    pathname.startsWith('/chats') ||
    pathname.startsWith('/admin') ||
    pathname.endsWith('/edit')

  if (!user && isProtectedRoute) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // Admin-only routes
  if (pathname.startsWith('/admin')) {
    if (user?.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|uploads).*)'],
}
