import type { Metadata } from 'next'
import { getAppConfig } from '@/lib/config/app-config'
import { getInboxIdentity } from '@/lib/inbox/identity'
import { InboxApp } from '@/components/inbox/InboxApp'

export function generateMetadata(): Metadata {
  return { title: `Messagerie — ${getAppConfig().brand.name}`, robots: { index: false } }
}

export default async function MessageriePage() {
  const me = await getInboxIdentity()
  return <InboxApp brandName={getAppConfig().brand.name} isAdmin={me?.role === 'admin'} />
}
