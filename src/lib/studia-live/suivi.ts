import type { createAdminClient } from '@/lib/supabase/admin'
import {
  lireSessionLive, listerSessionsLive, sansLiens, type DetailSessionLive, type ResultatLive, type SessionLiveResume,
} from './pilotage'
import {
  compterFinales, dateIso, detailARecharger, estStatutSuivi, type EnvoiJournal, type FicheSuivi, type LigneSuivi,
  type TypeEnvoi,
} from './suivi-regles'

/**
 * Suivi des sessions clôturées de Studia Live : synchronisation avec
 * Studia Live, lecture et journal des envois.
 *
 * Serveur uniquement, avec la clé de service (les deux tables n'ont
 * aucune politique RLS) : à n'appeler que derrière requireAdmin() ou le
 * secret des tâches planifiées. Les données lues sont nominatives :
 * seuls des compteurs et des codes d'erreur sont journalisés.
 */

type Admin = ReturnType<typeof createAdminClient>

const TABLE = 'live_sessions_suivi'
const JOURNAL = 'live_sessions_envois'
const MAX_PAGES = 250
const DETAILS_EN_PARALLELE = 3
const COLONNES_LIGNE =
  'live_session_id, code, titre, formation_label, date_formation, resume, synchronise_le, supprimee_live_le, ' +
  'statut_suivi, commanditaire_nom, commanditaire_email, notes, responsable_id'

export const MIGRATION_SUIVI = 'Appliquez la migration 20261204120000_live_sessions_suivi.sql pour activer le suivi.'
const TABLE_ABSENTE = new Set(['42P01', 'PGRST205', '42704'])
const messageBase = (code: string | undefined) =>
  code && TABLE_ABSENTE.has(code) ? MIGRATION_SUIVI : 'Enregistrement du suivi impossible. Réessayez dans un instant.'

export interface BilanSynchronisation {
  /** Sessions clôturées présentes dans Studia Live. */
  total: number
  nouvelles: number
  details_recharges: number
  details_en_echec: number
  /** Sessions nouvellement marquées « supprimée dans Studia Live ». */
  supprimees: number
}

export type ResultatSynchronisation = { ok: true; bilan: BilanSynchronisation } | { ok: false; message: string }

function ligne(v: Record<string, unknown>): LigneSuivi {
  return {
    ...(v as unknown as LigneSuivi),
    resume: (v.resume && typeof v.resume === 'object' ? v.resume : {}) as Partial<SessionLiveResume>,
    statut_suivi: estStatutSuivi(v.statut_suivi) ? v.statut_suivi : 'a_traiter',
  }
}

/** Enregistre le détail reçu (sans les liens) et met le résumé des finales à jour. */
async function conserverDetail(admin: Admin, detail: DetailSessionLive, resume: Partial<SessionLiveResume>, maintenant: number) {
  const donnees = sansLiens(detail)
  const finales = compterFinales(donnees)
  return admin
    .from(TABLE)
    .update({
      donnees,
      synchronise_le: new Date(maintenant).toISOString(),
      resume: { ...resume, nb_participants: finales.total, nb_avec_email: finales.avecEmail, finales_envoyees: finales.envoyees },
    })
    .eq('live_session_id', detail.session.id)
}

/**
 * Parcourt toutes les pages de la liste des sessions clôturées, crée ou
 * met à jour une ligne de suivi par session, recharge le détail des
 * sessions nouvelles ou synchronisées depuis plus de 24 h, et marque
 * celles qui ont disparu de Studia Live (sans jamais les supprimer).
 */
