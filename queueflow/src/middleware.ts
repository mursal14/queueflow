import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PROTECTED = ['/dashboard', '/queues', '/team', '/billing', '/settings', '/analytics', '/display', '/locations', '/onboarding']
const AUTH_PAGES = ['/login', '/signup', '/reset', '/verify', '/update-password']

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  const { data: { session } } = await supabase.auth.getSession()
  const path = req.nextUrl.pathname

  const isProtected = PROTECTED.some(p => path.startsWith(p))
  const isAuth = AUTH_PAGES.some(p => path.startsWith(p))

  if (isProtected && !session) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('next', path)
    return NextResponse.redirect(loginUrl)
  }

  if (isAuth && session && !path.startsWith('/update-password')) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/stripe/webhook|join|display).*)'],
}
