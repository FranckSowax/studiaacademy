import { HeaderNav } from './header-nav'

export async function Header() {
  let userEmail: string | null = null

  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    try {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      userEmail = user?.email ?? null
    } catch {
      // Supabase unavailable
    }
  }

  return <HeaderNav userEmail={userEmail} />
}