export async function synchroniserSessionsLive(admin: Admin, maintenant = Date.now()): Promise<ResultatSynchronisation> {
  // 1. Toute la liste, page par page.
  const sessions = new Map<string, SessionLiveResume>()
  let decalage = 0
  let complete = false
  for (let page = 0; page < MAX_PAGES; page++) {
    const r = await listerSessionsLive({ decalage })
    if (!r.ok) return { ok: false, message: r.message }
    for (const s of r.data.sessions) sessions.set(s.id, s)
    decalage += r.data.sessions.length
    if (r.data.sessions.length === 0 || decalage >= r.data.total) {
      complete = true
      break
    }
  }

  // 2. Lignes déjà suivies.
  const existantes = await admin.from(TABLE).select('live_session_id, synchronise_le, supprimee_live_le')
  if (existantes.error) {
    console.error(`[studia-live] suivi : lecture impossible (${existantes.error.code})`)
    return { ok: false, message: messageBase(existantes.error.code) }
  }
  const connues = new Map(
    ((existantes.data ?? []) as { live_session_id: string; synchronise_le: string | null; supprimee_live_le: string | null }[]).map(
      (l) => [l.live_session_id, l],
    ),
  )

  // 3. Une ligne par session : les colonnes de suivi (statut, notes…) ne sont pas touchées.
  if (sessions.size > 0) {
    const { error } = await admin.from(TABLE).upsert(
      [...sessions.values()].map((s) => ({
        live_session_id: s.id,
        code: s.code,
        titre: s.titre,
        formation_label: s.formation_label ?? null,
        date_formation: dateIso(s.date_formation),
        resume: s,
        supprimee_live_le: null,
      })),
      { onConflict: 'live_session_id' },
    )
    if (error) {
      console.error(`[studia-live] suivi : enregistrement impossible (${error.code})`)
      return { ok: false, message: messageBase(error.code) }
    }
  }

  // 4. Détail des sessions nouvelles ou synchronisées depuis plus de 24 h.
  const aRecharger = [...sessions.values()].filter((s) => detailARecharger(connues.get(s.id)?.synchronise_le, maintenant))
  let recharges = 0
  let enEchec = 0
  for (let i = 0; i < aRecharger.length; i += DETAILS_EN_PARALLELE) {
    const lot = aRecharger.slice(i, i + DETAILS_EN_PARALLELE)
    const resultats = await Promise.all(
      lot.map(async (s) => {
        const detail = await lireSessionLive(s.id)
        if (!detail.ok) return false
        const { error } = await conserverDetail(admin, detail.data, s, maintenant)
        return !error
      }),
    )
    const reussis = resultats.filter(Boolean).length
    recharges += reussis
    enEchec += resultats.length - reussis
  }

  // 5. Sessions disparues de la liste : marquées, jamais supprimées.
  let supprimees = 0
  if (complete) {
    const disparues = [...connues.values()].filter((l) => !sessions.has(l.live_session_id) && !l.supprimee_live_le)
    if (disparues.length > 0) {
      const { error } = await admin
        .from(TABLE)
        .update({ supprimee_live_le: new Date(maintenant).toISOString() })
        .in('live_session_id', disparues.map((l) => l.live_session_id))
      if (!error) supprimees = disparues.length
    }
  }

  return {
    ok: true,
    bilan: {
      total: sessions.size,
      nouvelles: [...sessions.keys()].filter((id) => !connues.has(id)).length,
      details_recharges: recharges,
      details_en_echec: enEchec,
      supprimees,
    },
  }
}

/**
 * Redemande le détail d'une session à Studia Live et le conserve. Le
 * résultat porte encore les liens (rapport de formation) : à utiliser
 * tout de suite, jamais à stocker.
 */
export async function rechargerSession(admin: Admin, id: string, maintenant = Date.now()): Promise<ResultatLive<DetailSessionLive>> {
  const detail = await lireSessionLive(id)
  if (!detail.ok) return detail
  const actuelle = await admin.from(TABLE).select('resume').eq('live_session_id', id).maybeSingle()
  const resume = (actuelle.data?.resume ?? {}) as Partial<SessionLiveResume>
  const { error } = await conserverDetail(admin, detail.data, resume, maintenant)
  if (error) console.error(`[studia-live] suivi : détail non conservé (${error.code})`)
  return detail
}

