export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/require-admin'
import { AdminEventsManager } from '@/components/admin/AdminEventsManager'
import { PROOF_BUCKET } from '@/lib/formations/enrollment-payment'
import type { PresentielReservation, PresentielSession } from '@/types/formation'

/** Un événement commencé depuis moins de 24 h compte encore comme « à venir ». */
const limiteAVenir = () => new Date(Date.now() - 24 * 3600 * 1000).toISOString()

export default async function AdminEvenementsPage() {
  await requireAdmin()
  const admin = createAdminClient()

  const [evenements, reservations] = await Promise.all([
    admin.from('presentiel_sessions').select('*').order('date_debut', { ascending: false }),
    admin.from('presentiel_reservations').select('*').order('created_at', { ascending: false }),
  ])

  if (evenements.error) {
    return (
      <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Impossible de lire les événements ({evenements.error.message}).
      </div>
    )
  }

  // Captures d'écran Airtel Money : liens signés d'une heure, par réservation.
  const lignes = (reservations.data ?? []) as PresentielReservation[]
  const chemins = lignes.map((r) => r.payment_proof_path).filter((p): p is string => !!p)
  const preuves: Record<string, string> = {}
  if (chemins.length > 0) {
    const { data: signes } = await admin.storage.from(PROOF_BUCKET).createSignedUrls(chemins, 3600)
    const parChemin = new Map((signes ?? []).map((s) => [s.path, s.signedUrl]))
    for (const r of lignes) {
      const lien = r.payment_proof_path ? parChemin.get(r.payment_proof_path) : null
      if (lien) preuves[r.id] = lien
    }
  }

  return (
    <AdminEventsManager
      evenements={(evenements.data ?? []) as PresentielSession[]}
      reservations={lignes}
      preuves={preuves}
      limiteIso={limiteAVenir()}
    />
  )
}
