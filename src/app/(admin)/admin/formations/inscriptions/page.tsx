export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { AdminEnrollmentsManager } from '@/components/formations/AdminEnrollmentsManager'

export interface EnrollmentRow {
  id: string
  status: string
  phone: string | null
  message: string | null
  requested_at: string
  formation_titre: string
  user_name: string
  user_email: string
}

export default async function AdminInscriptionsPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('formation_enrollments')
    .select('id, status, phone, message, requested_at, formations(titre), profiles!formation_enrollments_user_id_fkey(full_name, email)')
    .order('requested_at', { ascending: false })

  const rows: EnrollmentRow[] = (data ?? []).map((r) => {
    const formations = r.formations as { titre?: string } | null
    const profiles = r.profiles as { full_name?: string; email?: string } | null
    return {
      id: r.id as string,
      status: r.status as string,
      phone: r.phone as string | null,
      message: r.message as string | null,
      requested_at: r.requested_at as string,
      formation_titre: formations?.titre ?? '—',
      user_name: profiles?.full_name ?? '—',
      user_email: profiles?.email ?? '',
    }
  })

  return <AdminEnrollmentsManager initial={rows} />
}
