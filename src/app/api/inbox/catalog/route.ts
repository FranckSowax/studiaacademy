import { NextResponse } from 'next/server'
import { getInboxIdentity } from '@/lib/inbox/identity'
import { loadCatalog } from '@/lib/inbox/cart'

export const dynamic = 'force-dynamic'

/** Catalogue publié : formations actives et sessions à venir, avec leurs tarifs de base. */
export async function GET() {
  const me = await getInboxIdentity()
  if (!me) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  try {
    return NextResponse.json({ items: await loadCatalog() })
  } catch {
    return NextResponse.json({ error: 'Catalogue indisponible' }, { status: 503 })
  }
}
