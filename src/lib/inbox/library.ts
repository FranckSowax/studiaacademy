// ============================================
// Médiathèque de la messagerie (serveur uniquement)
// ============================================
// Fichiers dans le bucket privé « inbox-media ». Le type est vérifié sur le
// CONTENU (signature binaire), pas seulement sur le type déclaré.

import { randomUUID } from 'node:crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import type { OutgoingMediaKind } from '@/lib/whatsapp'
import type { InboxIdentity } from './identity'

export const LIBRARY_BUCKET = 'inbox-media'
export const LIBRARY_MAX_BYTES = 16 * 1024 * 1024
const MAX_CAPTION = 500

const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'video/mp4': 'mp4',
  'application/pdf': 'pdf',
}

export interface LibraryItem {
  id: string
  mime: string
  kind: OutgoingMediaKind
  filename: string | null
  caption: string | null
  sizeBytes: number | null
  createdByName: string | null
  createdAt: string
  fileUrl: string
}

/** Type réel d'un fichier d'après ses premiers octets (null si non autorisé). */
export function sniffMime(bytes: Uint8Array): string | null {
  const at = (i: number) => bytes[i]
  const ascii = (start: number, len: number) => String.fromCharCode(...bytes.slice(start, start + len))
  if (bytes.length >= 3 && at(0) === 0xff && at(1) === 0xd8 && at(2) === 0xff) return 'image/jpeg'
  if (bytes.length >= 8 && ascii(1, 3) === 'PNG' && at(0) === 0x89) return 'image/png'
  if (bytes.length >= 12 && ascii(0, 4) === 'RIFF' && ascii(8, 4) === 'WEBP') return 'image/webp'
  if (bytes.length >= 12 && ascii(4, 4) === 'ftyp') return 'video/mp4'
  if (bytes.length >= 5 && ascii(0, 5) === '%PDF-') return 'application/pdf'
  return null
}

export function mediaKindForMime(mime: string): OutgoingMediaKind {
  if (mime.startsWith('image/')) return 'image'
  if (mime.startsWith('video/')) return 'video'
  return 'document'
}

function toItem(row: Record<string, unknown>): LibraryItem {
  const mime = String(row.mime)
  return {
    id: String(row.id),
    mime,
    kind: mediaKindForMime(mime),
    filename: (row.filename as string | null) ?? null,
    caption: (row.caption as string | null) ?? null,
    sizeBytes: typeof row.size_bytes === 'number' ? row.size_bytes : null,
    createdByName: (row.created_by_name as string | null) ?? null,
    createdAt: String(row.created_at),
    fileUrl: `/api/inbox/library/${row.id}/file`,
  }
}

export async function listLibrary(limit = 60): Promise<LibraryItem[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('wa_media_library')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw new Error(`médiathèque: ${error.code ?? ''}`)
  return (data ?? []).map(toItem)
}

export class LibraryUploadError extends Error {}

/** Ajoute un fichier à la médiathèque après vérification du type réel et de la taille. */
export async function addToLibrary(file: File, caption: string | null, me: InboxIdentity): Promise<LibraryItem> {
  if (file.size <= 0) throw new LibraryUploadError('Fichier vide')
  if (file.size > LIBRARY_MAX_BYTES) throw new LibraryUploadError('Fichier trop volumineux (16 Mo max)')

  const bytes = new Uint8Array(await file.arrayBuffer())
  const mime = sniffMime(bytes)
  if (!mime) throw new LibraryUploadError('Type non autorisé (JPEG, PNG, WebP, MP4 ou PDF)')

  const path = `${randomUUID()}.${EXTENSIONS[mime]}`
  const admin = createAdminClient()
  const { error: uploadError } = await admin.storage
    .from(LIBRARY_BUCKET)
    .upload(path, bytes, { contentType: mime, upsert: false })
  if (uploadError) throw new Error(`téléversement: ${uploadError.message}`)

  const { data, error } = await admin
    .from('wa_media_library')
    .insert({
      storage_path: path,
      mime,
      size_bytes: file.size,
      filename: file.name ? file.name.replace(/[^\w.\- ]+/g, '_').slice(0, 120) : null,
      caption: caption?.trim().slice(0, MAX_CAPTION) || null,
      created_by: me.id,
      created_by_name: me.name,
    })
    .select('*')
    .single()
  if (error) {
    await admin.storage.from(LIBRARY_BUCKET).remove([path])
    throw new Error(`médiathèque: ${error.code ?? ''}`)
  }
  return toItem(data)
}

export interface LibraryFile {
  bytes: Uint8Array
  mime: string
  filename: string
  caption: string | null
}

export async function readLibraryFile(id: string): Promise<LibraryFile | null> {
  const admin = createAdminClient()
  const { data: row } = await admin.from('wa_media_library').select('*').eq('id', id).maybeSingle()
  if (!row) return null
  const { data: blob, error } = await admin.storage.from(LIBRARY_BUCKET).download(String(row.storage_path))
  if (error || !blob) return null
  return {
    bytes: new Uint8Array(await blob.arrayBuffer()),
    mime: String(row.mime),
    filename: (row.filename as string | null) ?? String(row.storage_path),
    caption: (row.caption as string | null) ?? null,
  }
}
