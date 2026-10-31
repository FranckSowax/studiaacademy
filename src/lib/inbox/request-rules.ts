// ============================================
// Recherches clients : règles pures (sans base, testables)
// ============================================
// Une recherche = un besoin hors catalogue noté depuis une conversation.
// Les notes s'empilent (signées, horodatées) et ne sont jamais réécrites ;
// les photos sont plafonnées et dédoublonnées.

export const REQUEST_STATUSES = ['todo', 'searching', 'proposed', 'done', 'cancelled'] as const
export type RequestStatus = (typeof REQUEST_STATUSES)[number]

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  todo: 'À traiter',
  searching: 'En recherche',
  proposed: 'Proposition envoyée',
  done: 'Terminée',
  cancelled: 'Annulée',
}

/** Statuts encore « ouverts » (à suivre par l'équipe). */
export const OPEN_REQUEST_STATUSES: readonly RequestStatus[] = ['todo', 'searching', 'proposed']

export const MAX_REQUEST_PHOTOS = 10
export const MAX_NOTE_LENGTH = 1000
/** Garde-fou : une recherche ne grossit pas sans fin. */
export const MAX_NOTES = 200

export interface RequestNote {
  at: string
  authorId: string | null
  authorName: string
  text: string
}

export type RequestPhoto = { kind: 'upload'; path: string } | { kind: 'message'; ref: string }

const MESSAGE_REF_RE = /^[0-9a-f]{32}$/
const UPLOAD_PATH_RE = /^requests\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.(jpg|png|webp)$/

export function isRequestStatus(value: unknown): value is RequestStatus {
  return (REQUEST_STATUSES as readonly unknown[]).includes(value)
}

/**
 * Référence lisible à partir de 4 octets aléatoires.
 *
 * @example
 * makeRequestRef(new Uint8Array([0x1a, 0x2b, 0x3c, 0x4d])) // 'W-1A2B3C4D'
 */
export function makeRequestRef(bytes: Uint8Array): string {
  if (bytes.length < 4) throw new Error('4 octets requis')
  return `W-${Array.from(bytes.slice(0, 4), (b) => b.toString(16).padStart(2, '0')).join('').toUpperCase()}`
}

/** Notes stockées → notes valides (les entrées abîmées sont ignorées, jamais d'exception). */
export function parseNotes(value: unknown): RequestNote[] {
  if (!Array.isArray(value)) return []
  const notes: RequestNote[] = []
  for (const raw of value) {
    if (!raw || typeof raw !== 'object') continue
    const r = raw as Record<string, unknown>
    if (typeof r.text !== 'string' || !r.text.trim() || typeof r.at !== 'string') continue
    notes.push({
      at: r.at,
      authorId: typeof r.author_id === 'string' ? r.author_id : null,
      authorName: typeof r.author_name === 'string' && r.author_name ? r.author_name : 'Équipe',
      text: r.text,
    })
  }
  return notes
}

/** Note au format stocké (snake_case, comme les colonnes). */
export function serializeNotes(notes: RequestNote[]): Record<string, unknown>[] {
  return notes.map((n) => ({ at: n.at, author_id: n.authorId, author_name: n.authorName, text: n.text }))
}

/**
 * Ajoute une note signée À LA FIN. Retourne null si le texte est vide ou si
 * le plafond est atteint ; le tableau d'origine n'est jamais modifié.
 */
export function appendNote(
  notes: RequestNote[],
  entry: { authorId: string | null; authorName: string; text: string; at: Date },
): RequestNote[] | null {
  const text = entry.text.trim().slice(0, MAX_NOTE_LENGTH)
  if (!text || notes.length >= MAX_NOTES) return null
  return [...notes, { at: entry.at.toISOString(), authorId: entry.authorId, authorName: entry.authorName, text }]
}

export function parsePhotos(value: unknown): RequestPhoto[] {
  if (!Array.isArray(value)) return []
  const photos: RequestPhoto[] = []
  for (const raw of value) {
    if (!raw || typeof raw !== 'object') continue
    const r = raw as Record<string, unknown>
    if (r.kind === 'message' && typeof r.ref === 'string' && MESSAGE_REF_RE.test(r.ref)) {
      photos.push({ kind: 'message', ref: r.ref })
    } else if (r.kind === 'upload' && typeof r.path === 'string' && UPLOAD_PATH_RE.test(r.path)) {
      photos.push({ kind: 'upload', path: r.path })
    }
  }
  return photos.slice(0, MAX_REQUEST_PHOTOS)
}

function photoKey(p: RequestPhoto): string {
  return p.kind === 'message' ? `m:${p.ref}` : `u:${p.path}`
}

/**
 * Ajoute des photos sans doublon, dans la limite de 10. `overflow` = nombre
 * de photos refusées faute de place (l'appelant le signale, rien n'est perdu
 * en silence).
 */
export function mergePhotos(
  existing: RequestPhoto[],
  added: RequestPhoto[],
): { photos: RequestPhoto[]; added: number; overflow: number } {
  const seen = new Set(existing.map(photoKey))
  const photos = [...existing]
  let count = 0
  let overflow = 0
  for (const p of added) {
    const key = photoKey(p)
    if (seen.has(key)) continue
    if (photos.length >= MAX_REQUEST_PHOTOS) {
      overflow++
      continue
    }
    seen.add(key)
    photos.push(p)
    count++
  }
  return { photos, added: count, overflow }
}

/** Libellé de la note automatique qui trace un changement de statut. */
export function statusChangeNote(from: RequestStatus, to: RequestStatus): string {
  return `Statut : ${REQUEST_STATUS_LABELS[from]} → ${REQUEST_STATUS_LABELS[to]}`
}
