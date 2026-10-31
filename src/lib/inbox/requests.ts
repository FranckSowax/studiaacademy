// ============================================
// Recherches clients (serveur uniquement)
// ============================================
// Demandes hors catalogue notées depuis une conversation, suivies jusqu'à
// la proposition. Notes empilées et signées ; photos prises dans le fil
// (référence opaque du message) ou téléversées dans le bucket privé.

import { randomBytes, randomUUID } from 'node:crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import type { InboxIdentity } from './identity'
import { LIBRARY_BUCKET, LIBRARY_MAX_BYTES, sniffMime } from './library'
import { formatPhone } from './list'
import {
  appendNote,
  makeRequestRef,
  MAX_REQUEST_PHOTOS,
  mergePhotos,
  parseNotes,
  parsePhotos,
  REQUEST_STATUS_LABELS,
  serializeNotes,
  statusChangeNote,
  type RequestNote,
  type RequestPhoto,
  type RequestStatus,
} from './request-rules'

const LIST_LIMIT = 100
/** Écritures concurrentes : on relit et on réessaie plutôt que d'écraser. */
const WRITE_ATTEMPTS = 3
const IMAGE_EXTENSIONS: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }
const SELECT = '*, wa_conversations(name, phone)'

type Row = Record<string, unknown>

export class RequestError extends Error {
  constructor(
    message: string,
    readonly code: 'INVALID' | 'NOT_FOUND' | 'CONFLICT' = 'INVALID',
  ) {
    super(message)
    this.name = 'RequestError'
  }
}

export interface CustomerRequestView {
  id: string
  ref: string
  conversationId: string
  contactName: string | null
  contactPhone: string
  status: RequestStatus
  statusLabel: string
  notes: RequestNote[]
  photos: { url: string; source: 'upload' | 'message' }[]
  createdByName: string | null
  createdAt: string
  updatedAt: string
}

function photoUrl(requestId: string, photo: RequestPhoto, index: number): string {
  // WHY: jamais le chemin de stockage vers le navigateur — un index derrière une route contrôlée.
  return photo.kind === 'message'
    ? `/api/inbox/media/${photo.ref}`
    : `/api/inbox/requests/${requestId}/photos/${index}`
}

function toView(row: Row): CustomerRequestView {
  const id = String(row.id)
  const conv = (row.wa_conversations ?? null) as Row | null
  const status = String(row.status) as RequestStatus
  return {
    id,
    ref: String(row.ref),
    conversationId: String(row.conversation_id),
    contactName: (conv?.name as string | null) ?? null,
    contactPhone: formatPhone((conv?.phone as string | null) ?? null),
    status,
    statusLabel: REQUEST_STATUS_LABELS[status] ?? status,
    notes: parseNotes(row.notes),
    photos: parsePhotos(row.photos).map((p, i) => ({ url: photoUrl(id, p, i), source: p.kind })),
    createdByName: (row.created_by_name as string | null) ?? null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  }
}

export async function listRequests(filter: {
  conversationId?: string | null
  statuses?: readonly RequestStatus[] | null
}): Promise<CustomerRequestView[]> {
  const admin = createAdminClient()
  let query = admin.from('wa_customer_requests').select(SELECT).order('updated_at', { ascending: false }).limit(LIST_LIMIT)
  if (filter.conversationId) query = query.eq('conversation_id', filter.conversationId)
  if (filter.statuses?.length) query = query.in('status', [...filter.statuses])
  const { data, error } = await query
  if (error) throw new Error(`recherches: ${error.code ?? ''}`)
  return (data ?? []).map(toView)
}

async function loadRow(id: string): Promise<Row | null> {
  const admin = createAdminClient()
  const { data, error } = await admin.from('wa_customer_requests').select(SELECT).eq('id', id).maybeSingle()
  if (error) throw new Error(`recherches: ${error.code ?? ''}`)
  return data
}

export async function getRequest(id: string): Promise<CustomerRequestView | null> {
  const row = await loadRow(id)
  return row ? toView(row) : null
}

/**
 * Photos prises dans le fil : seules les IMAGES de CETTE conversation sont
 * acceptées (une référence d'une autre conversation est ignorée).
 */
async function photosFromMessages(conversationId: string, refs: string[]): Promise<RequestPhoto[]> {
  if (refs.length === 0) return []
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('wa_messages')
    .select('public_ref')
    .eq('conversation_id', conversationId)
    .eq('media_kind', 'image')
    .in('public_ref', refs)
  if (error) throw new Error(`messages: ${error.code ?? ''}`)
  const allowed = new Set((data ?? []).map((r) => String(r.public_ref)))
  return refs.filter((r) => allowed.has(r)).map((ref) => ({ kind: 'message', ref }))
}

/**
 * Lecture → transformation → écriture conditionnée à `updated_at` inchangé.
 * Si quelqu'un a écrit entre-temps, on relit et on recommence : aucune note
 * d'un collègue n'est écrasée.
 */
async function mutate(id: string, change: (row: Row) => Row): Promise<CustomerRequestView> {
  const admin = createAdminClient()
  for (let attempt = 0; attempt < WRITE_ATTEMPTS; attempt++) {
    const row = await loadRow(id)
    if (!row) throw new RequestError('Recherche introuvable', 'NOT_FOUND')
    const patch = change(row)
    const { data, error } = await admin
      .from('wa_customer_requests')
      .update(patch)
      .eq('id', id)
      .eq('updated_at', row.updated_at as string)
      .select(SELECT)
      .maybeSingle()
    if (error) throw new Error(`recherches: ${error.code ?? ''}`)
    if (data) return toView(data)
  }
  throw new RequestError('Recherche modifiée en même temps par un collègue, réessayez', 'CONFLICT')
}

