import { describe, expect, it } from 'vitest'
import { isPoliteness } from './politeness'
import { mergeStatus, wahaAckToStatus } from './acks'
import { isPrivateChatId, phoneFromChatId, phonesMatch } from './phones'
import {
  applyMessage,
  recomputeSummary,
  type ConversationState,
  type ThreadMessage,
} from './conversation-rules'
import { describeWahaMessage, wahaFilePath } from './waha-message'

const T0 = new Date('2026-10-31T10:00:00Z')
const at = (minutes: number) => new Date(T0.getTime() + minutes * 60_000)

function conv(overrides: Partial<ConversationState> = {}): ConversationState {
  return {
    status: 'open',
    unread_count: 0,
    name: null,
    last_message_at: null,
    last_inbound_at: null,
    last_outbound_at: null,
    ...overrides,
  }
}

// ── Politesse ───────────────────────────────
describe('isPoliteness', () => {
  it.each(['Merci 🙏', 'merci beaucoup', 'ok merci 🙏', 'Bonne journée', 'À bientôt', '👍', "Merci, d'accord", 'Thanks!'])(
    '« %s » est une politesse',
    (text) => expect(isPoliteness(text)).toBe(true),
  )

  it.each(['ok', 'oui', 'merci, et le prix ?', 'Merci, je veux 2 places', 'bonjour', '', 'd'.repeat(90)])(
    '« %s » n’est pas une politesse',
    (text) => expect(isPoliteness(text)).toBe(false),
  )
})

// ── Règle de mise à jour ────────────────────
describe('applyMessage', () => {
  it('un message de nous marque la conversation répondue et remet les non-lus à 0', () => {
    const patch = applyMessage(conv({ unread_count: 3, last_inbound_at: at(0).toISOString() }), {
      fromMe: true,
      text: 'Bonjour',
      preview: 'Bonjour',
      sentAt: at(5),
      status: 'sent',
    })
    expect(patch).toMatchObject({ status: 'replied', unread_count: 0, last_outbound_status: 'sent' })
  })

  it('une réponse sur une conversation clôturée la laisse clôturée', () => {
    const patch = applyMessage(conv({ status: 'closed' }), {
      fromMe: true,
      text: 'x',
      preview: 'x',
      sentAt: at(1),
    })
    expect(patch.status).toBeUndefined()
    expect(patch.unread_count).toBe(0)
  })

  it('une politesse après réponse ne change ni le statut ni les non-lus', () => {
    const patch = applyMessage(conv({ status: 'replied' }), {
      fromMe: false,
      text: 'merci 🙏',
      preview: 'merci 🙏',
      sentAt: at(2),
    })
    expect(patch.status).toBeUndefined()
    expect(patch.unread_count).toBeUndefined()
    expect(patch.last_message_preview).toBe('merci 🙏')
    expect(patch.last_inbound_at).toBe(at(2).toISOString())
  })

  it('un vrai message du client rouvre une conversation clôturée et ajoute un non-lu', () => {
    const patch = applyMessage(conv({ status: 'closed', unread_count: 0 }), {
      fromMe: false,
      text: 'et pour le prix ?',
      preview: 'et pour le prix ?',
      sentAt: at(3),
      senderName: 'Marie',
    })
    expect(patch).toMatchObject({ status: 'open', unread_count: 1, name: 'Marie' })
  })

  it('« ok » seul après réponse reste à traiter', () => {
    const patch = applyMessage(conv({ status: 'replied' }), {
      fromMe: false,
      text: 'ok',
      preview: 'ok',
      sentAt: at(2),
    })
    expect(patch.status).toBe('open')
  })

  it('un message livré en retard ne remplace pas l’aperçu', () => {
    const patch = applyMessage(conv({ last_message_at: at(10).toISOString() }), {
      fromMe: false,
      text: 'ancien',
      preview: 'ancien',
      sentAt: at(1),
    })
    expect(patch.last_message_preview).toBeUndefined()
  })
})

// ── Accusés ─────────────────────────────────
describe('mergeStatus', () => {
  it('« lu » puis « reçu » reste « lu »', () => expect(mergeStatus('read', 'delivered')).toBe('read'))
  it('« échec » ne remplace pas « lu »', () => expect(mergeStatus('read', 'failed')).toBe('read'))
  it('« échec » remplace « envoyé »', () => expect(mergeStatus('sent', 'failed')).toBe('failed'))
  it('progresse normalement', () => expect(mergeStatus('sent', 'read')).toBe('read'))
  it('un accusé inconnu ne change rien', () => expect(mergeStatus('delivered', null)).toBe('delivered'))
  it('convertit les accusés WAHA', () => {
    expect([-1, 0, 1, 2, 3, 4, 9].map(wahaAckToStatus)).toEqual([
      'failed', 'pending', 'sent', 'delivered', 'read', 'played', null,
    ])
  })
})

// ── Numéros ─────────────────────────────────
describe('phones', () => {
  it('même indicatif et mêmes 8 derniers chiffres', () => {
    expect(phonesMatch('+241 07 67 01 58', '24107670158')).toBe(true)
    expect(phonesMatch('2410107670158', '24107670158')).toBe(true)
  })
  it('indicatif différent → pas de rapprochement', () => {
    expect(phonesMatch('33107670158', '24107670158')).toBe(false)
  })
  it('chatId privés', () => {
    expect(isPrivateChatId('2534@lid')).toBe(true)
    expect(isPrivateChatId('24107670158@c.us')).toBe(true)
    expect(isPrivateChatId('1203@g.us')).toBe(false)
    expect(isPrivateChatId('1203@newsletter')).toBe(false)
    expect(isPrivateChatId('status@broadcast')).toBe(false)
    expect(phoneFromChatId('24107670158@c.us')).toBe('24107670158')
    expect(phoneFromChatId('2534@lid')).toBeNull()
  })
})

