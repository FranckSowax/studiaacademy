import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { BilanView } from '@/components/entreprise/BilanView'
import { composerEmailBilan, construireBilan, lireBilanConserve } from './bilan'
import { empreinteJeton, genererJeton } from './bilan-jeton'
import type { SessionEntreprise } from './dossier-regles'

const session = (s: Partial<SessionEntreprise>): SessionEntreprise => ({
  lien_id: 'l', source: 'live', session_id: 's', titre: 'T', code: 'NXUPU9', formation: null, date: null, etat: 'passee',
  participants: null, resume: {}, places_total: null, supprimee_live: false, ...s,
})

const MAINTENANT = Date.parse('2026-11-28T12:00:00Z')

function bilan() {
  return construireBilan(
    {
      entreprise: { nom_entreprise: 'Sobraga <SA>' },
      sessions: [
        session({ titre: 'Atelier IA copilot', date: '2026-11-20', formation: 'Atelier Sobraga', participants: 38, resume: { indice: 59, reussite_moy: 45, satisfaction: 4.6 } }),
        session({ titre: 'Automatisation', date: '2026-12-12T09:00:00Z', source: 'presentiel', etat: 'a_venir', code: null, places_total: 20 }),
        session({ titre: 'Ancien événement', source: 'presentiel', etat: 'passee', code: null, participants: 12 }),
      ],
      indicateurs: {
        sessions_passees: 2, sessions_a_venir: 1, participations: 38, indice: 59.4, reussite: 44.6, participation: 52.2,
        satisfaction: 4.64, priorites: 1,
      },
      analyse: {
        themes_a_renforcer: [{ titre: 'Lire un tableau de bord', taux: 30.4, sessions: 1, domaines: ['data'] }],
        themes_maitrises: [{ titre: 'Rédiger un prompt', taux: 88, sessions: 1, domaines: ['ia_generative'] }],
      },
      retenues: [
        { type: 'catalogue', catalogue_ref: 'F4', titre: 'Data & tableaux de bord : piloter par les chiffres', justification: 'Thème à 30 %.', formation_id: null },
        { type: 'sur_mesure', catalogue_ref: null, titre: 'Sur mesure : Copilot logistique', justification: null, formation_id: null },
      ],
    },
    MAINTENANT,
  )
}

describe('construireBilan', () => {
  const b = bilan()

  it('ne garde que les sessions Studia Live passées, et liste celles à venir', () => {
    expect(b.sessions).toEqual([
      { titre: 'Atelier IA copilot', date: '2026-11-20', formation: 'Atelier Sobraga', participants: 38, indice: 59, reussite: 45, satisfaction: 4.6 },
    ])
    expect(b.a_venir).toEqual([{ titre: 'Automatisation', date: '2026-12-12T09:00:00Z' }])
  })

  it('arrondit les indicateurs', () => {
    expect(b.indicateurs).toEqual({ sessions: 1, participations: 38, indice: 59, reussite: 45, participation: 52, satisfaction: 4.6 })
    expect(b.themes_a_renforcer).toEqual([{ titre: 'Lire un tableau de bord', taux: 30 }])
  })

  it('décrit les formations retenues avec le catalogue, sans prix', () => {
    expect(b.formations).toEqual([
      {
        type: 'catalogue', titre: 'Data & tableaux de bord : piloter par les chiffres', justification: 'Thème à 30 %.',
        format: 'Hybride', duree: '12 h / 2 sem.', niveau: 'Intermédiaire', disponible: true,
      },
      { type: 'sur_mesure', titre: 'Copilot logistique', justification: null, format: null, duree: null, niveau: null, disponible: false },
    ])
    expect(JSON.stringify(b)).not.toMatch(/prix|fcfa/i)
  })

  it('ne contient aucun identifiant interne : ni code de session, ni lien, ni compte', () => {
    expect(JSON.stringify(b)).not.toMatch(/NXUPU9|lien_id|session_id|academy_user_id|email/)
  })
})

