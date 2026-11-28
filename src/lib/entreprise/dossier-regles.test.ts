import { describe, expect, it } from 'vitest'
import type { DonneesSessionLive } from '@/lib/studia-live/pilotage'
import {
  agregerSessions, comptesAEtiqueter, etatEvenement, initiales, lireEntrepriseInput, participantsEntreprise, trierSessions,
  type SessionEntreprise,
} from './dossier-regles'

const U1 = '11111111-1111-4111-8111-111111111111'
const U2 = '22222222-2222-4222-8222-222222222222'

const session = (s: Partial<SessionEntreprise>): SessionEntreprise => ({
  lien_id: 'l', source: 'live', session_id: 's', titre: 'T', code: null, formation: null, date: null, etat: 'passee',
  participants: null, resume: {}, places_total: null, supprimee_live: false, ...s,
})

const donnees = (participants: unknown[]) => ({ participants }) as unknown as DonneesSessionLive

describe('lireEntrepriseInput', () => {
  it('exige un nom', () => {
    expect(lireEntrepriseInput({ nom_entreprise: '   ' })).toEqual({ ok: false, error: 'Le nom de l’entreprise est requis.' })
    expect(lireEntrepriseInput(null).ok).toBe(false)
  })

  it('nettoie les textes et les e-mails, vide → null', () => {
    const r = lireEntrepriseInput({
      nom_entreprise: '  Sobraga   Gabon ', secteur: '', contact_email: ' RH@Sobraga.GA ', direction_email: 'dg@sobraga.ga',
      contact_phone: '+241 07 00 00 00', notes: ' ligne 1\nligne 2 ', responsable_id: U1,
    })
    expect(r).toEqual({
      ok: true,
      valeurs: {
        nom_entreprise: 'Sobraga Gabon', secteur: null, effectif_estime: null, ville: null, contact_nom: null,
        contact_phone: '+241 07 00 00 00', contact_email: 'rh@sobraga.ga', direction_email: 'dg@sobraga.ga',
        direction_nom: null, notes: 'ligne 1\nligne 2', responsable_id: U1,
      },
    })
  })

  it('refuse un e-mail, un téléphone ou un responsable invalide', () => {
    expect(lireEntrepriseInput({ nom_entreprise: 'A', contact_email: 'pas-un-email' })).toEqual({ ok: false, error: 'L’e-mail du contact n’est pas valide.' })
    expect(lireEntrepriseInput({ nom_entreprise: 'A', direction_email: 'x@y' })).toEqual({ ok: false, error: 'L’e-mail de la direction n’est pas valide.' })
    expect(lireEntrepriseInput({ nom_entreprise: 'A', contact_phone: 'appelez-moi' }).ok).toBe(false)
    expect(lireEntrepriseInput({ nom_entreprise: 'A', responsable_id: 'admin' }).ok).toBe(false)
  })

  it('ignore les champs inconnus (pas d’écriture arbitraire)', () => {
    const r = lireEntrepriseInput({ nom_entreprise: 'A', user_id: U1, id: U2, cree_par_admin: U2 } as never)
    expect(r.ok && Object.keys(r.valeurs)).not.toContain('user_id')
    expect(r.ok && Object.keys(r.valeurs)).not.toContain('id')
    expect(r.ok && Object.keys(r.valeurs)).not.toContain('cree_par_admin')
  })
})

describe('initiales', () => {
  it.each([['Sobraga', 'SO'], ['Total Gabon', 'TG'], ['  bgfi bank gabon ', 'BB'], ['', '?']])('%s → %s', (nom, attendu) => {
    expect(initiales(nom)).toBe(attendu)
  })
})

