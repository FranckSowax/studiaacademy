import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { estFicheFormateurActive, ficheFormateur } from '@/lib/studia-live/formateur'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * GET /auth/apres-connexion — choisit l'espace d'arrivée du compte qui
 * vient de se connecter, entièrement côté serveur :
 *  - formateur désigné par un administrateur, ou compte « professeur » : /professeur ;
 *  - compte « pro » : /pro ;
 *  - sinon : /dashboard.
 *
 * WHY: la page de connexion y arrive par une navigation complète. La
 * session vient d'être posée en cookies par le navigateur ; la relire
 * ici, dans une requête neuve, évite de dépendre d'un appel
 * intermédiaire entre la connexion et la redirection.
 * Location relative : derrière le proxy, request.url porte l'adresse
 * interne du conteneur.
 */
export async function GET() {
  const vers = (chemin: string) =>
    new NextResponse(null, { status: 307, headers: { Location: chemin, 'Cache-Control': 'no-store' } })

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return vers('/login')

  let formateur = false
  try {
    const fiche = await ficheFormateur(createAdminClient(), {
      id: user.id,
      email: user.email ?? null,
      emailConfirme: Boolean(user.email_confirmed_at),
    })
    formateur = estFicheFormateurActive(fiche)
  } catch {
    // Fiche illisible : on retombe sur le type de compte, jamais sur une erreur.
  }
  if (formateur) return vers('/professeur')

  const { data: profil } = await supabase
    .from('profiles')
    .select('account_type')
    .eq('id', user.id)
    .maybeSingle()
  const type = profil?.account_type
  return vers(type === 'teacher' ? '/professeur' : type === 'pro' ? '/pro' : '/dashboard')
}
