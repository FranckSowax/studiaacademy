export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { AdminLabsManager } from '@/components/labs/AdminLabsManager'
import type { LabsSolution } from '@/types/labs'

export default async function AdminLabsPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('labs_solutions')
    .select('*')
    .order('created_at', { ascending: false })
  return <AdminLabsManager initial={(data ?? []) as LabsSolution[]} />
}
