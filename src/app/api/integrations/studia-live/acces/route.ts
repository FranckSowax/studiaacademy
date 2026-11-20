import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { trouverOuCreerCompte } from '@/lib/studia-live/comptes'
import { secretLiaison, verifierLienAcces } from '@/lib/studia-live/signature'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * GET /api/integrations/studia-live/acces?e=&x=&s= — lien « Ouvrir mon
 * espace Academy » des e-mails Studia Live (signé HMAC, 30 jours).
 * Connecte directement le participant à son compte (créé au besoin),
 * puis l'amène au tableau de bord. Les comptes d'équipe (admin,
 * collaborateurs) ne sont jamais connectés ainsi : page de connexion.
 */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const vers = (chemin: string) => NextResponse.redirect(new URL(chemin, url.origin))

  const secret = secretLiaison()
  if (!secret) return vers('/login')
  const email = verifierLienAcces(
    secret,
    url.searchParams.get('e'),
    url.searchParams.get('x'),
    url.searchParams.get('s')
  )
  if (!email) return vers('/login?lien=expire')

  const admin = createAdminClient()
  const compte = await trouverOuCreerCompte(admin, email, email.split('@')[0])
  if (!compte) return vers('/login')
  if (compte.equipe) return vers(`/login?email=${encodeURIComponent(email)}`)

  const { data: lien, error } = await admin.auth.admin.generateLink({ type: 'magiclink', email })
  const tokenHash = lien?.properties?.hashed_token
  if (error || !tokenHash) return vers('/login')

  // Session posée en cookies par le client serveur (@supabase/ssr)
  const supabase = await createClient()
  const { error: erreurOtp } = await supabase.auth.verifyOtp({ type: 'magiclink', token_hash: tokenHash })
  if (erreurOtp) return vers('/login')

  return vers('/dashboard?bienvenue=studia-live')
}
