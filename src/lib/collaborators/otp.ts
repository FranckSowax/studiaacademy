// ============================================
// Codes de connexion de l'équipe (pur, serveur uniquement)
// ============================================
// Code à 6 chiffres, jamais stocké en clair : HMAC-SHA256 lié à l'identifiant
// du défi. Durée courte, tentatives limitées, usage unique.

import { createHmac, randomInt, timingSafeEqual } from 'node:crypto'
import { isValidPhone, normalizePhone } from '@/lib/whatsapp'

export const OTP_LENGTH = 6
export const OTP_TTL_MS = 5 * 60_000
export const OTP_MAX_ATTEMPTS = 5

export type OtpChannel = 'whatsapp' | 'email' | 'console'

/** Code numérique à 6 chiffres, zéros initiaux compris, tiré au hasard cryptographique. */
export function generateOtpCode(): string {
  return randomInt(0, 10 ** OTP_LENGTH).toString().padStart(OTP_LENGTH, '0')
}

/**
 * Empreinte du code. Le secret reste côté serveur ; l'identifiant du défi
 * empêche de réutiliser une empreinte d'un défi à l'autre.
 */
export function hashOtp(code: string, challengeId: string, secret: string): string {
  if (!secret) throw new Error('Secret OTP manquant')
  return createHmac('sha256', secret).update(`${challengeId}:${code}`).digest('hex')
}

/** Saisie normalisée : chiffres seuls (espaces, tirets collés depuis WhatsApp retirés). */
export function normalizeOtpInput(raw: string): string | null {
  const digits = raw.replace(/\D/g, '')
  return digits.length === OTP_LENGTH ? digits : null
}

function sameHash(a: string, b: string): boolean {
  const ab = Buffer.from(a, 'hex')
  const bb = Buffer.from(b, 'hex')
  return ab.length === bb.length && ab.length > 0 && timingSafeEqual(ab, bb)
}

export interface OtpRow {
  code_hash: string
  expires_at: string
  attempts: number
  max_attempts: number
  consumed_at: string | null
}

export type OtpDecision =
  | { kind: 'ok' }
  | { kind: 'invalid'; remaining: number }
  | { kind: 'expired' }
  | { kind: 'locked' }
  | { kind: 'used' }

/**
 * Verdict d'une tentative. Une tentative fausse consomme un essai ; la
 * dernière erreur verrouille le défi.
 *
 * @example
 * evaluateOtpAttempt(row, hashOtp('123456', row.id, secret))
 * // { kind: 'ok' } ou { kind: 'invalid', remaining: 3 } …
 */
export function evaluateOtpAttempt(row: OtpRow, submittedHash: string, now: Date = new Date()): OtpDecision {
  if (row.consumed_at) return { kind: 'used' }
  if (row.attempts >= row.max_attempts) return { kind: 'locked' }
  if (new Date(row.expires_at).getTime() <= now.getTime()) return { kind: 'expired' }
  if (sameHash(row.code_hash, submittedHash)) return { kind: 'ok' }
  return { kind: 'invalid', remaining: Math.max(0, row.max_attempts - row.attempts - 1) }
}

export type LoginIdentifier = { kind: 'email'; value: string } | { kind: 'phone'; value: string }

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

/**
 * Identifiant saisi sur l'écran de connexion : email (minuscules) ou numéro
 * WhatsApp (normalisé à l'international). null si ni l'un ni l'autre.
 */
export function parseLoginIdentifier(raw: string): LoginIdentifier | null {
  const value = raw.trim()
  if (!value || value.length > 254) return null
  if (value.includes('@')) {
    const email = value.toLowerCase()
    return EMAIL_RE.test(email) ? { kind: 'email', value: email } : null
  }
  if (!/^[\d\s\-().+]+$/.test(value)) return null
  const phone = normalizePhone(value)
  return isValidPhone(phone) ? { kind: 'phone', value: phone } : null
}

/** « aw***@studia.ga » — affiché après l'envoi, sans révéler l'adresse entière. */
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!domain) return '***'
  return `${local.slice(0, Math.min(2, local.length))}***@${domain}`
}

/** « +241 ** ** ** 58 » */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  return digits.length < 4 ? '***' : `+${digits.slice(0, 3)} ••• ${digits.slice(-2)}`
}