describe('lireBilanConserve', () => {
  it('relit un bilan conservé et refuse une autre forme', () => {
    expect(lireBilanConserve(JSON.parse(JSON.stringify(bilan())))).toEqual(bilan())
    expect(lireBilanConserve({ version: 2, entreprise: 'X', indicateurs: {} })).toBeNull()
    expect(lireBilanConserve(null)).toBeNull()
    expect(lireBilanConserve('texte')).toBeNull()
  })

  it('complète les listes absentes', () => {
    const lu = lireBilanConserve({ version: 1, entreprise: 'X', genere_le: '2026-11-28T12:00:00Z', indicateurs: bilan().indicateurs })
    expect(lu).toMatchObject({ sessions: [], a_venir: [], formations: [], themes_a_renforcer: [], themes_maitrises: [] })
  })
})

describe('composerEmailBilan', () => {
  const lien = 'https://www.studia.academy/bilan/abc?x=1&y=2'
  const mail = composerEmailBilan({ bilan: bilan(), directionNom: 'Mme <Obame>', lien, expireLe: '2026-12-28T12:00:00Z' })

  it('contient les indicateurs, le lien et son expiration', () => {
    expect(mail.sujet).toBe('Bilan de formation — Sobraga <SA>')
    for (const attendu of ['Bonjour Mme <Obame>,', '- Participations : 38', '59/100', '45 %', '4,6/5', lien, '30 jours', '28 décembre 2026', '2 formations']) {
      expect(mail.texte).toContain(attendu)
    }
  })

  it('échappe le HTML', () => {
    expect(mail.html).toContain('Sobraga &lt;SA&gt;')
    expect(mail.html).toContain('Mme &lt;Obame&gt;')
    expect(mail.html).toContain('href="https://www.studia.academy/bilan/abc?x=1&amp;y=2"')
    expect(mail.html).not.toContain('<SA>')
  })

  it('aperçu sans lien : le dit clairement', () => {
    const apercu = composerEmailBilan({ bilan: bilan(), directionNom: null, lien: null, expireLe: null })
    expect(apercu.texte).toContain('Bonjour,')
    expect(apercu.texte).toContain('[lien généré au moment de l’envoi]')
    expect(apercu.html).not.toContain('href=')
  })
})

describe('jeton du lien', () => {
  it('génère des jetons distincts de 43 caractères', () => {
    const a = genererJeton()
    const b = genererJeton()
    expect(a).toMatch(/^[A-Za-z0-9_-]{43}$/)
    expect(a).not.toBe(b)
  })

  it('ne conserve qu’une empreinte, et refuse un jeton mal formé', () => {
    const jeton = genererJeton()
    const empreinte = empreinteJeton(jeton)
    expect(empreinte).toMatch(/^[0-9a-f]{64}$/)
    expect(empreinte).not.toContain(jeton)
    expect(empreinteJeton(jeton)).toBe(empreinte)
    for (const mauvais of ['', 'court', `${jeton}x`, '../../admin', null, 42]) expect(empreinteJeton(mauvais)).toBeNull()
  })
})

describe('BilanView', () => {
  it('rend la page sans erreur, avec les sections attendues', () => {
    const page = renderToStaticMarkup(createElement(BilanView, { bilan: bilan(), expireLe: '2026-12-28T12:00:00Z' }))
    for (const attendu of [
      'Sobraga &lt;SA&gt;', 'Les résultats de vos équipes', 'Sessions animées', 'Atelier IA copilot', 'Acquis par thème',
      'Lire un tableau de bord', 'Les formations que nous vous proposons', 'Copilot logistique', 'en cours de préparation',
      'Prochaines sessions', 'contact@studia.academy', '28 décembre 2026',
    ]) {
      expect(page).toContain(attendu)
    }
  })

  it('rend un bilan minimal sans formation ni thème', () => {
    const minimal = lireBilanConserve({ version: 1, entreprise: 'X', genere_le: '2026-11-28T12:00:00Z', indicateurs: bilan().indicateurs })
    if (!minimal) throw new Error('bilan attendu')
    const page = renderToStaticMarkup(createElement(BilanView, { bilan: minimal }))
    expect(page).toContain('Les résultats de vos équipes')
    expect(page).not.toContain('Les formations que nous vous proposons')
  })
})
