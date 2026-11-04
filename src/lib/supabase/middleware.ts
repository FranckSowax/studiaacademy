import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { canAccessAdmin, canAccessInbox, parseStaffRole } from '@/lib/collaborators/roles'

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

  const path = request.nextUrl.pathname
  const isStaffArea = path.startsWith('/admin') || path.startsWith('/messagerie')

  if (
    !user &&
    !path.startsWith('/login') &&
    !path.startsWith('/signup') &&
    !path.startsWith('/auth') &&
    !path.startsWith('/equipe')
  ) {
    // Espaces équipe : connexion par code (WhatsApp / email).
    if (isStaffArea) {
      const url = request.nextUrl.clone()
      url.pathname = '/equipe/connexion'
      url.search = ''
      url.searchParams.set('next', path)
      return NextResponse.redirect(url)
    }
    // Dashboard et démarrage de service : connexion classique.
    if (path.startsWith('/dashboard') || path.match(/\/services\/.*\/start/)) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
  }

  // Espaces équipe : rôle effectif vérifié en base (premier rempart ; chaque
  // page et route refait la vérification côté serveur).
  // Règle unique : public.current_staff_role() — une fiche collaborateur
  // désactivée coupe l'accès, un agent n'a que la messagerie.
  if (user && isStaffArea) {
    const { data: role } = await supabase.rpc('current_staff_role')
    const staffRole = parseStaffRole(role)
    const allowed = path.startsWith('/admin') ? canAccessAdmin(staffRole) : canAccessInbox(staffRole)
    if (!allowed) {
      const url = request.nextUrl.clone()
      url.pathname = canAccessInbox(staffRole) ? '/messagerie' : '/dashboard'
      url.search = ''
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
