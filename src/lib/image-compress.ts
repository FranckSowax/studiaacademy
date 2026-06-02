'use client'

/**
 * Compresse/redimensionne une image côté client avant upload.
 * Réduit la taille (uploads plus rapides, OCR plus fiable) sans perdre
 * la lisibilité du texte manuscrit.
 *
 * - PDF et non-images : retournés tels quels.
 * - Images : redimensionnées à maxDim px max, ré-encodées en JPEG qualité 0.82.
 */
export async function compressImage(
  file: File,
  maxDim = 2200,
  quality = 0.82
): Promise<File> {
  if (!file.type.startsWith('image/')) return file

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = dataUrl
  })

  let { width, height } = img
  if (width <= maxDim && height <= maxDim && file.size < 1_500_000) {
    // Déjà raisonnable : ne pas dégrader
    return file
  }

  const scale = Math.min(1, maxDim / Math.max(width, height))
  width = Math.round(width * scale)
  height = Math.round(height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return file
  ctx.drawImage(img, 0, 0, width, height)

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', quality)
  )
  if (!blob) return file

  const newName = file.name.replace(/\.[^.]+$/, '') + '.jpg'
  return new File([blob], newName, { type: 'image/jpeg' })
}

export async function compressImages(files: File[]): Promise<File[]> {
  return Promise.all(files.map((f) => compressImage(f)))
}
