import { jourLong, noteSur, pct } from '@/lib/studia-live/suivi-regles'
import type { AnalyseEntreprise } from './analyse'
import { getCatalogueByRef } from './catalogue'
import type { Entreprise, IndicateursEntreprise, SessionEntreprise } from './dossier-regles'

/**
 * Bilan envoyé à la direction d'une entreprise : contenu de la page
 * publique (lien secret) et e-mail qui y mène.
 *
 * Le bilan est figé au moment de l'envoi et ne contient QUE des données
 * agrégées : sessions, moyennes, thèmes et formations retenues. Aucun
 * participant, aucune réponse, aucun e-mail n'y entre — `construireBilan`
 * ne reçoit d'ailleurs pas la liste des participants.
 */

export const VALIDITE_JOURS = 30
export const CONTACT_STUDIA = 'contact@studia.academy'

export interface BilanSession {
  titre: string
  date: string | null
  formation: string | null
  participants: number | null
  indice: number | null
  reussite: number | null
  satisfaction: number | null
}

export interface BilanTheme {
  titre: string
  taux: number
}

export interface BilanFormation {
  type: 'catalogue' | 'sur_mesure'
  titre: string
  justification: string | null
  format: string | null
  duree: string | null
  niveau: string | null
  /** Sur mesure : la formation est-elle déjà créée ? */
  disponible: boolean
}

export interface BilanEntreprise {
  version: 1
  entreprise: string
  genere_le: string
  sessions: BilanSession[]
  a_venir: { titre: string; date: string | null }[]
  indicateurs: {
    sessions: number
    participations: number
    indice: number | null
    reussite: number | null
    participation: number | null
    satisfaction: number | null
  }
  themes_a_renforcer: BilanTheme[]
  themes_maitrises: BilanTheme[]
  formations: BilanFormation[]
}

export interface PropositionRetenue {
  type: 'catalogue' | 'sur_mesure'
  catalogue_ref: string | null
  titre: string
  justification: string | null
  formation_id: string | null
}

const arrondi = (v: number | null) => (v === null ? null : Math.round(v))
const nombre = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null)

/**
 * Assemble le bilan à partir du dossier et des formations retenues.
 *
 * @example
 * const bilan = construireBilan({ entreprise, sessions, indicateurs, analyse, retenues }, Date.now())
 */
export function construireBilan(
  source: {
    entreprise: Pick<Entreprise, 'nom_entreprise'>
    sessions: SessionEntreprise[]
    indicateurs: IndicateursEntreprise
    analyse: Pick<AnalyseEntreprise, 'themes_a_renforcer' | 'themes_maitrises'>
    retenues: PropositionRetenue[]
  },
  maintenant: number,
): BilanEntreprise {
  const passees = source.sessions.filter((s) => s.etat === 'passee' && s.source === 'live')
  const theme = (t: { titre: string; taux: number }): BilanTheme => ({ titre: t.titre, taux: Math.round(t.taux) })
  return {
    version: 1,
    entreprise: source.entreprise.nom_entreprise,
    genere_le: new Date(maintenant).toISOString(),
    sessions: passees.map((s) => ({
      titre: s.titre,
      date: s.date,
      formation: s.formation,
      participants: nombre(s.participants),
      indice: nombre(s.resume.indice),
      reussite: nombre(s.resume.reussite_moy),
      satisfaction: nombre(s.resume.satisfaction),
    })),
    a_venir: source.sessions.filter((s) => s.etat === 'a_venir').map((s) => ({ titre: s.titre, date: s.date })),
    indicateurs: {
      sessions: passees.length,
      participations: source.indicateurs.participations,
      indice: arrondi(source.indicateurs.indice),
      reussite: arrondi(source.indicateurs.reussite),
      participation: arrondi(source.indicateurs.participation),
      satisfaction: source.indicateurs.satisfaction === null ? null : Math.round(source.indicateurs.satisfaction * 10) / 10,
    },
    themes_a_renforcer: source.analyse.themes_a_renforcer.slice(0, 8).map(theme),
    themes_maitrises: source.analyse.themes_maitrises.slice(0, 8).map(theme),
    formations: source.retenues.map((p) => {
      const catalogue = p.catalogue_ref ? getCatalogueByRef(p.catalogue_ref) : undefined
      return {
        type: p.type,
        titre: p.titre.replace(/^Sur mesure : /, ''),
        justification: p.justification,
        format: catalogue?.format ?? null,
        duree: catalogue?.duree ?? null,
        niveau: catalogue?.niveau ?? null,
        disponible: p.type === 'catalogue' || !!p.formation_id,
      }
    }),
  }
}

/** Relit un bilan conservé ; null s'il n'a pas la forme attendue. */
export function lireBilanConserve(v: unknown): BilanEntreprise | null {
  if (!v || typeof v !== 'object') return null
  const b = v as Partial<BilanEntreprise>
  if (b.version !== 1 || typeof b.entreprise !== 'string' || !b.indicateurs) return null
  const liste = <T>(x: unknown): T[] => (Array.isArray(x) ? (x as T[]) : [])
  return {
    ...(b as BilanEntreprise),
    sessions: liste(b.sessions),
    a_venir: liste(b.a_venir),
    themes_a_renforcer: liste(b.themes_a_renforcer),
    themes_maitrises: liste(b.themes_maitrises),
    formations: liste(b.formations),
  }
}

