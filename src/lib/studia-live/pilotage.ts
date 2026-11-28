import { configLancement, type ConfigLancement } from './lancement'
import { signer } from './signature'

/**
 * Pilotage des sessions clôturées de Studia Live depuis l'admin d'Academy.
 *
 * Trois appels serveur → serveur, signés comme le ticket des élèves
 * (HMAC-SHA256 de `${timestamp}.${corps}`, secret STUDIA_LINK_SECRET) :
 * liste des sessions closes, détail d'une session, envoi des finales.
 *
 * Serveur uniquement : le secret ne quitte jamais ce module. Les réponses
 * contiennent des e-mails et des réponses nominatives : rien n'en est
 * journalisé (statut HTTP seul) ni transmis à un service tiers.
 */

const BASE = '/api/integrations/studia-academy/sessions'
const DELAI_LECTURE_MS = 10_000
const DELAI_FINALES_MS = 5 * 60_000
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const LIMITE_LISTE = 20
/** Une relance forcée porte sur 50 participants au plus (contrat Studia Live). */
export const RELANCE_MAX = 50

// ---------- Contrat : liste ----------

export interface SessionLiveResume {
  id: string
  code: string
  titre: string
  formation_code: string | null
  formation_label: string | null
  date_formation: string | null
  nb_participants: number | null
  nb_avec_email: number | null
  finales_envoyees: number | null
  indice: number | null
  reussite_moy: number | null
  participation_moy: number | null
  satisfaction: number | null
  gain_temps_pct: number | null
  priorites: number | null
}

export interface ListeSessionsLive {
  contrat: number
  total: number
  limite: number
  decalage: number
  sessions: SessionLiveResume[]
}

// ---------- Contrat : détail ----------

export type TypeRecommandation = 'priorite' | 'conseil' | 'atout'

export interface IndicateursLive {
  indice: number | null
  synthese: string | null
  composantes: { cle: string; libelle: string; valeur: number | null; poids: number | null }[]
  effectifs: { inscrits: number | null; actifs: number | null; evalues: number | null }
  engagement: {
    participation_moy: number | null
    reponses: number | null
    activites_jouees: number | null
    activites_total: number | null
    duree_prevue_min: number | null
  }
  acquisition: {
    reussite_moy: number | null
    nb_qcm: number | null
    repartition: {
      maitrise: number | null
      acquis: number | null
      en_cours: number | null
      a_renforcer: number | null
      non_evalue: number | null
    } | null
    dynamique: unknown
  }
  themes: { titre: string; taux: number | null; questions: { titre: string; taux: number | null; nb: number | null }[] }[]
  impact: {
    exercices: {
      titre: string
      n: number | null
      sans: number | null
      avec: number | null
      gain: number | null
      utilisable: number | null
    }[]
    gain_moyen: number | null
    minutes_par_realisation: number | null
    utilisable_pct: number | null
  }
  qualite_ia: { note_moy: number | null; nb: number | null }
  satisfaction: {
    echelles: unknown[]
    moyenne: number | null
    note_finale_moy: number | null
    nb_notes: number | null
    verbatims: string[]
  }
  recommandations: { type: TypeRecommandation; axe: string | null; texte: string }[]
}

export interface ActiviteLive {
  id: string
  ordre: number
  type: string
  titre: string
  anonyme: boolean
  nb_reponses: number | null
  taux_bonne_reponse: number | null
}

export interface ReponseParticipantLive {
  activite_id: string
  ordre: number
  type: string
  titre: string
  /** Réponse en clair, prête à afficher. */
  texte: string | null
  brut: unknown
  /** null hors QCM. */
  correct: boolean | null
  points: number | null
  temps_ms: number | null
  note_ia: number | null
}

export interface ParticipantLive {
  id: string
  prenom: string | null
  email: string | null
  rejoint_le: string | null
  score: number | null
  rang: number | null
  niveau: string | null
  reussite_pct: number | null
  participation_pct: number | null
  temps_moyen_s: number | null
  gain_pct: number | null
  note_finale: number | null
  finale: { envoyee_le: string | null; lien: string | null } | null
  academy_user_id: string | null
  reponses: ReponseParticipantLive[]
}

