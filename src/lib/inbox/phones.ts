// ============================================
// Rapprochement de numéros de téléphone
// ============================================
// WHY: le numéro saisi par l'équipe et le compte WhatsApp du client diffèrent
// souvent (ancien format, 0 en plus ou en moins). Un message envoyé au mauvais
// format reste « en attente » sans erreur.

const SUFFIX_LENGTH = 8
const PREFIX_LENGTH = 3

/** Ne garde que les chiffres. */
export function digitsOnly(value: string | null | undefined): string {
  return (value ?? '').replace(/\D/g, '')
}

/**
 * Deux numéros désignent-ils probablement le même compte ?
 * Règle : même indicatif (3 premiers chiffres) et mêmes 8 derniers chiffres.
 *
 * @example
 * phonesMatch('+241 07 67 01 58', '24107670158') // true
 */
export function phonesMatch(a: string | null | undefined, b: string | null | undefined): boolean {
  const da = digitsOnly(a)
  const db = digitsOnly(b)
  if (da.length < SUFFIX_LENGTH + PREFIX_LENGTH || db.length < SUFFIX_LENGTH + PREFIX_LENGTH) {
    return da !== '' && da === db
  }
  return (
    da.slice(0, PREFIX_LENGTH) === db.slice(0, PREFIX_LENGTH) &&
    da.slice(-SUFFIX_LENGTH) === db.slice(-SUFFIX_LENGTH)
  )
}

/** Partie numérique d'un identifiant WhatsApp « 241…@c.us » (null pour @lid / groupes). */
export function phoneFromChatId(chatId: string | null | undefined): string | null {
  if (!chatId || !chatId.endsWith('@c.us')) return null
  const digits = digitsOnly(chatId.slice(0, -'@c.us'.length))
  return digits || null
}

/** Discussion privée (contact) : ni groupe, ni chaîne, ni statut. */
export function isPrivateChatId(chatId: string | null | undefined): boolean {
  if (!chatId) return false
  if (chatId === 'status@broadcast') return false
  return chatId.endsWith('@c.us') || chatId.endsWith('@lid')
}
