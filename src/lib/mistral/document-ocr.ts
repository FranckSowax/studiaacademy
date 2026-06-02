// ============================================
// OCR robuste de documents (PDF multi-pages + images)
// Découpe les gros PDF par lots, fallback Pixtral.
// ============================================

import { PDFDocument } from 'pdf-lib'
import { mistralDocumentOCR, mistralOCR } from './client'

export interface OcrFile {
  url: string // URL signée Supabase (téléchargeable)
  mime: string
  name?: string
}

// Lots de pages par appel OCR (équilibre coût/fiabilité)
const PAGES_PER_BATCH = 8
// Au-delà, on découpe systématiquement
const CHUNK_THRESHOLD_PAGES = 8

function isPdf(mime: string, name?: string): boolean {
  return mime === 'application/pdf' || (name?.toLowerCase().endsWith('.pdf') ?? false)
}

function toDataUri(bytes: Uint8Array, mime: string): string {
  const base64 = Buffer.from(bytes).toString('base64')
  return `data:${mime};base64,${base64}`
}

/**
 * Découpe un PDF en sous-PDF de PAGES_PER_BATCH pages et OCRise chaque lot.
 */
async function ocrLargePdf(bytes: Uint8Array): Promise<string> {
  const src = await PDFDocument.load(bytes, { ignoreEncryption: true })
  const total = src.getPageCount()
  const parts: string[] = []

  for (let start = 0; start < total; start += PAGES_PER_BATCH) {
    const end = Math.min(start + PAGES_PER_BATCH, total)
    const sub = await PDFDocument.create()
    const indices = Array.from({ length: end - start }, (_, k) => start + k)
    const copied = await sub.copyPages(src, indices)
    copied.forEach((p) => sub.addPage(p))
    const subBytes = await sub.save()
    const dataUri = toDataUri(subBytes, 'application/pdf')

    try {
      const md = await mistralDocumentOCR({ type: 'document_url', document_url: dataUri })
      if (md) parts.push(md)
    } catch (e) {
      console.error(`[ocr] lot pages ${start}-${end} échoué:`, e)
    }
  }

  return parts.join('\n\n').trim()
}

/**
 * OCR d'un seul fichier (PDF ou image) avec stratégie adaptée.
 */
async function ocrSingleFile(file: OcrFile): Promise<string> {
  // ── PDF ──
  if (isPdf(file.mime, file.name)) {
    // Télécharger pour connaître le nombre de pages
    const res = await fetch(file.url)
    if (!res.ok) throw new Error(`Téléchargement PDF échoué (${res.status})`)
    const bytes = new Uint8Array(await res.arrayBuffer())

    let pageCount = 0
    try {
      const doc = await PDFDocument.load(bytes, { ignoreEncryption: true })
      pageCount = doc.getPageCount()
    } catch {
      // PDF illisible par pdf-lib → tenter OCR direct via data URI
      const dataUri = toDataUri(bytes, 'application/pdf')
      return mistralDocumentOCR({ type: 'document_url', document_url: dataUri })
    }

    // Petit PDF : un seul appel (URL signée directe)
    if (pageCount <= CHUNK_THRESHOLD_PAGES) {
      try {
        return await mistralDocumentOCR({ type: 'document_url', document_url: file.url })
      } catch {
        // fallback data URI
        const dataUri = toDataUri(bytes, 'application/pdf')
        return mistralDocumentOCR({ type: 'document_url', document_url: dataUri })
      }
    }

    // Gros PDF : découpe par lots
    return ocrLargePdf(bytes)
  }

  // ── Image (manuscrit ou scan) ──
  try {
    return await mistralDocumentOCR({ type: 'image_url', image_url: file.url })
  } catch {
    // Fallback Pixtral chat vision
    return mistralOCR(
      [file.url],
      `Extrais fidèlement tout le texte de cette image (manuscrit inclus).
Conserve la structure (titres, listes, formules). Retourne uniquement le texte.`
    )
  }
}

/**
 * OCR de plusieurs fichiers, concaténés en un seul texte source.
 */
export async function ocrDocuments(files: OcrFile[]): Promise<string> {
  const parts: string[] = []
  for (let i = 0; i < files.length; i++) {
    try {
      const text = await ocrSingleFile(files[i])
      if (text) {
        parts.push(files.length > 1 ? `--- Document ${i + 1} ---\n${text}` : text)
      }
    } catch (e) {
      console.error(`[ocr] fichier ${files[i].name ?? i} échoué:`, e)
    }
  }
  return parts.join('\n\n').trim()
}
