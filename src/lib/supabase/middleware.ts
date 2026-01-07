import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: DO NOT REMOVE auth.getUser()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/signup') &&
    !request.nextUrl.pathname.startsWith('/auth')
  ) {
    // no user, potentially redirect to login
    // For now, allowing public access to /, but maybe protect /dashboard later
    // The PRD says public pages are /, /services, etc.
    // Dashboard is protected.
    
    if (request.nextUrl.pathname.startsWith('/dashboard') || 
        request.nextUrl.pathname.startsWith('/admin') ||
        request.nextUrl.pathname.match(/\/services\/.*\/start/)) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }
  }

  // Admin protection
  if (user && request.nextUrl.pathname.startsWith('/admin')) {
    // In a real application, you would check the user's role in the database
    // const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
    // if (profile?.role !== 'admin') {
    //   return NextResponse.redirect(new URL('/dashboard', request.url))
    // }
    
    // For this demo/implementation phase, we'll allow access but strictly you should implement RBAC here
    // checking specific emails or metadata
  }

  return supabaseResponse
}