describe('sessions', () => {
  const maintenant = Date.parse('2026-11-28T12:00:00Z')

  it('un événement est à venir jusqu’à sa date', () => {
    expect(etatEvenement('2026-12-12T09:00:00Z', maintenant)).toBe('a_venir')
    expect(etatEvenement('2026-11-20T09:00:00Z', maintenant)).toBe('passee')
    expect(etatEvenement(null, maintenant)).toBe('passee')
  })

  it('trie : à venir la plus proche d’abord, puis passées de la plus récente', () => {
    const tri = trierSessions([
      { etat: 'passee' as const, date: '2026-11-06' },
      { etat: 'a_venir' as const, date: '2027-01-10' },
      { etat: 'passee' as const, date: '2026-11-20' },
      { etat: 'a_venir' as const, date: '2026-12-12' },
    ])
    expect(tri.map((s) => s.date)).toEqual(['2026-12-12', '2027-01-10', '2026-11-20', '2026-11-06'])
  })
})

describe('agregerSessions', () => {
  it('pondère les moyennes par le nombre de participants', () => {
    const i = agregerSessions([
      session({ participants: 30, resume: { indice: 60, reussite_moy: 40, satisfaction: 4, priorites: 1 } }),
      session({ participants: 10, resume: { indice: 80, reussite_moy: 80, satisfaction: null, priorites: 2 } }),
      session({ source: 'presentiel', etat: 'a_venir', participants: null, places_total: 20 }),
    ])
    expect(i.sessions_passees).toBe(2)
    expect(i.sessions_a_venir).toBe(1)
    expect(i.participations).toBe(40)
    expect(i.indice).toBe(65)
    expect(i.reussite).toBe(50)
    // Non mesurée sur la 2e session : elle ne tire pas la moyenne vers zéro.
    expect(i.satisfaction).toBe(4)
    expect(i.participation).toBeNull()
    expect(i.priorites).toBe(3)
  })

  it('sans session passée : aucun indicateur inventé', () => {
    expect(agregerSessions([])).toEqual({
      sessions_passees: 0, sessions_a_venir: 0, participations: 0, indice: null, reussite: null, participation: null,
      satisfaction: null, priorites: 0,
    })
  })
})

describe('participants', () => {
  const sessions = [
    {
      titre: 'Atelier 1', date: '2026-11-06',
      donnees: donnees([
        { id: 'a', prenom: 'Awa', email: 'Awa@Exemple.GA', academy_user_id: U1, niveau: 'en_cours', reussite_pct: 40 },
        { id: 'b', prenom: 'Jean', email: null, academy_user_id: null },
      ]),
    },
    {
      titre: 'Atelier 2', date: '2026-11-20',
      donnees: donnees([
        { id: 'c', prenom: 'Awa N.', email: 'awa@exemple.ga', academy_user_id: U1, niveau: 'acquis', reussite_pct: 70 },
        { id: 'd', prenom: 'Paul', email: 'paul@exemple.ga', academy_user_id: U2 },
        { id: 'e', prenom: 'Zoé', email: 'zoe@exemple.ga', academy_user_id: 'pas-un-uuid' },
      ]),
    },
    { titre: 'Sans détail', date: '2026-10-01', donnees: null },
  ]

  it('dédoublonne une personne présente à deux sessions, la plus récente en tête', () => {
    const p = participantsEntreprise(sessions)
    expect(p.map((x) => x.prenom)).toEqual(['Awa N.', 'Jean', 'Paul', 'Zoé'])
    const awa = p[0]
    expect(awa.email).toBe('awa@exemple.ga')
    expect(awa.academy_user_id).toBe(U1)
    expect(awa.sessions.map((s) => s.titre)).toEqual(['Atelier 2', 'Atelier 1'])
    expect(awa.sessions[0]).toMatchObject({ niveau: 'acquis', reussite_pct: 70 })
  })

  it('n’étiquette que les comptes Academy valides, une seule fois', () => {
    expect(comptesAEtiqueter(sessions).sort()).toEqual([U1, U2])
    expect(comptesAEtiqueter([{ donnees: null }])).toEqual([])
  })
})
