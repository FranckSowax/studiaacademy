export const dynamic = 'force-dynamic'
// La synchronisation recharge le détail de chaque session : elle peut durer.
export const maxDuration = 300

import { LiveSessionsList } from '@/components/admin/LiveSessionsList'
import { requireAdmin } from '@/lib/auth/require-admin'
import { liaisonLiveConfiguree } from '@/lib/studia-live/pilotage'
import { lireLignesSuivi } from '@/lib/studia-live/suivi'
import { createAdminClient } from '@/lib/supabase/admin'

/** Admin — sessions clôturées de Studia Live. Rien de tout cela n'est public. */
export default async function AdminStudiaLivePage() {
  await requireAdmin()
  const { lignes, erreur } = await lireLignesSuivi(createAdminClient())

  if (erreur) {
    return (
      <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {erreur}
      </div>
    )
  }

  const derniereSynchro = lignes.reduce<string | null>(
    (max, l) => (l.synchronise_le && (!max || l.synchronise_le > max) ? l.synchronise_le : max),
    null,
  )
  return <LiveSessionsList lignes={lignes} configuree={liaisonLiveConfiguree()} derniereSynchro={derniereSynchro} />
}
