export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { AdminFormationsManager } from '@/components/formations/AdminFormationsManager'
import type { Formation } from '@/types/formation'

export default async function AdminFormationsPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('formations')
    .select('*')
    .order('created_at', { ascending: false })
  return <AdminFormationsManager initial={(data ?? []) as Formation[]} />
}