export async function createRequest(
  me: InboxIdentity,
  input: { conversationId: string; text: string; messageRefs: string[] },
): Promise<{ request: CustomerRequestView; photoOverflow: number }> {
  const admin = createAdminClient()
  const { data: conv } = await admin.from('wa_conversations').select('id').eq('id', input.conversationId).maybeSingle()
  if (!conv) throw new RequestError('Conversation introuvable', 'NOT_FOUND')

  const notes = appendNote([], { authorId: me.id, authorName: me.name, text: input.text, at: new Date() })
  if (!notes) throw new RequestError('Décrivez la demande du client')
  const merged = mergePhotos([], await photosFromMessages(input.conversationId, input.messageRefs))

  // La référence est aléatoire : en cas (rare) de collision, on en tire une autre.
  for (let attempt = 0; attempt < WRITE_ATTEMPTS; attempt++) {
    const { data, error } = await admin
      .from('wa_customer_requests')
      .insert({
        ref: makeRequestRef(randomBytes(4)),
        conversation_id: input.conversationId,
        notes: serializeNotes(notes),
        photos: merged.photos,
        created_by: me.id,
        created_by_name: me.name,
      })
      .select(SELECT)
      .single()
    if (!error) return { request: toView(data), photoOverflow: merged.overflow }
    if (error.code !== '23505') throw new Error(`recherches: ${error.code ?? ''}`)
  }
  throw new Error('recherches: référence indisponible')
}

export async function addRequestNote(me: InboxIdentity, id: string, text: string): Promise<CustomerRequestView> {
  return mutate(id, (row) => {
    const notes = appendNote(parseNotes(row.notes), { authorId: me.id, authorName: me.name, text, at: new Date() })
    if (!notes) throw new RequestError('Note vide ou recherche complète')
    return { notes: serializeNotes(notes) }
  })
}

/** Changement de statut, tracé par une note signée automatique. */
export async function setRequestStatus(
  me: InboxIdentity,
  id: string,
  status: RequestStatus,
): Promise<CustomerRequestView> {
  return mutate(id, (row) => {
    const from = String(row.status) as RequestStatus
    if (from === status) throw new RequestError('Statut déjà appliqué')
    const current = parseNotes(row.notes)
    const notes =
      appendNote(current, { authorId: me.id, authorName: me.name, text: statusChangeNote(from, status), at: new Date() }) ??
      current
    return { status, status_changed_by_name: me.name, notes: serializeNotes(notes) }
  })
}

export async function addMessagePhotos(
  id: string,
  refs: string[],
): Promise<{ request: CustomerRequestView; added: number; overflow: number }> {
  const row = await loadRow(id)
  if (!row) throw new RequestError('Recherche introuvable', 'NOT_FOUND')
  const candidates = await photosFromMessages(String(row.conversation_id), refs)
  let added = 0
  let overflow = 0
  const request = await mutate(id, (current) => {
    const merged = mergePhotos(parsePhotos(current.photos), candidates)
    added = merged.added
    overflow = merged.overflow
    return { photos: merged.photos }
  })
  return { request, added, overflow }
}

/** Photo téléversée : type vérifié sur le contenu, images uniquement. */
export async function addUploadedPhoto(id: string, file: File): Promise<CustomerRequestView> {
  if (file.size <= 0) throw new RequestError('Fichier vide')
  if (file.size > LIBRARY_MAX_BYTES) throw new RequestError('Photo trop volumineuse (16 Mo max)')
  const bytes = new Uint8Array(await file.arrayBuffer())
  const mime = sniffMime(bytes)
  if (!mime || !IMAGE_EXTENSIONS[mime]) throw new RequestError('Photo JPEG, PNG ou WebP uniquement')

  const row = await loadRow(id)
  if (!row) throw new RequestError('Recherche introuvable', 'NOT_FOUND')
  if (parsePhotos(row.photos).length >= MAX_REQUEST_PHOTOS) throw new RequestError('10 photos au maximum')

  const path = `requests/${id}/${randomUUID()}.${IMAGE_EXTENSIONS[mime]}`
  const admin = createAdminClient()
  const { error: uploadError } = await admin.storage.from(LIBRARY_BUCKET).upload(path, bytes, { contentType: mime, upsert: false })
  if (uploadError) throw new Error(`téléversement: ${uploadError.message}`)

  try {
    return await mutate(id, (current) => {
      const merged = mergePhotos(parsePhotos(current.photos), [{ kind: 'upload', path }])
      if (merged.added === 0) throw new RequestError('10 photos au maximum')
      return { photos: merged.photos }
    })
  } catch (error) {
    await admin.storage.from(LIBRARY_BUCKET).remove([path])
    throw error
  }
}

/** Fichier d'une photo téléversée (null si l'index ne désigne pas un téléversement). */
export async function readUploadedPhoto(id: string, index: number): Promise<{ bytes: Uint8Array; mime: string } | null> {
  const row = await loadRow(id)
  const photo = row ? parsePhotos(row.photos)[index] : undefined
  if (!photo || photo.kind !== 'upload') return null
  const admin = createAdminClient()
  const { data: blob, error } = await admin.storage.from(LIBRARY_BUCKET).download(photo.path)
  if (error || !blob) return null
  return { bytes: new Uint8Array(await blob.arrayBuffer()), mime: blob.type || 'image/jpeg' }
}
