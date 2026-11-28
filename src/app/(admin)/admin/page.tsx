export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { requireAdmin } from '@/lib/auth/require-admin'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  calculerTableauDeBord, isPeriode, tranches, type DonneesBrutes, type Periode,
} from '@/lib/admin/dashboard-metrics'
import { donneesExemple } from '@/lib/admin/dashboard-demo'
import { DashboardView } from '@/components/admin/dashboard/DashboardView'

export const metadata: Metadata = { title: 'Vue d’ensemble — Studia Admin', robots: { index: false } }

const PAGE = 1000
const PAGES_MAX = 20

/** Instant de la requête (hors du rendu : la page est recalculée à chaque visite). */
const horloge = () => new Date()

type Requete = (debut: number, fin: number) => PromiseLike<{ data: unknown[] | null; error: { message: string } | null }>

/**
 * Lit toutes les lignes d'une requête, page par page (l'API en renvoie 1 000
 * au plus par appel). Une table indisponible donne une liste vide et son nom
 * dans `indisponibles`, plutôt qu'une page en erreur.
 */
async function lireTout<T>(nom: string, requete: Requete, indisponibles: string[]): Promise<T[]> {
  const lignes: T[] = []
  for (let page = 0; page < PAGES_MAX; page++) {
    const { data, error } = await requete(page * PAGE, page * PAGE + PAGE - 1)
    if (error) {
      console.error(`[admin] lecture ${nom}:`, error.message)
      indisponibles.push(nom)
      return []
    }
    lignes.push(...((data ?? []) as T[]))
    if ((data ?? []).length < PAGE) break
  }
  return lignes
}

/** Lignes nécessaires à la période affichée et à la période de comparaison. */
async function lireDonnees(periode: Periode, maintenant: Date): Promise<{ donnees: DonneesBrutes; indisponibles: string[] }> {
  const admin = createAdminClient()
  const cases = tranches(periode, maintenant)
  const debut = cases[0].debut
  const depuis = new Date(debut - (cases[cases.length - 1].fin - debut)).toISOString()
  const hier = new Date(maintenant.getTime() - 24 * 3600 * 1000).toISOString()
  const indisponibles: string[] = []

  const [comptes, inscriptions, reservations, formations, evenements, conversations] = await Promise.all([
    lireTout<DonneesBrutes['comptes'][number]>('comptes', (a, b) =>
      admin.from('profiles').select('created_at').gte('created_at', depuis).order('created_at').range(a, b), indisponibles),
    lireTout<DonneesBrutes['inscriptions'][number]>('inscriptions', (a, b) =>
      admin
        .from('formation_enrollments')
        .select('formation_id, status, requested_at, granted_at, payment_method, payment_amount_fcfa')
        .or(`requested_at.gte."${depuis}",granted_at.gte."${depuis}",status.eq.pending`)
        .order('requested_at')
        .range(a, b), indisponibles),
    lireTout<DonneesBrutes['reservations'][number]>('réservations', (a, b) =>
      admin
        .from('presentiel_reservations')
        .select('session_id, status, created_at, decided_at, payment_method, payment_amount_fcfa')
        .or(`created_at.gte."${depuis}",decided_at.gte."${depuis}",status.eq.reserved`)
        .order('created_at')
        .range(a, b), indisponibles),
    lireTout<DonneesBrutes['formations'][number]>('formations', (a, b) =>
      admin.from('formations').select('id, titre').order('created_at').range(a, b), indisponibles),
    lireTout<DonneesBrutes['evenements'][number]>('événements', (a, b) =>
      admin
        .from('presentiel_sessions')
        .select('id, titre, date_debut, places_total, places_reservees')
        .eq('is_published', true)
        .gte('date_debut', hier)
        .order('date_debut')
        .range(a, b), indisponibles),
    lireTout<DonneesBrutes['conversations'][number]>('conversations WhatsApp', (a, b) =>
      admin.from('wa_conversations').select('created_at, source').gte('created_at', depuis).order('created_at').range(a, b), indisponibles),
  ])

  return { donnees: { comptes, inscriptions, reservations, formations, evenements, conversations }, indisponibles }
}

/**
 * /admin — vue d'ensemble : indicateurs de toutes les activités (comptes,
 * inscriptions en ligne, présentiel, paiements, contacts WhatsApp) sur une
 * période, comparés à la période précédente, avec les graphiques de suivi.
 * `?p=30j|90j|12m` choisit la période ; `?demo=1` affiche des données d'exemple.
 */
export default async function AdminOverviewPage({ searchParams }: { searchParams: Promise<{ p?: string; demo?: string }> }) {
  await requireAdmin()
  const { p, demo } = await searchParams
  const periode: Periode = isPeriode(p) ? p : '30j'
  const exemple = demo === '1'
  const maintenant = horloge()

  const { donnees, indisponibles } = exemple
    ? { donnees: donneesExemple(maintenant), indisponibles: [] as string[] }
    : await lireDonnees(periode, maintenant)
  return <DashboardView tableau={calculerTableauDeBord(donnees, periode, maintenant)} exemple={exemple} indisponibles={indisponibles} />
}
