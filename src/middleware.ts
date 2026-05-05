import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PROTECTED  = ['/dashboard','/queues','/team','/billing','/settings','/analytics','/display','/locations','/onboarding']
const AUTH_PAGES = ['/login','/signup','/reset','/verify','/update-password']

export async function middleware(req: NextRequest) {
  const res  = NextResponse.next()
  const path = req.nextUrl.pathname

  // Create Supabase client using @supabase/ssr (replaces deprecated auth-helpers)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value))
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  const isProtected = PROTECTED.some(p => path.startsWith(p))
  const isAuthPage  = AUTH_PAGES.some(p => path.startsWith(p))

  // Not logged in → redirect to login
  if (isProtected && !session) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('next', path)
    return NextResponse.redirect(loginUrl)
  }

  // Already logged in → redirect away from auth pages
  if (isAuthPage && session && !path.startsWith('/update-password')) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return res
}

export const config = {
  // Exclude static files, images, stripe webhook, public queue/display pages
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/stripe/webhook|join|display).*)'],
}
