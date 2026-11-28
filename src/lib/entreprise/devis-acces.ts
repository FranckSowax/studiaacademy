import type { createAdminClient } from '@/lib/supabase/admin'
import { empreinteJeton } from './bilan-jeton'
import { lireDevisConserve, nettoyerSaisie, STATUTS_DEVIS, type DevisContenu, type StatutDevis } from './devis'
import type { DevisSaisie } from './tarifs'

/**
 * Accès aux devis d'entreprise : liste et lecture côté admin, lecture
 * par jeton pour la page publique.
 *
 * Serveur uniquement, avec la clé de service. `lireDevisPublic` est le
 * seul point d'entrée sans session : il ne sert qu'un devis envoyé, dont
 * le jeton présenté correspond et dont le lien n'a pas expiré.
 */

type Admin = ReturnType<typeof createAdminClient>

export interface DevisEntreprise {
  id: string
  numero: string
  objet: string
  saisie: DevisSaisie
  contenu: DevisContenu | null
  total_ht: number
  statut: StatutDevis
  destinataire: string | null
  envoye_le: string | null
  decide_le: string | null
  created_at: string
}

const COLONNES = 'id, numero, objet, saisie, contenu, total_ht, statut, destinataire, envoye_le, decide_le, created_at'

function lire(v: Record<string, unknown>): DevisEntreprise {
  return {
    ...(v as unknown as DevisEntreprise),
    saisie: nettoyerSaisie(v.saisie),
    contenu: lireDevisConserve(v.contenu),
    total_ht: typeof v.total_ht === 'number' ? v.total_ht : Number(v.total_ht) || 0,
    statut: STATUTS_DEVIS.includes(v.statut as StatutDevis) ? (v.statut as StatutDevis) : 'brouillon',
  }
}

/** Devis d'une entreprise, du plus récent au plus ancien. */
export async function lireDevisEntreprise(admin: Admin, companyId: string): Promise<DevisEntreprise[]> {
  const { data, error } = await admin.from('company_quotes').select(COLONNES).eq('company_id', companyId).order('created_at', { ascending: false }).limit(200)
  // Avant la migration, la table n'existe pas : la liste est simplement vide.
  if (error) return []
  return ((data ?? []) as unknown as Record<string, unknown>[]).map(lire)
}

/** Un devis d'une entreprise, ou null. */
export async function lireDevisAdmin(admin: Admin, companyId: string, devisId: string): Promise<DevisEntreprise | null> {
  const { data, error } = await admin.from('company_quotes').select(COLONNES).eq('id', devisId).eq('company_id', companyId).maybeSingle()
  if (error) console.error(`[entreprises] devis illisible (${error.code})`)
  return data ? lire(data as unknown as Record<string, unknown>) : null
}

/**
 * Devis correspondant au jeton d'un lien, ou null : jeton mal formé ou
 * inconnu, devis jamais envoyé, lien expiré. Tous ces cas donnent la
 * même réponse, pour ne rien révéler.
 */
export async function lireDevisPublic(
  admin: Admin,
  jeton: unknown,
  maintenant = Date.now(),
): Promise<{ contenu: DevisContenu; statut: StatutDevis } | null> {
  const empreinte = empreinteJeton(jeton)
  if (!empreinte) return null
  const { data, error } = await admin.from('company_quotes').select('contenu, statut, lien_expire_le').eq('jeton_hash', empreinte).maybeSingle()
  if (error) console.error(`[entreprises] devis public illisible (${error.code})`)
  const ligne = data as { contenu: unknown; statut: string; lien_expire_le: string | null } | null
  if (!ligne || ligne.statut === 'brouillon' || !STATUTS_DEVIS.includes(ligne.statut as StatutDevis)) return null
  const expiration = ligne.lien_expire_le ? Date.parse(ligne.lien_expire_le) : Number.NaN
  if (Number.isNaN(expiration) || expiration <= maintenant) return null
  const contenu = lireDevisConserve(ligne.contenu)
  return contenu ? { contenu, statut: ligne.statut as StatutDevis } : null
}
