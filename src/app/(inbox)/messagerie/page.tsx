import type { Metadata } from 'next'
import { getAppConfig } from '@/lib/config/app-config'
import { getInboxIdentity } from '@/lib/inbox/identity'
import { InboxApp } from '@/components/inbox/InboxApp'

export function generateMetadata(): Metadata {
  return { title: `Messagerie — ${getAppConfig().brand.name}`, robots: { index: false } }
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** ?c=<uuid> ouvre directement une conversation (identifiant opaque, aucune donnée personnelle). */
export default async function MessageriePage({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  const [me, { c }] = await Promise.all([getInboxIdentity(), searchParams])
  return (
    <InboxApp
      brandName={getAppConfig().brand.name}
      isAdmin={me?.role === 'admin'}
      initialConversationId={c && UUID_RE.test(c) ? c : null}
    />
  )
}
