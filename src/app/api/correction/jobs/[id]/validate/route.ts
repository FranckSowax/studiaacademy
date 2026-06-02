import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { CorrectionResult } from '@/types/teacher'

export const dynamic = 'force-dynamic'

/**
 * Valide (et éventuellement modifie) le rapport de correction d'une copie.
 * Le prof peut ajuster note + commentaires avant validation.
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

  const body = (await request.json()) as {
    result_json?: CorrectionResult
    note_finale?: number
  }

  const updates: Record<string, unknown> = { validated: true }
  if (body.result_json) updates.result_json = body.result_json
  if (typeof body.note_finale === 'number') updates.note_finale = body.note_finale

  const { error } = await supabase
    .from('correction_jobs')
    .update(updates)
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