// ── Résumé recalculé ────────────────────────
describe('recomputeSummary', () => {
  const msg = (id: string, fromMe: boolean, text: string, minutes: number): ThreadMessage => ({
    id,
    fromMe,
    text,
    preview: text,
    sentAt: at(minutes),
    status: fromMe ? 'read' : null,
  })

  it('non-lus = messages du client depuis notre dernière réponse', () => {
    const s = recomputeSummary(
      [msg('1', false, 'Bonjour', 0), msg('2', true, 'Bonjour !', 1), msg('3', false, 'Le prix ?', 2), msg('4', false, 'Svp', 3)],
      { status: 'open', last_message_at: null },
    )
    expect(s).toMatchObject({ status: 'open', unread_count: 2, last_message_preview: 'Svp', last_outbound_status: 'read' })
  })

  it('l’ordre d’arrivée ne compte pas, seul l’horodatage', () => {
    const s = recomputeSummary([msg('3', true, 'Réponse', 5), msg('1', false, 'Question', 0)], {
      status: 'open',
      last_message_at: null,
    })
    expect(s).toMatchObject({ status: 'replied', unread_count: 0, last_message_preview: 'Réponse' })
  })

  it('une politesse finale ne rouvre pas', () => {
    const s = recomputeSummary([msg('1', false, 'Info ?', 0), msg('2', true, 'Voici', 1), msg('3', false, 'Merci 🙏', 2)], {
      status: 'replied',
      last_message_at: null,
    })
    expect(s.status).toBe('replied')
    expect(s.unread_count).toBe(0)
  })

  it('une conversation clôturée le reste si rien de nouveau', () => {
    const s = recomputeSummary([msg('1', false, 'Question', 0), msg('2', false, 'Autre', 1)], {
      status: 'closed',
      last_message_at: at(1).toISOString(),
    })
    expect(s).toMatchObject({ status: 'closed', unread_count: 0 })
  })

  it('une conversation clôturée se rouvre si l’historique révèle un message plus récent', () => {
    const s = recomputeSummary([msg('1', true, 'Fin', 0), msg('2', false, 'Encore une question', 10)], {
      status: 'closed',
      last_message_at: at(0).toISOString(),
    })
    expect(s).toMatchObject({ status: 'open', unread_count: 1 })
  })
})

// ── Interprétation WAHA ─────────────────────
describe('describeWahaMessage', () => {
  const base = {
    id: 'false_2534@lid_ABC',
    timestamp: T0.getTime() / 1000,
    from: '2534@lid',
    to: '24107670158@c.us',
    fromMe: false,
    body: 'Bonjour',
    hasMedia: false,
    ack: 1,
    _data: { type: 'chat' },
  }

  it('accepte une discussion @lid (format majoritaire)', () => {
    const r = describeWahaMessage(base)
    expect(r.kind).toBe('message')
    if (r.kind === 'message') {
      expect(r.message).toMatchObject({ chatId: '2534@lid', type: 'text', text: 'Bonjour', status: null })
      expect(r.message.sentAt.toISOString()).toBe(T0.toISOString())
    }
  })

  it('un message envoyé depuis le téléphone prend le destinataire comme discussion', () => {
    const r = describeWahaMessage({ ...base, fromMe: true, from: '24107670158@c.us', to: '2534@lid', ack: 3 })
    expect(r.kind === 'message' && r.message).toMatchObject({ chatId: '2534@lid', fromMe: true, status: 'read' })
  })

  it.each([
    ['groupe', { from: '1203@g.us' }],
    ['chaîne', { from: '1203@newsletter' }],
    ['notification chiffrement', { _data: { type: 'e2e_notification' } }],
    ['appel', { _data: { type: 'call_log' } }],
    ['message supprimé', { _data: { type: 'revoked' } }],
  ])('ignore : %s', (_label, overrides) => {
    expect(describeWahaMessage({ ...base, ...overrides }).kind).toBe('ignored')
  })

  it('photo : chemin WAHA conservé sans l’hôte interne', () => {
    const r = describeWahaMessage({
      ...base,
      body: 'ma copie',
      hasMedia: true,
      _data: { type: 'image' },
      media: { url: 'http://localhost:3000/api/files/default/abc.jpeg', mimetype: 'image/jpeg' },
    })
    expect(r.kind === 'message' && r.message).toMatchObject({
      type: 'image',
      mediaKind: 'image',
      mediaPath: '/api/files/default/abc.jpeg',
      preview: '📷 ma copie',
    })
  })

  it('vocal → audio', () => {
    const r = describeWahaMessage({ ...base, body: '', hasMedia: true, _data: { type: 'ptt' }, media: { mimetype: 'audio/ogg' } })
    expect(r.kind === 'message' && r.message).toMatchObject({ type: 'audio', preview: '🎤 Vocal' })
  })

  it('type inconnu : conservé et marqué, pour être journalisé', () => {
    const r = describeWahaMessage({ ...base, _data: { type: 'nouveau_type' } })
    expect(r.kind === 'message' && r.message).toMatchObject({ type: 'unknown', rawType: 'nouveau_type' })
  })

  it('message cité', () => {
    const r = describeWahaMessage({ ...base, replyTo: { id: 'x', body: 'question' } })
    expect(r.kind === 'message' && r.message.context).toEqual({ quoted: { id: 'x', body: 'question' } })
  })

  it('wahaFilePath refuse un chemin hors /api/files', () => {
    expect(wahaFilePath('http://evil/etc/passwd')).toBeNull()
  })
})
