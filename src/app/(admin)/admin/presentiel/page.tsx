export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { AdminPresentielManager } from '@/components/formations/AdminPresentielManager'
import type { PresentielSession, PresentielReservation } from '@/types/formation'

export default async function AdminPresentielPage() {
  const supabase = await createClient()
  const { data: sessions } = await supabase
    .from('presentiel_sessions')
    .select('*')
    .order('date_debut', { ascending: false })

  const sessionList = (sessions ?? []) as PresentielSession[]

  const { data: reservations } = await supabase
    .from('presentiel_reservations')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <AdminPresentielManager
      initialSessions={sessionList}
      reservations={(reservations ?? []) as PresentielReservation[]}
    />
  )
}