/** Toutes les sessions suivies, de la plus récente à la plus ancienne, sans le détail nominatif. */
export async function lireLignesSuivi(admin: Admin): Promise<{ lignes: LigneSuivi[]; erreur: string | null }> {
  const { data, error } = await admin
    .from(TABLE)
    .select(COLONNES_LIGNE)
    .order('date_formation', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(2000)
  if (error) {
    console.error(`[studia-live] suivi : lecture impossible (${error.code})`)
    return { lignes: [], erreur: TABLE_ABSENTE.has(error.code) ? MIGRATION_SUIVI : 'Impossible de lire le suivi des sessions.' }
  }
  return { lignes: ((data ?? []) as unknown as Record<string, unknown>[]).map(ligne), erreur: null }
}

/** Une session suivie, avec son dernier détail reçu. */
export async function lireFicheSuivi(admin: Admin, id: string): Promise<FicheSuivi | null> {
  const { data, error } = await admin.from(TABLE).select(`${COLONNES_LIGNE}, donnees`).eq('live_session_id', id).maybeSingle()
  if (error) console.error(`[studia-live] suivi : fiche illisible (${error.code})`)
  if (error || !data) return null
  const brut = data as unknown as Record<string, unknown>
  return { ...ligne(brut), donnees: (brut.donnees ?? null) as FicheSuivi['donnees'] }
}

/** Historique des envois d'une session, du plus récent au plus ancien. */
export async function lireJournal(admin: Admin, id: string): Promise<EnvoiJournal[]> {
  const { data, error } = await admin
    .from(JOURNAL)
    .select('id, type, destinataires, resultat, par, created_at')
    .eq('live_session_id', id)
    .order('created_at', { ascending: false })
    .limit(200)
  if (error) console.error(`[studia-live] journal illisible (${error.code})`)
  return (data ?? []) as EnvoiJournal[]
}

/** Ajoute une ligne au journal (insertion seule). Renvoie false si l'écriture échoue. */
export async function journaliserEnvoi(
  admin: Admin,
  envoi: { liveSessionId: string; type: TypeEnvoi; destinataires: string; resultat: Record<string, unknown>; par: string },
): Promise<boolean> {
  const { error } = await admin.from(JOURNAL).insert({
    live_session_id: envoi.liveSessionId,
    type: envoi.type,
    destinataires: envoi.destinataires.slice(0, 2000),
    resultat: envoi.resultat,
    par: envoi.par,
  })
  if (error) console.error(`[studia-live] journal : écriture impossible (${error.code})`)
  return !error
}

export interface AdminResponsable {
  id: string
  nom: string
}

/** Admins actifs à qui l'on peut confier le suivi d'une session. */
export async function lireResponsables(admin: Admin): Promise<AdminResponsable[]> {
  const [profils, fiches] = await Promise.all([
    admin.from('profiles').select('id, full_name, email, role').in('role', ['admin', 'super_admin']),
    admin.from('collaborators').select('user_id, full_name, role, is_active').not('user_id', 'is', null),
  ])
  type Fiche = { user_id: string; full_name: string; role: string; is_active: boolean }
  const parCompte = new Map(((fiches.data ?? []) as Fiche[]).map((f) => [f.user_id, f]))
  const responsables = new Map<string, string>()

  for (const p of (profils.data ?? []) as { id: string; full_name: string | null; email: string | null; role: string }[]) {
    const fiche = parCompte.get(p.id)
    // Même règle que public.current_staff_role() : une fiche désactivée coupe
    // l'accès ; une fiche « agent » prime sur le rôle admin du profil.
    if (fiche && !fiche.is_active) continue
    if (p.role !== 'super_admin' && fiche && fiche.role !== 'admin') continue
    responsables.set(p.id, p.full_name?.trim() || fiche?.full_name || p.email || 'Admin')
  }
  for (const f of parCompte.values()) {
    if (f.is_active && f.role === 'admin' && !responsables.has(f.user_id)) responsables.set(f.user_id, f.full_name)
  }
  return [...responsables.entries()].map(([id, nom]) => ({ id, nom })).sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))
}
