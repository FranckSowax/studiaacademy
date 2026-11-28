import type { createAdminClient } from '@/lib/supabase/admin'
import { construireBilan, lireBilanConserve, type BilanEntreprise, type PropositionRetenue } from './bilan'
import { empreinteJeton } from './bilan-jeton'
import { lireDossier } from './dossier'
import type { Entreprise } from './dossier-regles'

/**
 * Accès aux bilans d'entreprise : préparation côté admin, lecture par
 * jeton pour la page publique, historique des envois.
 *
 * Serveur uniquement, avec la clé de service. `lireBilanPublic` est le
 * seul point d'entrée sans session : il ne renvoie qu'un bilan dont le
 * jeton présenté correspond, envoyé, non expiré et non révoqué.
 */

type Admin = ReturnType<typeof createAdminClient>

export interface BilanEnvoye {
  id: string
  destinataire: string
  envoye: boolean
  expire_le: string
  revoque_le: string | null
  envoye_par: string | null
  created_at: string
  /** État du lien au moment de la lecture. */
  etat: 'actif' | 'expire' | 'revoque' | 'non_parti'
}

/** État d'un lien de bilan à un instant donné. */
export function etatLien(b: { envoye: boolean; expire_le: string; revoque_le: string | null }, maintenant: number): BilanEnvoye['etat'] {
  if (!b.envoye) return 'non_parti'
  if (b.revoque_le) return 'revoque'
  const expiration = Date.parse(b.expire_le)
  return Number.isNaN(expiration) || expiration <= maintenant ? 'expire' : 'actif'
}

/** Bilan tel qu'il serait envoyé maintenant, ou null si l'entreprise n'existe pas. */
export async function preparerBilan(
  admin: Admin,
  companyId: string,
  maintenant = Date.now(),
): Promise<{ bilan: BilanEntreprise; entreprise: Entreprise } | null> {
  const dossier = await lireDossier(admin, companyId, maintenant)
  if (!dossier) return null
  const retenues = await admin
    .from('company_proposals')
    .select('type, catalogue_ref, titre, justification, formation_id, score')
    .eq('company_id', companyId)
    .eq('statut', 'retenue')
    .order('score', { ascending: false })
  if (retenues.error) console.error(`[entreprises] formations retenues illisibles (${retenues.error.code})`)
  return {
    entreprise: dossier.entreprise,
    bilan: construireBilan(
      {
        entreprise: dossier.entreprise,
        sessions: dossier.sessions,
        indicateurs: dossier.indicateurs,
        analyse: dossier.analyse,
        retenues: (retenues.data ?? []) as PropositionRetenue[],
      },
      maintenant,
    ),
  }
}

/**
 * Bilan correspondant au jeton d'un lien, ou null : jeton mal formé ou
 * inconnu, e-mail jamais parti, lien expiré ou révoqué. Les quatre cas
 * donnent la même réponse, pour ne rien révéler.
 */
export async function lireBilanPublic(
  admin: Admin,
  jeton: unknown,
  maintenant = Date.now(),
): Promise<{ bilan: BilanEntreprise; expire_le: string } | null> {
  const empreinte = empreinteJeton(jeton)
  if (!empreinte) return null
  const { data, error } = await admin
    .from('company_reports')
    .select('contenu, envoye, expire_le, revoque_le')
    .eq('jeton_hash', empreinte)
    .maybeSingle()
  if (error) console.error(`[entreprises] bilan illisible (${error.code})`)
  const ligne = data as { contenu: unknown; envoye: boolean; expire_le: string; revoque_le: string | null } | null
  if (!ligne || !ligne.envoye || ligne.revoque_le) return null
  const expiration = Date.parse(ligne.expire_le)
  if (Number.isNaN(expiration) || expiration <= maintenant) return null
  const bilan = lireBilanConserve(ligne.contenu)
  return bilan ? { bilan, expire_le: ligne.expire_le } : null
}

/** Historique des bilans d'une entreprise, du plus récent au plus ancien. */
export async function lireBilansEnvoyes(admin: Admin, companyId: string, maintenant = Date.now()): Promise<BilanEnvoye[]> {
  const { data, error } = await admin
    .from('company_reports')
    .select('id, destinataire, envoye, expire_le, revoque_le, envoye_par, created_at')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .limit(100)
  // Avant la migration, la table n'existe pas : l'historique est simplement vide.
  if (error) return []
  return ((data ?? []) as Omit<BilanEnvoye, 'etat'>[]).map((b) => ({ ...b, etat: etatLien(b, maintenant) }))
}
