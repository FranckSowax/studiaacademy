// ============================================
// Accusés de réception — fusion monotone
// ============================================
// WHY: les accusés arrivent dans le désordre. Un « lu » arrivé avant le
// « reçu » doit rester « lu », sinon les coches clignotent.

export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'played' | 'failed'

const RANK: Record<Exclude<MessageStatus, 'failed'>, number> = {
  pending: 0,
  sent: 1,
  delivered: 2,
  read: 3,
  played: 4,
}

/**
 * Convertit l'accusé numérique WAHA (-1 erreur, 0 en attente, 1 serveur,
 * 2 appareil, 3 lu, 4 écouté) en statut. Inconnu → null.
 */
export function wahaAckToStatus(ack: unknown): MessageStatus | null {
  switch (ack) {
    case -1:
      return 'failed'
    case 0:
      return 'pending'
    case 1:
      return 'sent'
    case 2:
      return 'delivered'
    case 3:
      return 'read'
    case 4:
      return 'played'
    default:
      return null
  }
}

/**
 * Fusionne le statut connu et un nouvel accusé. Ne recule jamais.
 * Un échec ne remplace qu'un message pas encore parvenu (en attente / envoyé).
 *
 * @example
 * mergeStatus('read', 'delivered') // 'read'
 * mergeStatus('read', 'failed') // 'read'
 * mergeStatus('sent', 'failed') // 'failed'
 */
export function mergeStatus(
  current: MessageStatus | null | undefined,
  incoming: MessageStatus | null | undefined,
): MessageStatus | null {
  if (!incoming) return current ?? null
  if (!current) return incoming

  if (incoming === 'failed') {
    return current === 'pending' || current === 'sent' || current === 'failed' ? 'failed' : current
  }
  if (current === 'failed') {
    // Le message est finalement parvenu : l'information la plus récente gagne,
    // sauf un simple « en attente » qui n'apprend rien.
    return incoming === 'pending' ? current : incoming
  }
  return RANK[incoming] > RANK[current] ? incoming : current
}
