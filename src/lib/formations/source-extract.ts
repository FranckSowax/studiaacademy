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
 * En-têtes navigateur réalistes pour maximiser la compatibilité.
 */
async function extractUrl(url: string): Promise<string> {
  let res: Response
  try {
    res = await fetch(url, {
      redirect: 'follow',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
      },
    })
  } catch {
    throw new Error("Impossible de joindre la page. Vérifiez l'URL.")
  }

  if (!res.ok) {
    throw new Error(
      `Ce site bloque l'accès automatique (code ${res.status}). Copiez le texte de l'article et utilisez l'option « Texte collé ».`
    )
  }

  const html = await res.text()
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#?[a-z0-9]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 100000)

  if (text.length < 200) {
    throw new Error(
      "Contenu trop court ou page protégée. Copiez le texte et utilisez l'option « Texte collé »."
    )
  }
  return text
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
