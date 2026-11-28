import type { DonneesSessionLive } from './pilotage'
import { enTexte, jourCourt, niveauLabel } from './suivi-regles'

/**
 * Export CSV des réponses d'une session, pour Excel français :
 * séparateur « ; », BOM UTF-8, fins de ligne CRLF.
 *
 * Une ligne par participant, une colonne par activité nominative. Les
 * activités anonymes sont listées en bas, sans nom : elles ne sont
 * jamais rattachées à un participant.
 */

const SEPARATEUR = ';'
const FIN_DE_LIGNE = '\r\n'
export const BOM = '﻿'

const A_PROTEGER = /[;"\r\n]/
// WHY: une réponse libre qui commence par = + - @ serait exécutée comme une
// formule à l'ouverture dans Excel ; l'apostrophe la garde en texte.
const FORMULE = /^[=+\-@\t\r]/

/**
 * Une cellule CSV : nombres avec virgule décimale, textes protégés
 * (guillemets doublés, cellule entre guillemets si elle contient « ; »,
 * un guillemet ou un retour à la ligne).
 */
export function celluleCsv(valeur: unknown): string {
  if (valeur === null || valeur === undefined) return ''
  if (typeof valeur === 'number') return Number.isFinite(valeur) ? String(valeur).replace('.', ',') : ''
  let texte = typeof valeur === 'string' ? valeur : String(valeur)
  if (FORMULE.test(texte)) texte = `'${texte}`
  return A_PROTEGER.test(texte) ? `"${texte.replace(/"/g, '""')}"` : texte
}

const ligne = (cellules: unknown[]) => cellules.map(celluleCsv).join(SEPARATEUR)

const jourIso = (iso: string | null | undefined) => (iso ? jourCourt(iso) : '')

/**
 * Contenu complet du fichier (BOM compris).
 *
 * @example
 * new Response(exporterReponsesCsv(donnees), { headers: { 'Content-Type': 'text/csv; charset=utf-8' } })
 */
export function exporterReponsesCsv(donnees: DonneesSessionLive): string {
  const participants = donnees.participants ?? []
  const anonymes = donnees.reponses_anonymes ?? []
  const idsAnonymes = new Set([
    ...anonymes.map((a) => a.activite_id),
    ...(donnees.activites ?? []).filter((a) => a.anonyme).map((a) => a.id),
  ])

  // Activités nominatives : celles déclarées, plus celles vues dans les réponses.
  const activites = new Map<string, { ordre: number; titre: string }>()
  for (const a of donnees.activites ?? []) {
    if (!idsAnonymes.has(a.id)) activites.set(a.id, { ordre: a.ordre, titre: a.titre })
  }
  for (const p of participants) {
    for (const r of p.reponses ?? []) {
      if (!idsAnonymes.has(r.activite_id) && !activites.has(r.activite_id)) {
        activites.set(r.activite_id, { ordre: r.ordre, titre: r.titre })
      }
    }
  }
  const colonnes = [...activites.entries()].sort((a, b) => a[1].ordre - b[1].ordre)

  const lignes: string[] = [
    ligne([
      'Prénom', 'E-mail', 'Niveau', 'Réussite (%)', 'Participation (%)', 'Score', 'Rang', 'Finale envoyée le',
      ...colonnes.map(([, a]) => `${a.ordre}. ${a.titre}`),
    ]),
  ]

  for (const p of participants) {
    const parActivite = new Map<string, string[]>()
    for (const r of p.reponses ?? []) {
      if (idsAnonymes.has(r.activite_id)) continue
      const textes = parActivite.get(r.activite_id) ?? []
      const texte = enTexte(r.texte)
      if (texte) textes.push(texte)
      parActivite.set(r.activite_id, textes)
    }
    lignes.push(
      ligne([
        p.prenom, p.email, p.niveau ? niveauLabel(p.niveau) : '', p.reussite_pct, p.participation_pct, p.score, p.rang,
        jourIso(p.finale?.envoyee_le),
        ...colonnes.map(([id]) => (parActivite.get(id) ?? []).join(' | ')),
      ]),
    )
  }

  if (anonymes.length > 0) {
    lignes.push('', ligne(['Réponses anonymes (sans nom)']), ligne(['Activité', 'Réponse']))
    for (const a of [...anonymes].sort((x, y) => x.ordre - y.ordre)) {
      for (const reponse of a.reponses ?? []) lignes.push(ligne([`${a.ordre}. ${a.titre}`, enTexte(reponse)]))
    }
  }

  return BOM + lignes.join(FIN_DE_LIGNE) + FIN_DE_LIGNE
}

/** Nom de fichier sûr : `studia-live-NXUPU9-2026-11-20.csv`. */
export function nomFichierCsv(code: string, dateFormation: string | null): string {
  const propre = (v: string) => v.replace(/[^A-Za-z0-9-]/g, '').slice(0, 40)
  return ['studia-live', propre(code), propre((dateFormation ?? '').slice(0, 10))].filter(Boolean).join('-') + '.csv'
}
