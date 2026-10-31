// ============================================
// Détection des messages de politesse (« Merci 🙏 », « Bonne journée »)
// ============================================
// WHY: sans cette règle, chaque remerciement renvoie la conversation dans
// « À répondre » et l'équipe cesse de regarder la file.

const MAX_LENGTH = 80

/** Vocabulaire fermé (minuscules, sans accents ni apostrophes). */
const ALLOWED_WORDS = new Set([
  'merci', 'mercii', 'merciii', 'beaucoup', 'bcp', 'infiniment', 'mille', 'fois', 'encore',
  'ok', 'okay', 'oki', 'daccord', 'dac', 'super', 'parfait', 'top', 'cool', 'genial', 'nickel',
  'tres', 'bien', 'recu', 'bonne', 'bon', 'journee', 'soiree', 'nuit', 'week', 'end', 'weekend',
  'a', 'bientot', 'au', 'revoir', 'vous', 'aussi', 'de', 'rien', 'et', 'pour', 'tout', 'votre',
  'thanks', 'thank', 'you', 'thx', 'much', 'good', 'day', 'great',
])

/** Mots qui suffisent à faire d'une phrase autorisée une politesse. */
const TRIGGER_WORDS = new Set(['merci', 'mercii', 'merciii', 'thanks', 'thank', 'thx', 'journee', 'bientot'])

/** Émojis de remerciement / acquiescement. */
const THANKS_EMOJIS = ['🙏', '👍', '👌', '🤝', '😊', '🙂', '😀', '🥰', '❤', '♥', '✅', '💯', '😍', '🫶']

function normalizeWord(word: string): string {
  return word
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/['’`]/g, '')
    .toLowerCase()
}

/**
 * Indique si un message du client n'est qu'une formule de politesse.
 *
 * Règle : < 80 caractères, sans point d'interrogation, tous les mots dans
 * une liste fermée, et au moins un émoji de remerciement ou un mot
 * déclencheur. « ok » ou « oui » seuls ne sont PAS des politesses.
 *
 * @example
 * isPoliteness('Merci 🙏') // true
 * isPoliteness('ok') // false
 * isPoliteness('merci, et le prix ?') // false
 */
export function isPoliteness(text: string | null | undefined): boolean {
  if (!text) return false
  const trimmed = text.trim()
  if (!trimmed || trimmed.length >= MAX_LENGTH) return false
  if (trimmed.includes('?') || trimmed.includes('？')) return false

  const hasThanksEmoji = THANKS_EMOJIS.some((e) => trimmed.includes(e))

  // Retire émojis et ponctuation, garde les lettres (y compris accentuées) et apostrophes
  const words = trimmed
    .replace(/[^\p{L}\p{N}'’\s-]/gu, ' ')
    .split(/[\s-]+/)
    .map(normalizeWord)
    .filter(Boolean)

  if (words.some((w) => !ALLOWED_WORDS.has(w))) return false

  const hasTrigger = words.some((w) => TRIGGER_WORDS.has(w))
  if (words.length === 0) return hasThanksEmoji
  return hasTrigger || hasThanksEmoji
}
