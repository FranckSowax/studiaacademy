// ============================================
// Variables des phrases rapides (pur, utilisable côté navigateur)
// ============================================

/**
 * Remplit {nom}, {prenom}, {numero} avec les données du client. Une valeur
 * inconnue laisse la variable visible, pour que la personne la complète
 * avant d'envoyer (jamais de « Bonjour , » silencieux).
 *
 * @example
 * fillTemplate('Bonjour {prenom} !', { name: 'Marie Nguema', phone: '+241 07…' })
 * // 'Bonjour Marie !'
 */
export function fillTemplate(text: string, contact: { name: string | null; phone: string | null }): string {
  const name = contact.name?.trim() || null
  const firstName = name ? name.split(/\s+/)[0] : null
  const values: Record<string, string | null> = {
    nom: name,
    prenom: firstName,
    numero: contact.phone?.trim() || null,
  }
  return text.replace(/\{(nom|prenom|numero)\}/g, (match, key: string) => values[key] ?? match)
}
