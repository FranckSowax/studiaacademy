import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { codeLiveActif, configLancement, demanderTicket } from '@/lib/studia-live/lancement'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const SANS_CACHE = { 'Cache-Control': 'no-store, max-age=0' }

function prenomDe(nomComplet: unknown, email: string): string {
  const nom = typeof nomComplet === 'string' ? nomComplet.trim() : ''
  const prenom = (nom.split(/\s+/)[0] || email.split('@')[0] || 'Élève').slice(0, 60)
  return prenom
}

/**
 * GET /formations/<slug>/suivre — lance ou reprend une formation.
 * Mêmes contrôles d'accès que le lecteur Academy (/apprendre/<slug>) :
 * élève connecté, formation existante, inscription active ou terminée.
 *  - formation sans `live_code` (ou Studia Live non configuré) : lecteur
 *    Academy, inchangé ;
 *  - formation avec `live_code` : ticket d'entrée demandé à Studia Live
 *    (appel serveur signé), puis redirection 302 de l'élève, déjà
 *    identifié. En cas d'échec : page « indisponible » avec « Réessayer »,
 *    jamais l'ancien lecteur.
 */
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const chemin = encodeURIComponent(slug)
  // WHY: Location relative. Derrière le proxy de Railway, request.url
  // porte l'adresse interne du conteneur (localhost:8080) : une adresse
  // absolue construite dessus enverrait l'élève hors du site.
  const vers = (cible: string, status = 307) =>
    new NextResponse(null, { status, headers: { ...SANS_CACHE, Location: cible } })

  // WHY: un ticket ne sert qu'une fois. Le routeur client de Next (clic
  // sur un <Link>, préchargement, router.push) interroge la route par
  // fetch avant de naviguer : lui répondre par un ticket le gaspillerait.
  // Une réponse non-RSC lui fait recharger l'adresse en navigation réelle.
  const mode = request.headers.get('sec-fetch-mode')
  if (
    request.headers.has('rsc') ||
    request.headers.has('next-router-prefetch') ||
    (mode !== null && mode !== 'navigate')
  ) {
    return new NextResponse(null, { status: 204, headers: SANS_CACHE })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return vers(`/login?redirect=/formations/${chemin}/suivre`)

  // select('*') : reste valable tant que la colonne live_code n'est pas migrée.
  const { data: formation } = await supabase.from('formations').select('*').eq('slug', slug).single()
  if (!formation) {
    return new NextResponse('Formation introuvable', { status: 404, headers: SANS_CACHE })
  }

  const { data: inscription } = await supabase
    .from('formation_enrollments')
    .select('status')
    .eq('formation_id', formation.id)
    .eq('user_id', user.id)
    .maybeSingle()
  const autorise = inscription?.status === 'active' || inscription?.status === 'completed'
  if (!autorise) return vers(`/formations/en-ligne/${chemin}`)

  const config = configLancement()
  const code = codeLiveActif(formation)
  if (!config || !code) return vers(`/apprendre/${chemin}`)

  const indisponible = () => vers(`/formations/${chemin}/suivre/indisponible`, 303)
  const email = user.email?.trim().toLowerCase()
  if (!email) return indisponible()

  const { data: profil } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .maybeSingle()

  const entree = await demanderTicket(config, {
    email,
    prenom: prenomDe(profil?.full_name ?? user.user_metadata?.full_name, email),
    academyUserId: user.id,
    formationCode: code,
  })
  if (!entree) return indisponible()

  return NextResponse.redirect(entree, { status: 302, headers: SANS_CACHE })
}
