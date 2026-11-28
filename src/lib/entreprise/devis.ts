import { jourLong } from '@/lib/studia-live/suivi-regles'
import { normaliser } from './analyse'
import {
  calculerDevis, CONDITIONS, NON_INCLUS, VALIDITE_DEVIS_JOURS, type DevisCalcule, type DevisSaisie, type LigneDevis, type LigneSaisie,
} from './tarifs'

/**
 * Devis entreprise : numéro, contenu figé montré au client et e-mail
 * d'envoi. Pur, partagé serveur / interface.
 *
 * Le contenu ne porte que ce qui figure sur un devis : lignes, quantités,
 * prix, remise, total hors taxes et conditions. Les alertes de la grille
 * (document interne) n'y entrent jamais.
 */

export type StatutDevis = 'brouillon' | 'envoye' | 'accepte' | 'refuse'
export const STATUTS_DEVIS: readonly StatutDevis[] = ['brouillon', 'envoye', 'accepte', 'refuse']
export const STATUT_DEVIS_LABELS: Record<StatutDevis, string> = {
  brouillon: 'Brouillon', envoye: 'Envoyé', accepte: 'Accepté', refuse: 'Refusé',
}
export const STATUT_DEVIS_STYLES: Record<StatutDevis, string> = {
  brouillon: 'bg-gray-100 text-gray-600', envoye: 'bg-blue-50 text-blue-700', accepte: 'bg-green-50 text-green-700', refuse: 'bg-red-50 text-red-600',
}

export const EMETTEUR = { nom: 'Studia Academy', lieu: 'Libreville, Gabon', email: 'contact@studia.academy' } as const
/** Le lien reste lisible plus longtemps que le devis n'est valable, pour le retrouver après signature. */
export const VALIDITE_LIEN_JOURS = 90

export interface DevisContenu {
  version: 1
  numero: string
  objet: string
  entreprise: string
  contact_nom: string | null
  emis_le: string
  valable_jusqu_au: string
  lignes: LigneDevis[]
  sous_total: number
  remise_programme_pct: number
  remise_programme: number
  total_ht: number
  participants: number | null
  par_personne: number | null
  non_inclus: string[]
  conditions: string[]
}

export const fcfa = (n: number) => `${Math.round(n).toLocaleString('fr-FR').replace(/[  ]/g, ' ')} FCFA`

/** Trois lettres pour le numéro : « Sobraga » → SOB, « BGFI Bank » → BGF, « 3M » → MXX. */
export function codeEntreprise(nom: string): string {
  const lettres = normaliser(nom).replace(/[^a-z]/g, '').toUpperCase()
  return (lettres + 'XXX').slice(0, 3)
}

/** Numéro de devis : DEV-2026-SOB-001. */
export function numeroDevis(annee: number, nomEntreprise: string, rang: number): string {
  return `DEV-${annee}-${codeEntreprise(nomEntreprise)}-${String(Math.max(1, rang)).padStart(3, '0')}`
}

const texte = (v: unknown, max: number): string | null => {
  const t = typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : ''
  return t === '' ? null : t
}
const nombre = (v: unknown): number | null => {
  const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v.replace(',', '.')) : Number.NaN
  return Number.isFinite(n) ? n : null
}

/** Ne garde de la saisie que les champs connus, typés : rien d'autre n'est conservé. */
export function nettoyerSaisie(v: unknown): DevisSaisie {
  const s = (v && typeof v === 'object' ? v : {}) as Partial<DevisSaisie>
  const lignes: LigneSaisie[] = []
  for (const l of Array.isArray(s.lignes) ? s.lignes.slice(0, 40) : []) {
    if (!l || typeof l !== 'object' || typeof l.code !== 'string') continue
    lignes.push({
      code: l.code.slice(0, 40),
      participants: nombre(l.participants),
      groupes: nombre(l.groupes),
      remise_groupes: l.remise_groupes !== false,
      quantite: nombre(l.quantite),
      theme: texte(l.theme, 120),
      duree_h: nombre(l.duree_h),
      taille_max: nombre(l.taille_max),
    })
  }
  return { lignes, participants: nombre(s.participants), remise_programme_pct: nombre(s.remise_programme_pct) }
}

/**
 * Fige un devis calculé en contenu client.
 *
 * @example
 * construireContenu({ numero: 'DEV-2026-SOB-002', objet: 'Phase 2', entreprise: 'Sobraga', contactNom: null, calcul }, Date.now())
 */
export function construireContenu(
  source: { numero: string; objet: string; entreprise: string; contactNom: string | null; calcul: DevisCalcule },
  maintenant: number,
): DevisContenu {
  const c = source.calcul
  return {
    version: 1,
    numero: source.numero,
    objet: source.objet,
    entreprise: source.entreprise,
    contact_nom: source.contactNom,
    emis_le: new Date(maintenant).toISOString(),
    valable_jusqu_au: new Date(maintenant + VALIDITE_DEVIS_JOURS * 24 * 3600 * 1000).toISOString(),
    lignes: c.lignes,
    sous_total: c.sous_total,
    remise_programme_pct: c.remise_programme_pct,
    remise_programme: c.remise_programme,
    total_ht: c.total_ht,
    participants: c.participants,
    par_personne: c.par_personne,
    non_inclus: [...NON_INCLUS],
    conditions: [...CONDITIONS, `Devis valable ${VALIDITE_DEVIS_JOURS} jours. Montants hors taxes, TVA en sus.`],
  }
}

