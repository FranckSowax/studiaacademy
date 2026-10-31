export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { getInboxIdentity } from '@/lib/inbox/identity'

/**
 * Espace messagerie : admins, ou collaborateurs ayant l'accès messagerie.
 * Chaque route API refait la vérification (un layout ne protège pas les API).
 */
export default async function InboxLayout({ children }: { children: React.ReactNode }) {
  const me = await getInboxIdentity()
  if (!me) redirect('/login')
  return <div className="h-dvh overflow-hidden bg-slate-100 dark:bg-slate-950">{children}</div>
}
