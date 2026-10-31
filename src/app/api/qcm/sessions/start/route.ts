import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { clientIpFrom, consumeRateLimit, RATE_LIMITS } from '@/lib/security/rate-limit'
import { isValidPhone, normalizePhone } from '@/lib/whatsapp'

export const dynamic = 'force-dynamic'

/**
 * Démarre une session élève (sans compte).
 * Vérifie le code classe + que le devoir est déverrouillé.
 */
export async function POST(request: NextRequest) {
  // WHY: limite la force brute du code classe et la création massive de sessions.
  const ip = clientIpFrom(request.headers)
  if (!(await consumeRateLimit(`qcm-start:ip:${ip}`, RATE_LIMITS.qcmStartPerIp))) {
    return NextResponse.json({ error: 'Trop de tentatives. Réessayez dans quelques minutes.' }, { status: 429 })
  }

  const admin = createAdminClient()
  const body = (await request.json().catch(() => null)) as {
    link_token?: string
    access_code?: string
    eleve_nom?: string
    eleve_prenom?: string
    eleve_email?: string
    parent_phone?: string
  } | null
  if (
    !body ||
    typeof body.link_token !== 'string' ||
    typeof body.access_code !== 'string' ||
    !body.eleve_nom?.trim() ||
    !body.eleve_prenom?.trim()
  ) {
    return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 })
  }

  let parentPhone: string | null = null
  if (body.parent_phone?.trim()) {
    parentPhone = normalizePhone(body.parent_phone)
    if (!isValidPhone(parentPhone)) {
      return NextResponse.json({ error: 'Numéro du parent invalide' }, { status: 400 })
    }
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
      eleve_nom: body.eleve_nom.trim().slice(0, 80),
      eleve_prenom: body.eleve_prenom.trim().slice(0, 80),
      eleve_email: body.eleve_email ? String(body.eleve_email).slice(0, 200) : null,
      parent_phone: parentPhone,
      status: 'in_progress',
    })
    .select('id, report_token, started_at')
    .single()

  if (error) return NextResponse.json({ error: 'Impossible de démarrer le devoir' }, { status: 500 })

  return NextResponse.json({
    session_id: session.id,
    report_token: session.report_token,
    started_at: session.started_at,
    duree_minutes: devoir.duree_minutes,
  })
}
