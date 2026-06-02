import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * Verrouille / déverrouille l'accès au devoir.
 * Le prof bloque tant qu'il n'est pas sûr que tous les élèves ont le lien.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { data: current } = await supabase
    .from('qcm_devoirs')
    .select('is_locked')
    .eq('id', id)
    .single()

  if (!current) return NextResponse.json({ error: 'Devoir introuvable' }, { status: 404 })

  const newLocked = !current.is_locked
  const { error } = await supabase
    .from('qcm_devoirs')
    .update({
      is_locked: newLocked,
      [newLocked ? 'locked_at' : 'unlocked_at']: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ is_locked: newLocked })
}
