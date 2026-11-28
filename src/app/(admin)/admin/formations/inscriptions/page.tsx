export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/require-admin'
import { AdminEnrollmentsManager } from '@/components/formations/AdminEnrollmentsManager'
import { isPaymentMethod, PROOF_BUCKET, type PaymentMethod } from '@/lib/formations/enrollment-payment'

export interface EnrollmentRow {
  id: string
  status: string
  phone: string | null
  message: string | null
  requested_at: string
  formation_titre: string
  formation_prix: number
  user_name: string
  user_email: string
  payment_method: PaymentMethod | null
  payment_amount_fcfa: number | null
  payment_reference: string | null
  /** Lien signé (1 h) vers la capture d'écran Airtel Money, si elle existe. */
  proof_url: string | null
  admin_note: string | null
}

const PROOF_LINK_SECONDS = 3600

export default async function AdminInscriptionsPage() {
  // WHY: la page délivre des liens signés vers des preuves de paiement
  // (client service_role) : elle vérifie le rôle elle-même, pas seulement le layout.
  await requireAdmin()

  const supabase = await createClient()
  // select('*') : reste valable tant que les colonnes de paiement ne sont pas migrées.
  const { data } = await supabase
    .from('formation_enrollments')
    .select('*, formations(titre, prix_fcfa), profiles!formation_enrollments_user_id_fkey(full_name, email)')
    .order('requested_at', { ascending: false })

  const lignes = data ?? []
  const chemins = lignes
    .map((r) => r.payment_proof_path)
    .filter((p): p is string => typeof p === 'string' && p.length > 0)

  const liens = new Map<string, string>()
  if (chemins.length > 0) {
    const { data: signes } = await createAdminClient()
      .storage.from(PROOF_BUCKET)
      .createSignedUrls(chemins, PROOF_LINK_SECONDS)
    for (const s of signes ?? []) {
      if (s.path && s.signedUrl) liens.set(s.path, s.signedUrl)
    }
  }

  const rows: EnrollmentRow[] = lignes.map((r) => {
    const formations = r.formations as { titre?: string; prix_fcfa?: number | null } | null
    const profiles = r.profiles as { full_name?: string; email?: string } | null
    return {
      id: r.id as string,
      status: r.status as string,
      phone: r.phone as string | null,
      message: r.message as string | null,
      requested_at: r.requested_at as string,
      formation_titre: formations?.titre ?? '—',
      formation_prix: formations?.prix_fcfa ?? 0,
      user_name: profiles?.full_name ?? '—',
      user_email: profiles?.email ?? '',
      payment_method: isPaymentMethod(r.payment_method) ? r.payment_method : null,
      payment_amount_fcfa: typeof r.payment_amount_fcfa === 'number' ? r.payment_amount_fcfa : null,
      payment_reference: typeof r.payment_reference === 'string' ? r.payment_reference : null,
      proof_url: typeof r.payment_proof_path === 'string' ? (liens.get(r.payment_proof_path) ?? null) : null,
      admin_note: typeof r.admin_note === 'string' ? r.admin_note : null,
    }
  })

  return <AdminEnrollmentsManager initial={rows} />
}
