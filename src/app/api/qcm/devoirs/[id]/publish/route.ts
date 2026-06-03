import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Question } from '@/types/teacher'

export const dynamic = 'force-dynamic'

/**
 * Publie le devoir (status: active) après validation/édition par le prof.
 * Optionnellement verrouillé au départ.
 */
export async function POST(
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
    questions?: Question[]
    is_locked?: boolean
  }

  const updates: Record<string, unknown> = {
    status: 'active',
    is_locked: body.is_locked ?? false,
  }
  if (body.questions) updates.questions = body.questions
  if (body.is_locked) updates.locked_at = new Date().toISOString()

  const { data: devoir, error } = await supabase
    .from('qcm_devoirs')
    .update(updates)
    .eq('id', id)
    .select('link_token, access_code')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://studiaacademy-production.up.railway.app'
  return NextResponse.json({
    success: true,
    lien: `${baseUrl}/devoir/${devoir.link_token}`,
    code: devoir.access_code,
  })
}
