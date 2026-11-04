import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getInboxIdentity } from '@/lib/inbox/identity'
import { getPins } from '@/lib/inbox/settings'
import {
  HOT_INTENT_THRESHOLD,
  READY_TO_BUY_STAGE,
  normalizeSearch,
  orderWithPins,
  parseFilter,
} from '@/lib/inbox/list'
import { toListItem, type InboxCounts } from '@/lib/inbox/dto'

export const dynamic = 'force-dynamic'

const LIST_LIMIT = 100
const MIGRATION_MISSING = 'Migration 20261031120000_wa_inbox non appliquée'
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
/** Conversations récentes examinées pour le filtre « répondu par ». */
const BY_SCAN_LIMIT = 1000

/**
 * Liste des conversations de la messagerie.
 * - GET ?filter=to_reply|mine|pinned|hot|all|closed
 * - GET ?only=counts : compteurs seuls (pastille du menu), sans charger la liste
 * - POST { filter, q, by } : même liste avec recherche — la recherche peut
 *   contenir un nom ou un numéro, elle ne passe donc jamais par l'URL.
 *   `by` (uuid de compte) : seulement les conversations où ce collaborateur
 *   a répondu depuis la messagerie.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  return listConversations(params.get('filter'), null, params.get('only') === 'counts', null)
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { filter?: unknown; q?: unknown; by?: unknown } | null
  return listConversations(
    typeof body?.filter === 'string' ? body.filter : null,
    typeof body?.q === 'string' ? body.q : null,
    false,
    typeof body?.by === 'string' && UUID_RE.test(body.by) ? body.by : null,
  )
}

async function listConversations(filterRaw: string | null, q: string | null, onlyCounts: boolean, by: string | null) {
  const me = await getInboxIdentity()
  if (!me) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const admin = createAdminClient()
  const pins = await getPins(me)

  const counts = async (): Promise<InboxCounts | null> => {
    const [toReply, mine] = await Promise.all([
      admin.from('wa_conversations').select('id', { count: 'exact', head: true }).eq('status', 'open'),
      admin
        .from('wa_conversations')
        .select('id', { count: 'exact', head: true })
        .eq('assigned_to', me.id)
        .neq('status', 'closed'),
    ])
    if (toReply.error || mine.error) return null
    return { toReply: toReply.count ?? 0, mine: mine.count ?? 0, pinned: pins.length }
  }

  if (onlyCounts) {
    const c = await counts()
    if (!c) return NextResponse.json({ error: MIGRATION_MISSING }, { status: 503 })
    return NextResponse.json({ counts: c })
  }

  const filter = parseFilter(filterRaw)
  let query = admin.from('wa_conversations').select('*').limit(LIST_LIMIT)

  switch (filter) {
    case 'to_reply':
      query = query.eq('status', 'open')
      break
    case 'mine':
      query = query.eq('assigned_to', me.id).neq('status', 'closed')
      break
    case 'pinned':
      if (pins.length === 0) {
        return NextResponse.json({ items: [], counts: await counts(), me: { id: me.id, name: me.name } })
      }
      query = query.in('id', pins)
      break
    case 'hot':
      query = query
        .neq('status', 'closed')
        .or(`purchase_stage.eq.${READY_TO_BUY_STAGE},purchase_intent_score.gte.${HOT_INTENT_THRESHOLD}`)
      break
    case 'all':
      query = query.neq('status', 'closed')
      break
    case 'closed':
      query = query.eq('status', 'closed')
      break
  }

  if (by) {
    const { data: sent } = await admin
      .from('wa_messages')
      .select('conversation_id')
      .eq('sent_by', by)
      .order('sent_at', { ascending: false })
      .limit(BY_SCAN_LIMIT)
    const byIds = [...new Set((sent ?? []).map((m) => m.conversation_id as string))]
    if (byIds.length === 0) {
      return NextResponse.json({ items: [], counts: await counts(), me: { id: me.id, name: me.name } })
    }
    query = query.in('id', byIds)
  }

  const search = normalizeSearch(q)
  if (search) {
    // Extrait de message : on cherche aussi dans le texte des messages.
    const { data: hits } = await admin
      .from('wa_messages')
      .select('conversation_id')
      .ilike('text', `%${search.text}%`)
      .limit(200)
    const ids = [...new Set((hits ?? []).map((h) => h.conversation_id as string))]
    const clauses = [`name.ilike.%${search.text}%`, `last_message_preview.ilike.%${search.text}%`]
    if (search.digits) clauses.push(`phone.ilike.%${search.digits}%`)
    if (ids.length > 0) clauses.push(`id.in.(${ids.join(',')})`)
    query = query.or(clauses.join(','))
  }

  query =
    filter === 'hot'
      ? query
          .order('purchase_intent_score', { ascending: false, nullsFirst: false })
          .order('last_message_at', { ascending: false, nullsFirst: false })
      : query.order('last_message_at', { ascending: false, nullsFirst: false })

  const { data, error } = await query
  if (error) {
    const missing = error.code === '42P01' || error.code === 'PGRST205'
    return NextResponse.json(
      { error: missing ? MIGRATION_MISSING : 'Lecture des conversations impossible' },
      { status: missing ? 503 : 500 },
    )
  }

  const pinSet = new Set(pins)
  const items = (data ?? []).map((row) => toListItem(row, me.id, pinSet))
  return NextResponse.json({
    items: filter === 'pinned' ? items : orderWithPins(items, pins),
    counts: await counts(),
    me: { id: me.id, name: me.name },
  })
}