/** Calcule et fige en une fois, à partir de la saisie nettoyée. */
export function devisDepuisSaisie(
  source: { numero: string; objet: string; entreprise: string; contactNom: string | null; saisie: DevisSaisie },
  maintenant: number,
): { contenu: DevisContenu; alertes: string[] } {
  const calcul = calculerDevis(source.saisie)
  return { contenu: construireContenu({ ...source, calcul }, maintenant), alertes: calcul.alertes }
}

/** Relit un devis conservé ; null s'il n'a pas la forme attendue. */
export function lireDevisConserve(v: unknown): DevisContenu | null {
  if (!v || typeof v !== 'object') return null
  const d = v as Partial<DevisContenu>
  if (d.version !== 1 || typeof d.numero !== 'string' || typeof d.total_ht !== 'number' || !Array.isArray(d.lignes)) return null
  return {
    ...(d as DevisContenu),
    non_inclus: Array.isArray(d.non_inclus) ? d.non_inclus : [],
    conditions: Array.isArray(d.conditions) ? d.conditions : [],
  }
}

// ---------- E-mail ----------

const ORANGE = '#e97e42'
const ENCRE = '#1f2937'
const GRIS = '#6b7280'
export const LIEN_A_VENIR = '[lien généré au moment de l’envoi]'

export interface ContenuEmailDevis {
  sujet: string
  texte: string
  html: string
}

const html = (v: string) =>
  v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')

/** E-mail au contact de l'entreprise : objet du devis, total hors taxes et lien vers la page du devis. */
export function composerEmailDevis({
  contenu,
  contactNom,
  lien,
}: {
  contenu: DevisContenu
  contactNom: string | null
  lien: string | null
}): ContenuEmailDevis {
  const nom = texte(contactNom, 120)
  const salut = nom ? `Bonjour ${nom},` : 'Bonjour,'
  const intro = `Vous trouverez ci-dessous notre devis ${contenu.numero} pour ${contenu.entreprise} : ${contenu.objet}.`
  const montant = `Montant : ${fcfa(contenu.total_ht)} hors taxes${contenu.par_personne ? `, soit ${fcfa(contenu.par_personne)} par collaborateur` : ''}.`
  const validite = `Ce devis est valable jusqu’au ${jourLong(contenu.valable_jusqu_au)}. La page se consulte sans compte et s’imprime en PDF.`
  const suite = 'Pour l’accepter ou en parler, il suffit de répondre à cet e-mail.'

  const corpsTexte = [salut, '', intro, montant, '', 'Votre devis :', lien ?? LIEN_A_VENIR, '', validite, suite, '', 'L’équipe Studia Academy', EMETTEUR.email].join('\n')

  const p = (t: string) => `<p style="margin:0 0 12px;font-size:15px;line-height:1.6;">${html(t)}</p>`
  const bouton = lien
    ? `<p style="margin:24px 0 8px;"><a href="${html(lien)}" style="display:inline-block;background:${ORANGE};color:#ffffff;` +
      `text-decoration:none;font-weight:600;padding:12px 22px;border-radius:8px;">Ouvrir le devis</a></p>` +
      `<p style="margin:0 0 16px;font-size:12px;color:${GRIS};word-break:break-all;">${html(lien)}</p>`
    : `<p style="margin:24px 0 16px;padding:12px;border:1px dashed #d1d5db;border-radius:8px;color:${GRIS};">${html(LIEN_A_VENIR)}</p>`
  const corpsHtml =
    `<!doctype html><html lang="fr"><body style="margin:0;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:${ENCRE};">` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:24px 0;"><tr><td align="center">` +
    `<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;">` +
    `<tr><td style="background:${ORANGE};padding:18px 28px;color:#ffffff;font-size:18px;font-weight:700;">Studia Academy</td></tr>` +
    `<tr><td style="padding:28px;">` +
    `<p style="margin:0 0 4px;font-size:12px;letter-spacing:.04em;text-transform:uppercase;color:${GRIS};">Devis ${html(contenu.numero)}</p>` +
    `<h1 style="margin:0 0 20px;font-size:22px;line-height:1.3;color:${ENCRE};">${html(contenu.objet)}</h1>` +
    p(salut) + p(intro) +
    `<p style="margin:16px 0;padding:14px 16px;border:1px solid #f1e3d8;border-radius:8px;font-size:15px;line-height:1.6;">${html(montant)}</p>` +
    bouton +
    `<p style="margin:0 0 12px;font-size:13px;line-height:1.6;color:${GRIS};">${html(validite)}</p>` +
    p(suite) +
    `<p style="margin:16px 0 0;font-size:15px;line-height:1.6;">L’équipe Studia Academy</p>` +
    `</td></tr></table></td></tr></table></body></html>`

  return { sujet: `Devis ${contenu.numero} — ${contenu.objet}`, texte: corpsTexte, html: corpsHtml }
}
