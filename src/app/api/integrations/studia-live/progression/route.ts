import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { trouverOuCreerCompte } from '@/lib/studia-live/comptes'
import { secretLiaison, verifierAppel } from '@/lib/studia-live/signature'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const Entier = (max: number) => z.number().int().min(0).max(max)

const Corps = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  prenom: z.string().trim().min(1).max(60),
  progression: z.object({
    formation_code: z.string().regex(/^[a-z0-9-]{2,60}$/),
    formation_label: z.string().trim().min(1).max(120),
    points: Entier(1_000_000),
    niveau: z.string().trim().min(1).max(60),
    exercices_reussis: Entier(10_000),
    exercices_total: Entier(10_000),
    serie_jours: Entier(10_000),
    mis_a_jour: z.iso.datetime({ offset: true }),
  }),
})

/**
 * POST /api/integrations/studia-live/progression — appelé par Studia Live
 * à chaque avancée d'un apprenant sur une formation en ligne (ex. « PC
 * Express ») : crée (ou retrouve) son compte Academy par e-mail et met à
 * jour sa progression, une ligne par formation. Un envoi plus ancien que
 * la valeur stockée est ignoré (réponse 200, pour que Studia Live
 * n'insiste pas). Signé HMAC (en-têtes X-Studia-Timestamp /
 * X-Studia-Signature), comme /link.
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

  const p = corps.progression
  const { data: ecrit, error } = await admin.rpc('upsert_live_progression', {
    p_user_id: compte.id,
    p_formation_code: p.formation_code,
    p_formation_label: p.formation_label,
    p_points: p.points,
    p_niveau: p.niveau,
    p_exercices_reussis: p.exercices_reussis,
    p_exercices_total: p.exercices_total,
    p_serie_jours: p.serie_jours,
    p_source_mis_a_jour: p.mis_a_jour,
  })
  if (error || typeof ecrit !== 'boolean') {
    return NextResponse.json({ error: 'enregistrement_impossible' }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    academy_user_id: compte.id,
    statut: ecrit ? 'enregistre' : 'ignore',
  })
}
