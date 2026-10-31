// ============================================
// Liste des conversations : filtres, tri, recherche, mise en forme (pur)
// ============================================
// Partagé serveur / interface.

import { getAppConfig } from '@/lib/config/app-config'

export const INBOX_FILTERS = ['to_reply', 'mine', 'pinned', 'hot', 'all', 'closed'] as const
export type InboxFilter = (typeof INBOX_FILTERS)[number]

export const FILTER_LABELS: Record<InboxFilter, string> = {
  to_reply: 'À répondre',
  mine: 'Les miennes',
  pinned: '📌 Épinglées',
  hot: '🔥 Chauds',
  all: 'Toutes',
  closed: 'Terminées',
}

/** Seuil d'intention d'achat pour le filtre « Chauds ». */
export const HOT_INTENT_THRESHOLD = 70
/** Stade d'achat « prêt à acheter » (taxonomie de qualification). */
export const READY_TO_BUY_STAGE = 'ready_to_buy'

export function parseFilter(value: string | null | undefined): InboxFilter {
  return (INBOX_FILTERS as readonly string[]).includes(value ?? '') ? (value as InboxFilter) : 'to_reply'
}

/**
 * Met les conversations épinglées en tête, en conservant l'ordre par date
 * à l'intérieur de chaque groupe (tri stable).
 */
export function orderWithPins<T extends { id: string }>(rows: T[], pins: string[]): T[] {
  const pinned = new Set(pins)
  return [...rows.filter((r) => pinned.has(r.id)), ...rows.filter((r) => !pinned.has(r.id))]
}

/**
 * Recherche : texte nettoyé (caractères de syntaxe PostgREST retirés) et
 * chiffres seuls (le numéro est comparé sans sa mise en forme).
 */
export function normalizeSearch(raw: string | null | undefined): { text: string; digits: string } | null {
  const text = (raw ?? '').replace(/[,()*%\\:"']/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60)
  if (!text) return null
  const digits = text.replace(/\D/g, '')
  return { text, digits: digits.length >= 3 ? digits : '' }
}

/**
 * Numéro lisible : « +241 07 67 01 58 ». Indicatif lu dans la configuration.
 */
export function formatPhone(phone: string | null | undefined): string {
  const digits = (phone ?? '').replace(/\D/g, '')
  if (!digits) return ''
  const { dialCode } = getAppConfig().country
  if (digits.startsWith(dialCode)) {
    const local = digits.slice(dialCode.length)
    return `+${dialCode} ${local.replace(/(\d{2})(?=\d)/g, '$1 ').trim()}`
  }
  return `+${digits}`
}

/**
 * Heure relative : « à l'instant », « 12 min », « 14:05 » (aujourd'hui),
 * « hier », « 3 oct. ». Fuseau et langue lus dans la configuration.
 */
export function formatRelativeTime(iso: string | null | undefined, now: Date = new Date()): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const { locale, timezone } = getAppConfig().country
  const diffMin = Math.floor((now.getTime() - date.getTime()) / 60_000)
  if (diffMin < 1) return "à l'instant"
  if (diffMin < 60) return `${diffMin} min`

  const day = (d: Date) => d.toLocaleDateString('en-CA', { timeZone: timezone })
  if (day(date) === day(now)) {
    return date.toLocaleTimeString(locale, { timeZone: timezone, hour: '2-digit', minute: '2-digit' })
  }
  const yesterday = new Date(now.getTime() - 86_400_000)
  if (day(date) === day(yesterday)) return 'hier'
  return date.toLocaleDateString(locale, { timeZone: timezone, day: 'numeric', month: 'short' })
}

/** Initiales pour l'avatar. */
export function initials(name: string | null | undefined, phone?: string | null): string {
  const n = (name ?? '').trim()
  if (n) {
    const parts = n.split(/\s+/).filter(Boolean)
    return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?'
  }
  const d = (phone ?? '').replace(/\D/g, '')
  return d ? d.slice(-2) : '?'
}
