import { describe, expect, it } from 'vitest'
import { BOM, celluleCsv, exporterReponsesCsv, nomFichierCsv } from './export-csv'
import { composerEmailRapport } from './email-rapport'
import type { DonneesSessionLive } from './pilotage'
import { detailARecharger, emailValide, enTexte, groupesVerbatims } from './suivi-regles'

const QCM = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const LIBRE = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
const NUAGE = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'

function donnees(): DonneesSessionLive {
  return {
    contrat: 1,
    session: { id: 's', code: 'NXUPU9', titre: 'Atelier IA', date_formation: '2026-11-20' },
    formateur: null,
    indicateurs: {
      indice: 59,
      synthese: 'Une session <solide> & engagée.',
      acquisition: { reussite_moy: 45 },
      engagement: { participation_moy: 52 },
      satisfaction: { moyenne: 4.6, verbatims: [] },
      recommandations: [],
    },
    activites: [
      { id: LIBRE, ordre: 2, type: 'ouverte', titre: 'Vos attentes ; vos "freins"', anonyme: false, nb_reponses: 2, taux_bonne_reponse: null },
      { id: QCM, ordre: 1, type: 'qcm', titre: 'Quiz', anonyme: false, nb_reponses: 2, taux_bonne_reponse: 50 },
      { id: NUAGE, ordre: 3, type: 'nuage', titre: 'Un mot', anonyme: true, nb_reponses: 2, taux_bonne_reponse: null },
    ],
    participants: [
      {
        id: 'p1', prenom: 'Awa', email: 'awa@exemple.ga', niveau: 'acquis', reussite_pct: 62.5, participation_pct: 80, score: 1200, rang: 1,
        finale: { envoyee_le: '2026-11-21T09:00:00Z', lien: 'https://live.test/f/1' },
        reponses: [
          { activite_id: QCM, ordre: 1, titre: 'Quiz', texte: 'B — juste' },
          { activite_id: LIBRE, ordre: 2, titre: 'Vos attentes', texte: 'Gagner du temps; dire "non"\nà la routine' },
          { activite_id: NUAGE, ordre: 3, titre: 'Un mot', texte: 'ne doit pas sortir' },
        ],
      },
      {
        id: 'p2', prenom: '=HYPERLINK("http://x")', email: null, niveau: null, reussite_pct: null, participation_pct: 10, score: 0, rang: 2,
        finale: null,
        reponses: [{ activite_id: LIBRE, ordre: 2, titre: 'Vos attentes', texte: '-1+cmd' }],
      },
    ],
    reponses_anonymes: [{ activite_id: NUAGE, ordre: 3, type: 'nuage', titre: 'Un mot', reponses: ['utile', 'rapide; "clair"'] }],
  } as unknown as DonneesSessionLive
}

describe('celluleCsv', () => {
  it('laisse un texte simple tel quel', () => expect(celluleCsv('Awa')).toBe('Awa'))
  it('met entre guillemets une cellule qui contient « ; »', () => expect(celluleCsv('a;b')).toBe('"a;b"'))
  it('double les guillemets', () => expect(celluleCsv('dire "non"')).toBe('"dire ""non"""'))
  it('garde un retour à la ligne dans la cellule', () => expect(celluleCsv('a\nb')).toBe('"a\nb"'))
  it('écrit les nombres avec une virgule décimale', () => expect(celluleCsv(62.5)).toBe('62,5'))
  it('rend vide null, undefined et NaN', () => {
    expect([celluleCsv(null), celluleCsv(undefined), celluleCsv(Number.NaN)]).toEqual(['', '', ''])
  })
  it('neutralise les formules Excel', () => {
    expect(celluleCsv('=1+1')).toBe("'=1+1")
    expect(celluleCsv('@SUM(A1)')).toBe("'@SUM(A1)")
    expect(celluleCsv('=A1;"x"')).toBe('"\'=A1;""x"""')
  })
})

describe('exporterReponsesCsv', () => {
  const csv = exporterReponsesCsv(donnees())
  const lignes = csv.slice(1).split('\r\n')

  it('commence par le BOM UTF-8 et sépare par « ; » en CRLF', () => {
    expect(csv.startsWith(BOM)).toBe(true)
    expect(csv.endsWith('\r\n')).toBe(true)
    expect(lignes[0].startsWith('Prénom;E-mail;Niveau;Réussite (%);Participation (%);Score;Rang;Finale envoyée le;')).toBe(true)
  })

  it('une colonne par activité nominative, dans l’ordre, titres échappés', () => {
    expect(lignes[0].endsWith(';1. Quiz;"2. Vos attentes ; vos ""freins"""')).toBe(true)
    expect(lignes[0]).not.toContain('Un mot')
  })

  it('une ligne par participant, réponses échappées', () => {
    expect(csv).toContain('Awa;awa@exemple.ga;Acquis;62,5;80;1200;1;21/11/2026;B — juste;"Gagner du temps; dire ""non""\nà la routine"')
    expect(csv).toContain(`"'=HYPERLINK(""http://x"")";;;;10;0;2;;;'-1+cmd`)
  })

  it('les réponses anonymes sont en bas, sans nom, et jamais sur la ligne d’un participant', () => {
    const debut = lignes.indexOf('Réponses anonymes (sans nom)')
    expect(debut).toBeGreaterThan(2)
    expect(lignes[debut - 1]).toBe('')
    expect(lignes.slice(debut + 1, debut + 4)).toEqual(['Activité;Réponse', '3. Un mot;utile', '3. Un mot;"rapide; ""clair"""'])
    expect(csv).not.toContain('ne doit pas sortir')
    expect(lignes.slice(debut).join('\n')).not.toMatch(/Awa|awa@/)
  })

  it('n’exporte jamais le lien de la finale', () => expect(csv).not.toContain('live.test'))

  it('sans activité anonyme, pas de section en bas', () => {
    const d = donnees()
    d.reponses_anonymes = []
    expect(exporterReponsesCsv(d)).not.toContain('Réponses anonymes')
  })
})

