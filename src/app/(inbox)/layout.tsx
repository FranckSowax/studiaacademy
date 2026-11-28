export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { AdminHeader } from '@/components/layout/admin-header'
import { AdminSidebar } from '@/components/layout/admin-sidebar'
import { getInboxIdentity } from '@/lib/inbox/identity'

const FOND = 'bg-slate-100 dark:bg-slate-950'

/**
 * Espace messagerie : toute l'équipe active (admins et agents, voir public.current_staff_role).
 * Chaque route API refait la vérification (un layout ne protège pas les API).
 */
export default async function InboxLayout({ children }: { children: React.ReactNode }) {
  const me = await getInboxIdentity()
  if (!me) redirect('/equipe/connexion?next=/messagerie')

  // WHY: un agent n'a pas accès à /admin, on ne lui montre donc pas son menu.
  if (me.role !== 'admin') {
    return <div className={`h-dvh overflow-hidden ${FOND}`}>{children}</div>
  }

  // WHY: la messagerie est sortie de /admin (les agents y entrent aussi), mais un
  // admin doit y garder l'en-tête et la barre latérale pour continuer à naviguer.
  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <AdminHeader />
      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-64 shrink-0 overflow-y-auto border-r bg-background md:block">
          <AdminSidebar className="h-auto min-h-full border-none" />
        </aside>
        <div className={`h-full min-w-0 flex-1 overflow-hidden ${FOND}`}>{children}</div>
      </div>
    </div>
  )
}
