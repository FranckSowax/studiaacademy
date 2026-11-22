import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { couverturePublique } from '@/lib/studia-live/couverture'
import { LIVE_CODE_FORMAT } from '@/lib/studia-live/lancement'
import { secretLiaison, verifierAppel } from '@/lib/studia-live/signature'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const SANS_CACHE = { 'Cache-Control': 'no-store' }

interface Ligne {
  live_code: string | null
  titre: string | null
  sous_titre: string | null
  cover_image: string | null
}

/**
 * GET /api/integrations/studia-live/formations — appelé par Studia Live,
 * de serveur à serveur, pour afficher la couverture, le titre et le
 * sous-titre des formations qui se suivent chez lui : les formations
 * publiées qui ont un `live_code`. Signé HMAC comme /progression
 * (en-têtes X-Studia-Timestamp / X-Studia-Signature) ; le corps étant
 * vide, la chaîne signée est `${timestamp}.`.
 * Ni donnée personnelle, ni prix, ni formation non publiée.
 */
export async function GET(request: Request) {
  const secret = secretLiaison()
  if (!secret) {
    return NextResponse.json({ error: 'non_configure' }, { status: 503, headers: SANS_CACHE })
  }

  if (
    !verifierAppel(
      secret,
      '',
      request.headers.get('x-studia-timestamp'),
      request.headers.get('x-studia-signature')
    )
  ) {
    return NextResponse.json({ error: 'signature_invalide' }, { status: 401, headers: SANS_CACHE })
  }

  // Clé service : l'appel n'a pas de session. Les deux filtres ci-dessous
  // sont donc la seule barrière : publiées, et reliées à Studia Live.
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('formations')
    .select('live_code, titre, sous_titre, cover_image')
    .eq('is_published', true)
    .not('live_code', 'is', null)
    .order('ordre', { ascending: true })
  if (error) {
    return NextResponse.json({ error: 'lecture_impossible' }, { status: 500, headers: SANS_CACHE })
  }

  const formations = ((data ?? []) as Ligne[])
    .filter((f) => typeof f.live_code === 'string' && LIVE_CODE_FORMAT.test(f.live_code))
    .map((f) => ({
      live_code: f.live_code as string,
      titre: f.titre ?? '',
      sous_titre: f.sous_titre?.trim() ?? '',
      couverture_url: couverturePublique(f.cover_image),
    }))

  return NextResponse.json({ formations }, { headers: SANS_CACHE })
}