describe('nomFichierCsv', () => {
  it('compose un nom sûr', () => {
    expect(nomFichierCsv('NXUPU9', '2026-11-20')).toBe('studia-live-NXUPU9-2026-11-20.csv')
    expect(nomFichierCsv('../x"y', null)).toBe('studia-live-xy.csv')
  })
})

describe('composerEmailRapport', () => {
  const lien = 'https://live.test/rapport/abc?t=1&u=2'
  const mail = composerEmailRapport({
    donnees: donnees(), commanditaireNom: 'Mme <Obame>', lien, expireLe: '2026-12-28T10:00:00Z',
  })

  it('contient la synthèse, quatre indicateurs, le lien et son expiration', () => {
    expect(mail.sujet).toBe('Rapport de formation — Atelier IA')
    for (const attendu of ['59/100', '45 %', '52 %', '4,6/5', lien, '30 jours', '28 décembre 2026', 'Bonjour Mme <Obame>,']) {
      expect(mail.texte).toContain(attendu)
    }
  })

  it('échappe le HTML et ne cite aucun participant', () => {
    expect(mail.html).toContain('Mme &lt;Obame&gt;')
    expect(mail.html).toContain('Une session &lt;solide&gt; &amp; engagée.')
    expect(mail.html).toContain('href="https://live.test/rapport/abc?t=1&amp;u=2"')
    expect(mail.html + mail.texte).not.toMatch(/Awa|awa@exemple/)
  })

  it('aperçu sans lien : le dit clairement', () => {
    const apercu = composerEmailRapport({ donnees: donnees(), commanditaireNom: null, lien: null, expireLe: null })
    expect(apercu.texte).toContain('Bonjour,')
    expect(apercu.texte).toContain('[lien généré au moment de l’envoi]')
    expect(apercu.html).not.toContain('href=')
  })
})

describe('formes inattendues reçues de Studia Live', () => {
  it('lit les commentaires groupés par question `{ titre, textes }`', () => {
    expect(
      groupesVerbatims([
        { titre: 'Ce que vous retenez', textes: ['Très concret', '', 'À refaire'] },
        { titre: 'Vide', textes: [] },
        'Commentaire isolé',
        null,
      ]),
    ).toEqual([
      { titre: 'Ce que vous retenez', textes: ['Très concret', 'À refaire'] },
      { titre: null, textes: ['Commentaire isolé'] },
    ])
    expect(groupesVerbatims(undefined)).toEqual([])
    expect(groupesVerbatims('texte')).toEqual([])
  })

  it('enTexte ne renvoie jamais un objet', () => {
    expect(enTexte('a')).toBe('a')
    expect(enTexte(4.5)).toBe('4.5')
    expect(enTexte(null)).toBe('')
    expect(enTexte({ texte: 'réponse' })).toBe('réponse')
    expect(enTexte({ titre: 'T', textes: ['x'] })).toBe('')
    expect(enTexte(['mot', { label: 'autre' }])).toBe('mot · autre')
  })

  it('le CSV et l’e-mail tolèrent un texte reçu sous forme d’objet', () => {
    const d = donnees()
    ;(d.participants[0].reponses[0] as { texte: unknown }).texte = { texte: 'B — juste' }
    ;(d.reponses_anonymes[0].reponses as unknown[])[0] = { texte: 'utile' }
    ;(d.indicateurs as { synthese: unknown }).synthese = { titre: 'x', textes: [] }
    const csv = exporterReponsesCsv(d)
    expect(csv).toContain(';B — juste;')
    expect(csv).toContain('3. Un mot;utile')
    expect(csv).not.toContain('[object Object]')
    expect(() => composerEmailRapport({ donnees: d, commanditaireNom: null, lien: null, expireLe: null })).not.toThrow()
  })
})

describe('règles de suivi', () => {
  it('recharge le détail jamais lu ou vieux de plus de 24 h', () => {
    const t = Date.parse('2026-11-28T10:00:00Z')
    expect(detailARecharger(null, t)).toBe(true)
    expect(detailARecharger('2026-11-27T09:59:00Z', t)).toBe(true)
    expect(detailARecharger('2026-11-27T10:01:00Z', t)).toBe(false)
  })

  it('valide et nettoie l’e-mail du commanditaire', () => {
    expect(emailValide('  Direction@Sobraga.GA ')).toBe('direction@sobraga.ga')
    expect(emailValide('a@b')).toBeNull()
    expect(emailValide('a b@c.fr')).toBeNull()
    expect(emailValide(42)).toBeNull()
  })
})
