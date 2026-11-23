import { cheminInterne, originePublique } from '@/lib/http/origine'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  // The `/auth/callback` route is required for the server-side auth flow implemented
  // by the SSR package. It exchanges an auth code for the user's session.
  // https://supabase.com/docs/guides/auth/server-side/nextjs
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = cheminInterne(requestUrl.searchParams.get('next'))

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  // URL to redirect to after sign in process completes — public origin:
  // behind Railway's proxy, requestUrl.origin is the container's own address
  return NextResponse.redirect(`${originePublique(request)}${next}`)
}
