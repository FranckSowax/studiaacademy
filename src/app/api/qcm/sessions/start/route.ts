import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

/**
 * Démarre une session élève (sans compte).
 * Vérifie le code classe + que le devoir est déverrouillé.
 */
export async function POST(request: NextRequest) {
  const admin = createAdminClient()
  const body = (await request.json()) as {
    link_token: string
    access_code: string
    eleve_nom: string
    eleve_prenom: string
    eleve_email?: string
    parent_phone?: string
  }

  const { data: devoir } = await admin
    .from('qcm_devoirs')
    .select('id, access_code, is_locked, status, duree_minutes')
    .eq('link_token', body.link_token)
    .single()

  if (!devoir) return NextResponse.json({ error: 'Devoir introuvable' }, { status: 404 })
  if (devoir.status !== 'active') {
    return NextResponse.json({ error: 'Ce devoir n\'est pas actif' }, { status: 403 })
  }
  if (devoir.is_locked) {
    return NextResponse.json({ error: 'Le devoir est verrouillé. Attendez l\'autorisation du professeur.' }, { status: 423 })
  }
  if (devoir.access_code !== body.access_code.toUpperCase().trim()) {
    return NextResponse.json({ error: 'Code classe incorrect' }, { status: 401 })
  }

  const { data: session, error } = await admin
    .from('qcm_sessions')
    .insert({
      devoir_id: devoir.id,
      eleve_nom: body.eleve_nom,
      eleve_prenom: body.eleve_prenom,
      eleve_email: body.eleve_email ?? null,
      parent_phone: body.parent_phone ?? null,
      status: 'in_progress',
    })
    .select('id, report_token, started_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    session_id: session.id,
    report_token: session.report_token,
    started_at: session.started_at,
    duree_minutes: devoir.duree_minutes,
  })
}
