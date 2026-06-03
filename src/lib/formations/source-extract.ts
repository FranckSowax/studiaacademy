// ============================================
// Extraction de texte depuis une source multi-format
// (serveur uniquement)
// ============================================

import mammoth from 'mammoth'
import { ocrDocuments } from '@/lib/mistral/document-ocr'
import { mistralTranscribe } from '@/lib/mistral/client'
import type { SourceType } from '@/types/generation'

export interface SourceInput {
  type: SourceType
  texte?: string
  url?: string
  // Fichiers : URL signée + mime (uploadés au préalable)
  files?: { url: string; mime: string; name: string }[]
}

/**
 * Extrait le texte d'une URL (HTML → texte brut).
 */
async function extractUrl(url: string): Promise<string> {
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (StudiaBot)' } })
  if (!res.ok) throw new Error('Page inaccessible')
  const html = await res.text()
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&[a-z]+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 100000)
}

/**
 * Extrait le texte d'un .docx via mammoth.
 */
async function extractDocx(url: string): Promise<string> {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Document inaccessible')
  const buffer = Buffer.from(await res.arrayBuffer())
  const result = await mammoth.extractRawText({ buffer })
  return result.value.trim()
}

/**
 * Transcrit un fichier audio via Mistral Voxtral.
 */
async function extractAudio(url: string, name: string): Promise<string> {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Audio inaccessible')
  const bytes = new Uint8Array(await res.arrayBuffer())
  return mistralTranscribe(bytes, name)
}

/**
 * Point d'entrée : transforme une source en texte exploitable.
 */
export async function extractSource(input: SourceInput): Promise<string> {
  switch (input.type) {
    case 'texte':
      return (input.texte ?? '').trim()

    case 'url':
      if (!input.url) throw new Error('URL manquante')
      return extractUrl(input.url)

    case 'pdf': {
      // PDF + images → OCR dédié (multi-pages, manuscrit)
      const files = input.files ?? []
      return ocrDocuments(files)
    }

    case 'docx': {
      const file = input.files?.[0]
      if (!file) throw new Error('Document manquant')
      return extractDocx(file.url)
    }

    case 'audio': {
      const file = input.files?.[0]
      if (!file) throw new Error('Fichier audio manquant')
      return extractAudio(file.url, file.name)
    }

    default:
      throw new Error('Type de source non supporté')
  }
}
