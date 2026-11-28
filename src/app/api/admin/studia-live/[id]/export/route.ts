import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/require-admin'
import { exporterReponsesCsv, nomFichierCsv } from '@/lib/studia-live/export-csv'
import { lireFicheSuivi } from '@/lib/studia-live/suivi'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * « Exporter les réponses (CSV) » d'une session : fichier pour Excel
 * français, généré ici à partir du détail conservé (aucun appel à
 * Studia Live). Réservé aux admins ; jamais mis en cache.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params
  if (!UUID.test(id)) return NextResponse.json({ error: 'Session introuvable' }, { status: 404 })

  const fiche = await lireFicheSuivi(createAdminClient(), id)
  if (!fiche) return NextResponse.json({ error: 'Session introuvable' }, { status: 404 })
  if (!fiche.donnees) {
    return NextResponse.json({ error: 'Le détail de cette session n’a pas encore été reçu.' }, { status: 409 })
  }

  return new Response(exporterReponsesCsv(fiche.donnees), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${nomFichierCsv(fiche.code, fiche.date_formation)}"`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
