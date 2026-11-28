// ============================================
// Paiement d'une inscription à une formation en ligne — règles pures (sans E/S)
// ============================================
// Deux modes : espèces sur place, ou Airtel Money avec capture d'écran.
// Dans les deux cas l'accès n'est ouvert qu'après validation par un admin.

import type { EnrollmentStatus } from '@/types/formation'

export const PAYMENT_METHODS = ['cash', 'airtel_money'] as const
export type PaymentMethod = (typeof PAYMENT_METHODS)[number]

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cash: 'Espèces sur place',
  airtel_money: 'Airtel Money',
}

/** Bucket privé Supabase des captures d'écran de paiement. */
export const PROOF_BUCKET = 'payment-proofs'
export const PROOF_MAX_BYTES = 5 * 1024 * 1024
export const PROOF_ACCEPT = 'image/jpeg,image/png,image/webp'

const PROOF_TYPES = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp' } as const
export type ProofExtension = keyof typeof PROOF_TYPES

const MAX_REFERENCE = 60
const MAX_MESSAGE = 500

export function isPaymentMethod(value: unknown): value is PaymentMethod {
  return typeof value === 'string' && (PAYMENT_METHODS as readonly string[]).includes(value)
}

/**
 * Type réel d'une image d'après ses premiers octets (jamais d'après le nom
 * ou le type annoncé par le navigateur, que l'expéditeur contrôle).
 *
 * @example
 * detectProofExtension(new Uint8Array([0xff, 0xd8, 0xff, 0xe0])) // 'jpg'
 * detectProofExtension(new TextEncoder().encode('<svg>'))        // null
 */
export function detectProofExtension(bytes: Uint8Array): ProofExtension | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'jpg'
  const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
  if (bytes.length >= 8 && png.every((b, i) => bytes[i] === b)) return 'png'
  const ascii = (from: number, to: number) => String.fromCharCode(...bytes.slice(from, to))
  if (bytes.length >= 12 && ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'webp'
  return null
}

export function proofContentType(ext: ProofExtension): string {
  return PROOF_TYPES[ext]
}

/**
 * Contrôle la capture d'écran envoyée. Retourne son extension, ou le message
 * à afficher à l'élève.
 *
 * @example
 * checkProof(bytes) // { ok: true, ext: 'png' }
 */
export function checkProof(
  bytes: Uint8Array,
): { ok: true; ext: ProofExtension } | { ok: false; error: string } {
  if (bytes.length === 0) return { ok: false, error: 'La capture d’écran est vide.' }
  if (bytes.length > PROOF_MAX_BYTES) {
    return { ok: false, error: 'La capture d’écran dépasse 5 Mo. Réduisez-la puis réessayez.' }
  }
  const ext = detectProofExtension(bytes)
  if (!ext) return { ok: false, error: 'Envoyez une image JPG, PNG ou WebP.' }
  return { ok: true, ext }
}

/**
 * Chemin de la preuve dans le bucket : un dossier par élève (c'est ce dossier
 * que la règle de lecture du bucket compare à l'identifiant du compte).
 *
 * @example
 * proofPath('u1', 'f1', 'png', 1700000000000) // 'u1/f1-1700000000000.png'
 */
export function proofPath(userId: string, formationId: string, ext: ProofExtension, now: number): string {
  return `${userId}/${formationId}-${now}.${ext}`
}

/** Référence de transaction : lettres, chiffres, points et tirets, 60 caractères au plus. */
export function cleanReference(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const cleaned = value.replace(/[^A-Za-z0-9.\-_ ]/g, '').trim().slice(0, MAX_REFERENCE)
  return cleaned || null
}

export function cleanMessage(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const cleaned = value.trim().slice(0, MAX_MESSAGE)
  return cleaned || null
}

/**
 * Une nouvelle demande est-elle possible ? Oui sans inscription ou après un
 * refus ; non si l'accès est déjà ouvert ou si une demande attend déjà.
 *
 * @example
 * submissionBlocker('active')   // 'Vous avez déjà accès à cette formation.'
 * submissionBlocker('rejected') // null
 */
export function submissionBlocker(status: EnrollmentStatus | null | undefined): string | null {
  if (status === 'active' || status === 'completed') return 'Vous avez déjà accès à cette formation.'
  if (status === 'pending') return 'Votre demande est déjà en cours de validation.'
  return null
}

/**
 * Un admin peut valider ou refuser une demande en attente, et rouvrir une
 * demande refusée. Un accès déjà ouvert ne se décide plus ici.
 */
export function canDecide(status: string | null | undefined, decision: 'active' | 'rejected'): boolean {
  if (status === 'pending') return true
  return status === 'rejected' && decision === 'active'
}

/**
 * Résumé du paiement joint à l'accusé WhatsApp et lu par l'équipe dans la messagerie.
 *
 * @example
 * paymentSummary('airtel_money', 25000, 'PP240101.1234') // 'Paiement : Airtel Money — 25 000 FCFA — réf. PP240101.1234'
 */
export function paymentSummary(method: PaymentMethod, amountFcfa: number, reference?: string | null): string {
  const amount = `${new Intl.NumberFormat('fr-FR').format(amountFcfa).replace(/ | /g, ' ')} FCFA`
  return `Paiement : ${PAYMENT_LABELS[method]} — ${amount}${reference ? ` — réf. ${reference}` : ''}`
}
