import type { DonneesSessionLive } from './pilotage'
import { enTexte, jourLong, noteSur, pct } from './suivi-regles'

/**
 * E-mail « rapport de formation » envoyé au commanditaire : sobre, aux
 * couleurs de Studia Academy, avec la synthèse, quatre indicateurs clés
 * et le lien vers le rapport complet (valable 30 jours).
 *
 * Aucune donnée nominative de participant n'y figure. Sans lien (aperçu
 * avant envoi), un texte de remplacement l'indique : le vrai lien est
 * redemandé à Studia Live au moment de l'envoi.
 */

const ORANGE = '#e97e42'
const ORANGE_TEXTE = '#a84d16'
const ENCRE = '#1f2937'
const GRIS = '#6b7280'
export const LIEN_A_VENIR = '[lien généré au moment de l’envoi]'

export interface ContenuEmailRapport {
  sujet: string
  texte: string
  html: string
}

const html = (v: string) =>
  v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')

const uneLigne = (v: unknown, max: number) => enTexte(v).replace(/\s+/g, ' ').trim().slice(0, max)

/**
 * @example
 * const mail = composerEmailRapport({ donnees, commanditaireNom: 'Mme Obame', lien, expireLe })
 * await sendEmail({ to, subject: mail.sujet, text: mail.texte, html: mail.html })
 */
export function composerEmailRapport({
  donnees,
  commanditaireNom,
  lien,
  expireLe,
}: {
  donnees: DonneesSessionLive
  commanditaireNom: string | null
  /** Lien `rapport_direction` fraîchement reçu, ou null pour l'aperçu. */
  lien: string | null
  expireLe: string | null
}): ContenuEmailRapport {
  const i = donnees.indicateurs
  const titre = uneLigne(donnees.session.titre, 160)
  const nom = uneLigne(commanditaireNom, 120)
  const date = donnees.session.date_formation ? jourLong(donnees.session.date_formation) : null
  const synthese = uneLigne(i?.synthese, 600)
  const indice = typeof i?.indice === 'number' ? `${Math.round(i.indice)}/100` : '—'
  const indicateurs: [string, string][] = [
    ['Indice global', indice],
    ['Réussite moyenne', pct(i?.acquisition?.reussite_moy)],
    ['Participation', pct(i?.engagement?.participation_moy)],
    ['Satisfaction', noteSur(i?.satisfaction?.moyenne, 5)],
  ]
  const salut = nom ? `Bonjour ${nom},` : 'Bonjour,'
  const intro = `Voici le rapport de la formation « ${titre} »${date ? ` du ${date}` : ''}, animée par Studia Academy.`
  const jusquAu = expireLe ? ` (jusqu’au ${jourLong(expireLe)})` : ''
  const validite = `Ce lien est valable 30 jours${jusquAu}. Le rapport se consulte sans compte et s’imprime en PDF.`

  const texte = [
    salut,
    '',
    intro,
    ...(synthese ? ['', synthese] : []),
    '',
    ...indicateurs.map(([libelle, valeur]) => `- ${libelle} : ${valeur}`),
    '',
    'Rapport complet :',
    lien ?? LIEN_A_VENIR,
    '',
    validite,
    '',
    'Nous restons à votre disposition pour en parler.',
    '',
    'L’équipe Studia Academy',
    'https://studia.academy',
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
      `text-decoration:none;font-weight:600;padding:12px 22px;border-radius:8px;">Ouvrir le rapport de formation</a></p>` +
      `<p style="margin:0 0 16px;font-size:12px;color:${GRIS};word-break:break-all;">${html(lien)}</p>`
    : `<p style="margin:24px 0 16px;padding:12px;border:1px dashed #d1d5db;border-radius:8px;color:${GRIS};">${html(LIEN_A_VENIR)}</p>`

  const corps =
    `<!doctype html><html lang="fr"><body style="margin:0;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:${ENCRE};">` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:24px 0;"><tr><td align="center">` +
    `<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;">` +
    `<tr><td style="background:${ORANGE};padding:18px 28px;color:#ffffff;font-size:18px;font-weight:700;">Studia Academy</td></tr>` +
    `<tr><td style="padding:28px;">` +
    `<p style="margin:0 0 4px;font-size:12px;letter-spacing:.04em;text-transform:uppercase;color:${GRIS};">Rapport de formation</p>` +
    `<h1 style="margin:0 0 20px;font-size:22px;line-height:1.3;color:${ENCRE};">${html(titre)}</h1>` +
    `<p style="margin:0 0 12px;font-size:15px;line-height:1.6;">${html(salut)}</p>` +
    `<p style="margin:0 0 12px;font-size:15px;line-height:1.6;">${html(intro)}</p>` +
    (synthese
      ? `<p style="margin:16px 0;padding:12px 16px;border-left:3px solid ${ORANGE};background:#fdf6f1;font-size:15px;line-height:1.6;">${html(synthese)}</p>`
      : '') +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="6" style="margin:16px 0;"><tr>${cartes}</tr></table>` +
    bouton +
    `<p style="margin:0 0 16px;font-size:13px;line-height:1.6;color:${GRIS};">${html(validite)}</p>` +
    `<p style="margin:0;font-size:15px;line-height:1.6;">Nous restons à votre disposition pour en parler.</p>` +
    `<p style="margin:16px 0 0;font-size:15px;line-height:1.6;">L’équipe Studia Academy</p>` +
    `</td></tr></table></td></tr></table></body></html>`

  return { sujet: `Rapport de formation — ${titre}`, texte, html: corps }
}