/** Activité anonyme : jamais rattachée à un participant. */
export interface ReponsesAnonymesLive {
  activite_id: string
  ordre: number
  type: string
  titre: string
  reponses: string[]
}

export interface DetailSessionLive {
  contrat: number
  session: {
    id: string
    code: string
    titre: string
    plateforme: string | null
    formation_code: string | null
    formation_label: string | null
    date_formation: string | null
    heure_debut: string | null
    statut: string | null
    cree_le: string | null
  }
  formateur: { email: string | null; nom: string | null } | null
  indicateurs: IndicateursLive
  activites: ActiviteLive[]
  participants: ParticipantLive[]
  reponses_anonymes: ReponsesAnonymesLive[]
  /** Adresse neuve à chaque appel, valable 30 jours : à ne jamais stocker. */
  liens: { rapport_direction: string | null; rapport_direction_expire_le: string | null }
}

/** Détail tel qu'il est conservé dans `live_sessions_suivi.donnees` : sans les liens. */
export type DonneesSessionLive = Omit<DetailSessionLive, 'liens'>

// ---------- Contrat : finales ----------

export interface BilanFinales {
  envoyes: number
  echecs: number
  sans_email: number
  deja: number
  academy: number
}

export type DemandeFinales = { tous: true } | { participantIds: string[]; forcer: boolean }

// ---------- Erreurs ----------

export type CodeErreurLive =
  | 'non_configure'
  | 'signature_invalide'
  | 'session_introuvable'
  | 'service_indisponible'
  | 'email_non_configure'
  | 'relance_forcee_ciblee_uniquement'
  | 'participants_invalides'
  | 'delai_depasse'
  | 'injoignable'
  | 'reponse_invalide'
  | 'erreur_inconnue'

export const MESSAGES_ERREUR_LIVE: Record<CodeErreurLive, string> = {
  non_configure: 'Liaison Studia Live non configurée',
  signature_invalide:
    'Studia Live a refusé la signature de l’appel. Vérifiez que le secret de liaison est identique des deux côtés et que l’horloge du serveur est à l’heure.',
  session_introuvable: 'Session introuvable dans Studia Live : elle est inconnue, pas encore clôturée ou supprimée.',
  service_indisponible: 'Studia Live est momentanément indisponible. Réessayez dans quelques minutes.',
  email_non_configure: 'L’envoi d’e-mails n’est pas configuré dans Studia Live.',
  relance_forcee_ciblee_uniquement: `Une relance porte sur une sélection de ${RELANCE_MAX} participants au plus.`,
  participants_invalides: 'La sélection de participants n’est pas reconnue par Studia Live.',
  delai_depasse: 'Studia Live n’a pas répondu à temps. Réessayez dans quelques minutes.',
  injoignable: 'Impossible de joindre Studia Live.',
  reponse_invalide: 'Réponse inattendue de Studia Live.',
  erreur_inconnue: 'Studia Live a renvoyé une erreur.',
}

export type ResultatLive<T> = { ok: true; data: T } | { ok: false; code: CodeErreurLive; message: string }

function echec(code: CodeErreurLive): { ok: false; code: CodeErreurLive; message: string } {
  return { ok: false, code, message: MESSAGES_ERREUR_LIVE[code] }
}

const CODES_CONTRAT: readonly CodeErreurLive[] = [
  'signature_invalide',
  'session_introuvable',
  'service_indisponible',
  'email_non_configure',
  'relance_forcee_ciblee_uniquement',
  'participants_invalides',
]

const PAR_STATUT: Record<number, CodeErreurLive> = {
  401: 'signature_invalide',
  404: 'session_introuvable',
  503: 'service_indisponible',
}

