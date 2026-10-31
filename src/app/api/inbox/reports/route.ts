import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getInboxIdentity } from '@/lib/inbox/identity'

export const dynamic = 'force-dynamic'

/** Bilans quotidiens récents (administrateurs). */
export async function GET() {
  const me = await getInboxIdentity()
  if (!me || me.role !== 'admin') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('wa_daily_reports')
    .select('day, report, cost_amount, cost_currency')
    .order('day', { ascending: false })
    .limit(14)
  if (error) return NextResponse.json({ error: 'Bilans indisponibles' }, { status: 503 })
  return NextResponse.json({ items: data ?? [] })
}
