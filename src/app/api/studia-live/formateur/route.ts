import { NextResponse } from 'next/server'
import { parseStaffRole } from '@/lib/collaborators/roles'
import { consumeRateLimit, RATE_LIMITS } from '@/lib/security/rate-limit'
import { createClient } from '@/lib/supabase/server'
import { MESSAGES_ECHEC, demanderTicketFormateur, peutEntrerCommeFormateur } from '@/lib/studia-live/formateur'
import { configLancement } from '@/lib/studia-live/lancement'
import { prenomEleve } from '@/lib/studia-live/prenom'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const SANS_CACHE = { 'Cache-Control': 'no-store' }

function refus(status: number, error: string, message: string) {
  return NextResponse.json({ error, message }, { status, headers: SANS_CACHE })
}

/**
 * POST /api/studia-live/formateur — sans corps. Renvoie `{ url }` :
 * l'adresse d'entrée à usage unique du compte connecté sur Studia Live.
 *
 * Réservé aux administrateurs de Studia Academy (rôle d'équipe effectif,
 * relu en base à chaque appel). L'e-mail est celui du compte de la
 * session, jamais une valeur envoyée par le navigateur : le corps de la
 * requête n'est pas lu.
 */
export async function POST() {
  const config = configLancement()
  if (!config) {
    return refus(503, 'non_configure', "L'accès à Studia Live n'est pas configuré sur ce site.")
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return refus(401, 'non_connecte', 'Connectez-vous pour ouvrir Studia Live.')

  // Rôle effectif relu en base (fiche collaborateur désactivée = null).
  const { data: role, error: erreurRole } = await supabase.rpc('current_staff_role')
  if (erreurRole || !peutEntrerCommeFormateur(parseStaffRole(role))) {
    return refus(403, 'acces_refuse', "Votre compte n'a pas accès à Studia Live. Cet accès est réservé aux formateurs et administrateurs de Studia Academy.")
  }

  // WHY: e-mail du compte d'authentification (vérifié par Supabase), pas
  // celui de `profiles`, que chacun peut modifier sur sa propre ligne.
  const email = user.email?.trim().toLowerCase()
  if (!email || !user.email_confirmed_at) {
    return refus(403, 'email_non_confirme', "L'adresse e-mail de votre compte doit être confirmée avant d'ouvrir Studia Live.")
  }

  if (!(await consumeRateLimit(`live-formateur:${user.id}`, RATE_LIMITS.liveFormateurTicketPerUser))) {
    return refus(429, 'trop_de_demandes', 'Trop de demandes. Patientez une minute, puis réessayez.')
  }

  const { data: profil } = await supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle()
  const resultat = await demanderTicketFormateur(config, {
    email,
    prenom: prenomEleve({ profil, metadonnees: user.user_metadata, email }),
  })
  if (!resultat.ok) {
    return refus(resultat.echec === 'delai' ? 504 : 502, `studia_live_${resultat.echec}`, MESSAGES_ECHEC[resultat.echec])
  }

  return NextResponse.json({ url: resultat.url }, { headers: SANS_CACHE })
}
