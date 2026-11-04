export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { getInboxIdentity } from '@/lib/inbox/identity'

/**
 * Espace messagerie : toute l'équipe active (admins et agents, voir public.current_staff_role).
 * Chaque route API refait la vérification (un layout ne protège pas les API).
 */
export default async function InboxLayout({ children }: { children: React.ReactNode }) {
  const me = await getInboxIdentity()
  if (!me) redirect('/equipe/connexion?next=/messagerie')
  return <div className="h-dvh overflow-hidden bg-slate-100 dark:bg-slate-950">{children}</div>
}