/** Code d'erreur du contrat : celui du corps s'il est connu, sinon celui du statut. */
async function codeErreur(reponse: Response): Promise<CodeErreurLive> {
  const corps = (await reponse.json().catch(() => null)) as Record<string, unknown> | null
  const annonce = [corps?.error, corps?.erreur, corps?.code].find((v): v is string => typeof v === 'string')
  const connu = CODES_CONTRAT.find((c) => c === annonce)
  return connu ?? PAR_STATUT[reponse.status] ?? 'erreur_inconnue'
}

// ---------- Appel signé ----------

const objet = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

/**
 * Appel signé vers Studia Live. Pour un GET le corps est vide : la
 * signature porte sur `${timestamp}.`. Ne lève jamais et ne journalise
 * que le statut HTTP.
 */
async function appelSigne<T>(
  config: ConfigLancement,
  methode: 'GET' | 'POST',
  chemin: string,
  corps: string,
  delaiMs: number,
  lire: (donnees: unknown) => T | null,
): Promise<ResultatLive<T>> {
  const timestamp = String(Math.floor(Date.now() / 1000))
  const headers: Record<string, string> = {
    'X-Studia-Timestamp': timestamp,
    'X-Studia-Signature': signer(config.secret, `${timestamp}.${corps}`),
  }
  if (methode === 'POST') headers['Content-Type'] = 'application/json'

  try {
    const reponse = await fetch(`${config.url}${chemin}`, {
      method: methode,
      headers,
      ...(methode === 'POST' ? { body: corps } : {}),
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(delaiMs),
    })
    if (reponse.status !== 200) {
      console.error(`[studia-live] pilotage : appel refusé (HTTP ${reponse.status})`)
      return echec(await codeErreur(reponse))
    }
    const donnees = lire(await reponse.json().catch(() => null))
    if (donnees === null) {
      console.error('[studia-live] pilotage : réponse hors contrat')
      return echec('reponse_invalide')
    }
    return { ok: true, data: donnees }
  } catch (e) {
    const delai = e instanceof Error && e.name === 'TimeoutError'
    console.error(`[studia-live] pilotage : ${delai ? 'délai dépassé' : 'appel impossible'}`)
    return echec(delai ? 'delai_depasse' : 'injoignable')
  }
}

// ---------- Lecture des réponses ----------

function lireListe(v: unknown): ListeSessionsLive | null {
  if (!objet(v) || !Array.isArray(v.sessions) || typeof v.total !== 'number') return null
  const sessions = v.sessions.filter(
    (s): s is SessionLiveResume =>
      objet(s) && typeof s.id === 'string' && UUID.test(s.id) && typeof s.code === 'string' && typeof s.titre === 'string',
  )
  if (sessions.length !== v.sessions.length) return null
  return { ...(v as unknown as ListeSessionsLive), sessions }
}

const liste = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : [])

function lireDetail(v: unknown): DetailSessionLive | null {
  if (!objet(v) || !objet(v.session) || !objet(v.indicateurs)) return null
  const s = v.session
  if (typeof s.id !== 'string' || !UUID.test(s.id) || typeof s.code !== 'string' || typeof s.titre !== 'string') return null
  if (!Array.isArray(v.participants)) return null
  const detail = v as unknown as DetailSessionLive
  // Les tableaux absents deviennent vides : l'affichage n'a pas à s'en méfier.
  return {
    ...detail,
    formateur: objet(v.formateur) ? detail.formateur : null,
    activites: liste<ActiviteLive>(v.activites),
    participants: liste<ParticipantLive>(v.participants).map((p) => ({ ...p, reponses: liste(p?.reponses) })),
    reponses_anonymes: liste<ReponsesAnonymesLive>(v.reponses_anonymes).map((a) => ({ ...a, reponses: liste(a?.reponses) })),
    liens: {
      rapport_direction: objet(v.liens) && typeof v.liens.rapport_direction === 'string' ? v.liens.rapport_direction : null,
      rapport_direction_expire_le:
        objet(v.liens) && typeof v.liens.rapport_direction_expire_le === 'string' ? v.liens.rapport_direction_expire_le : null,
    },
  }
}

