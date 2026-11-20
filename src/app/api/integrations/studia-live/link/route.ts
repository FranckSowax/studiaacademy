import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { trouverOuCreerCompte } from '@/lib/studia-live/comptes'
import { secretLiaison, verifierAppel } from '@/lib/studia-live/signature'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const Corps = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  prenom: z.string().trim().min(1).max(60),
  participation: z.object({
    live_participant_id: z.string().uuid(),
    session_titre: z.string().trim().min(1).max(200),
    session_code: z.string().trim().min(1).max(12),
    formation_label: z.string().trim().max(120),
    date_formation: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    score: z.number().int().min(0).max(1_000_000),
    rang: z.number().int().min(1).max(10_000),
    nb_participants: z.number().int().min(1).max(10_000),
    lien_finale: z.string().url().max(500),
  }),
})

/**
 * POST /api/integrations/studia-live/link — appelé par Studia Live à la
 * clôture d'une session, pour chaque participant : crée (ou retrouve)
 * son compte Academy par e-mail et enregistre sa participation.
 * Signé HMAC (en-têtes X-Studia-Timestamp / X-Studia-Signature).
 */
export async function POST(request: Request) {
  const secret = secretLiaison()
  if (!secret) return NextResponse.json({ error: 'non_configure' }, { status: 503 })

  const brut = await request.text()
  if (
    brut.length > 10_000 ||
    !verifierAppel(
      secret,
      brut,
      request.headers.get('x-studia-timestamp'),
      request.headers.get('x-studia-signature')
    )
  ) {
    return NextResponse.json({ error: 'signature_invalide' }, { status: 401 })
  }

  let corps: z.infer<typeof Corps>
  try {
    corps = Corps.parse(JSON.parse(brut))
  } catch {
    return NextResponse.json({ error: 'corps_invalide' }, { status: 400 })
  }

  const admin = createAdminClient()
  const compte = await trouverOuCreerCompte(admin, corps.email, corps.prenom)
  if (!compte) return NextResponse.json({ error: 'creation_impossible' }, { status: 500 })

  const p = corps.participation
  const { error } = await admin.from('live_participations').upsert(
    {
      user_id: compte.id,
      live_participant_id: p.live_participant_id,
      session_titre: p.session_titre,
      session_code: p.session_code,
      formation_label: p.formation_label || null,
      date_formation: p.date_formation,
      score: p.score,
      rang: p.rang,
      nb_participants: p.nb_participants,
      lien_finale: p.lien_finale,
    },
    { onConflict: 'live_participant_id' }
  )
  if (error) return NextResponse.json({ error: 'enregistrement_impossible' }, { status: 500 })

  return NextResponse.json({ academy_user_id: compte.id, statut: compte.cree ? 'cree' : 'relie' })
}