// ---------- E-mail ----------

const ORANGE = '#e97e42'
const ORANGE_TEXTE = '#a84d16'
const ENCRE = '#1f2937'
const GRIS = '#6b7280'
export const LIEN_A_VENIR = '[lien généré au moment de l’envoi]'

export interface ContenuEmailBilan {
  sujet: string
  texte: string
  html: string
}

const html = (v: string) =>
  v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
const uneLigne = (v: string | null | undefined, max: number) => (v ?? '').replace(/\s+/g, ' ').trim().slice(0, max)

/**
 * E-mail à la direction : sobre, aux couleurs de Studia Academy, avec
 * quatre indicateurs, le nombre de formations proposées et le lien vers
 * la page de bilan. Sans lien (aperçu), un texte de remplacement l'indique.
 */
export function composerEmailBilan({
  bilan,
  directionNom,
  lien,
  expireLe,
}: {
  bilan: BilanEntreprise
  directionNom: string | null
  lien: string | null
  expireLe: string | null
}): ContenuEmailBilan {
  const entreprise = uneLigne(bilan.entreprise, 160)
  const nom = uneLigne(directionNom, 120)
  const i = bilan.indicateurs
  const s = (n: number) => (n > 1 ? 's' : '')
  const indicateurs: [string, string][] = [
    ['Participations', String(i.participations)],
    ['Indice global', i.indice === null ? '—' : `${i.indice}/100`],
    ['Réussite moyenne', pct(i.reussite)],
    ['Satisfaction', noteSur(i.satisfaction, 5)],
  ]
  const salut = nom ? `Bonjour ${nom},` : 'Bonjour,'
  const intro = `Voici le bilan des ${i.sessions > 1 ? `${i.sessions} sessions de formation animées` : 'formations animées'} par Studia Academy pour ${entreprise}.`
  const n = bilan.formations.length
  const suite =
    n > 0
      ? `Il présente les résultats de vos équipes et ${n} formation${s(n)} que nous vous proposons pour la suite.`
      : 'Il présente les résultats de vos équipes, thème par thème.'
  const jusquAu = expireLe ? ` (jusqu’au ${jourLong(expireLe)})` : ''
  const validite = `Ce lien est personnel et valable ${VALIDITE_JOURS} jours${jusquAu}. La page se consulte sans compte et s’imprime en PDF.`

  const texte = [
    salut, '', intro, suite, '',
    ...indicateurs.map(([libelle, valeur]) => `- ${libelle} : ${valeur}`),
    '', 'Votre bilan :', lien ?? LIEN_A_VENIR, '', validite, '',
    'Nous restons à votre disposition pour en parler.', '', 'L’équipe Studia Academy', CONTACT_STUDIA,
  ].join('\n')

  const cartes = indicateurs
    .map(
      ([libelle, valeur]) =>
        `<td width="25%" style="padding:12px 6px;text-align:center;border:1px solid #f1e3d8;border-radius:8px;">` +
        `<div style="font-size:20px;font-weight:700;color:${ORANGE_TEXTE};">${html(valeur)}</div>` +
        `<div style="font-size:12px;color:${GRIS};margin-top:4px;">${html(libelle)}</div></td>`,
    )
    .join('')
  const bouton = lien
    ? `<p style="margin:24px 0 8px;"><a href="${html(lien)}" style="display:inline-block;background:${ORANGE};color:#ffffff;` +
      `text-decoration:none;font-weight:600;padding:12px 22px;border-radius:8px;">Ouvrir le bilan</a></p>` +
      `<p style="margin:0 0 16px;font-size:12px;color:${GRIS};word-break:break-all;">${html(lien)}</p>`
    : `<p style="margin:24px 0 16px;padding:12px;border:1px dashed #d1d5db;border-radius:8px;color:${GRIS};">${html(LIEN_A_VENIR)}</p>`
  const p = (t: string) => `<p style="margin:0 0 12px;font-size:15px;line-height:1.6;">${html(t)}</p>`

  const corps =
    `<!doctype html><html lang="fr"><body style="margin:0;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:${ENCRE};">` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:24px 0;"><tr><td align="center">` +
    `<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;">` +
    `<tr><td style="background:${ORANGE};padding:18px 28px;color:#ffffff;font-size:18px;font-weight:700;">Studia Academy</td></tr>` +
    `<tr><td style="padding:28px;">` +
    `<p style="margin:0 0 4px;font-size:12px;letter-spacing:.04em;text-transform:uppercase;color:${GRIS};">Bilan de formation</p>` +
    `<h1 style="margin:0 0 20px;font-size:22px;line-height:1.3;color:${ENCRE};">${html(entreprise)}</h1>` +
    p(salut) + p(intro) + p(suite) +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="6" style="margin:16px 0;"><tr>${cartes}</tr></table>` +
    bouton +
    `<p style="margin:0 0 16px;font-size:13px;line-height:1.6;color:${GRIS};">${html(validite)}</p>` +
    p('Nous restons à votre disposition pour en parler.') +
    `<p style="margin:16px 0 0;font-size:15px;line-height:1.6;">L’équipe Studia Academy</p>` +
    `</td></tr></table></td></tr></table></body></html>`

  return { sujet: `Bilan de formation — ${entreprise}`, texte, html: corps }
}
