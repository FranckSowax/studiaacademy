export const dynamic = 'force-dynamic'

import { EntreprisesList } from '@/components/admin/EntreprisesList'
import { requireAdmin } from '@/lib/auth/require-admin'
import { lireEntreprises } from '@/lib/entreprise/dossier'
import { lireResponsables } from '@/lib/studia-live/suivi'
import { createAdminClient } from '@/lib/supabase/admin'

/** Admin — entreprises : un dossier par entreprise (sessions, participants, suivi). */
export default async function AdminEntreprisePage() {
  await requireAdmin()
  const admin = createAdminClient()
  const [{ entreprises, erreur }, responsables] = await Promise.all([lireEntreprises(admin), lireResponsables(admin)])

  if (erreur) {
    return (
      <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {erreur}
      </div>
    )
  }
  return <EntreprisesList entreprises={entreprises} responsables={responsables} />
}