function lireBilan(v: unknown): BilanFinales | null {
  if (!objet(v)) return null
  const n = (x: unknown) => (typeof x === 'number' && Number.isFinite(x) ? x : 0)
  if (typeof v.envoyes !== 'number') return null
  return { envoyes: n(v.envoyes), echecs: n(v.echecs), sans_email: n(v.sans_email), deja: n(v.deja), academy: n(v.academy) }
}

// ---------- API publique ----------

/** true si STUDIA_LIVE_URL et STUDIA_LINK_SECRET sont en place. */
export function liaisonLiveConfiguree(): boolean {
  return configLancement() !== null
}

/**
 * Une page de la liste des sessions clôturées, de la plus récente à la plus ancienne.
 *
 * @example
 * const r = await listerSessionsLive({ decalage: 20 })
 * if (r.ok) console.log(r.data.total)
 */
export async function listerSessionsLive(
  { limite = LIMITE_LISTE, decalage = 0 }: { limite?: number; decalage?: number } = {},
): Promise<ResultatLive<ListeSessionsLive>> {
  const config = configLancement()
  if (!config) return echec('non_configure')
  const l = Math.min(LIMITE_LISTE, Math.max(1, Math.trunc(limite) || LIMITE_LISTE))
  const d = Math.max(0, Math.trunc(decalage) || 0)
  return appelSigne(config, 'GET', `${BASE}?limite=${l}&decalage=${d}`, '', DELAI_LECTURE_MS, lireListe)
}

/**
 * Détail complet d'une session clôturée. Le lien `rapport_direction` est
 * neuf à chaque appel : le redemander juste avant de l'envoyer.
 */
export async function lireSessionLive(id: string): Promise<ResultatLive<DetailSessionLive>> {
  const config = configLancement()
  if (!config) return echec('non_configure')
  if (!UUID.test(id)) return echec('session_introuvable')
  return appelSigne(config, 'GET', `${BASE}/${id}`, '', DELAI_LECTURE_MS, lireDetail)
}

/**
 * Envoie l'e-mail « finale + bilan ». `{ tous: true }` : à tous ceux qui
 * ne l'ont pas reçu. Avec une liste : à ceux-là seulement ; `forcer`
 * relance même ceux qui l'ont déjà reçu, pour 50 participants au plus.
 * Environ 0,6 s par participant : délai de 5 minutes.
 */
export async function envoyerFinalesLive(id: string, demande: DemandeFinales): Promise<ResultatLive<BilanFinales>> {
  const config = configLancement()
  if (!config) return echec('non_configure')
  if (!UUID.test(id)) return echec('session_introuvable')

  let corps = '{}'
  if (!('tous' in demande)) {
    const ids = [...new Set(demande.participantIds)]
    if (ids.length === 0 || ids.some((p) => !UUID.test(p))) return echec('participants_invalides')
    // WHY: une relance forcée ne part jamais vers toute une session d'un coup.
    if (demande.forcer && ids.length > RELANCE_MAX) return echec('relance_forcee_ciblee_uniquement')
    corps = JSON.stringify(demande.forcer ? { participant_ids: ids, forcer: true } : { participant_ids: ids })
  }
  return appelSigne(config, 'POST', `${BASE}/${id}/finales`, corps, DELAI_FINALES_MS, lireBilan)
}

/** Retire les liens à durée limitée avant de conserver le détail. */
export function sansLiens(detail: DetailSessionLive): DonneesSessionLive {
  const reste: Partial<DetailSessionLive> = { ...detail }
  delete reste.liens
  return reste as DonneesSessionLive
}

/**
 * Le lien du rapport de formation n'est accepté que s'il mène chez Studia
 * Live (même origine que STUDIA_LIVE_URL) ou, à défaut, en https.
 */
export function lienRapportValide(lien: string | null): string | null {
  if (!lien || lien.length > 2000) return null
  try {
    const u = new URL(lien)
    const config = configLancement()
    if (config && u.origin === new URL(config.url).origin) return lien
    return u.protocol === 'https:' ? lien : null
  } catch {
    return null
  }
}
