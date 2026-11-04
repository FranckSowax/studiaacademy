import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getInboxIdentity } from '@/lib/inbox/identity'

export const dynamic = 'force-dynamic'

/**
 * Équipe de la messagerie (pour le filtre « répondu par ») :
 * collaborateurs ayant déjà un compte, actifs ou non (l'historique reste).
 * Ne renvoie que l'identifiant de compte et le nom.
 */
export async function GET() {
  const me = await getInboxIdentity()
  if (!me) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const { data, error } = await createAdminClient()
    .from('collaborators')
    .select('user_id, full_name, is_active')
    .not('user_id', 'is', null)
    .order('full_name')
  if (error) return NextResponse.json({ items: [] })
  return NextResponse.json({
    items: (data ?? []).map((c) => ({ id: c.user_id as string, name: c.full_name as string, active: c.is_active === true })),
  })
}
