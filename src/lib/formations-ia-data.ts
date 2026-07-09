// Accès données côté serveur — sessions publiques avec repli statique
// si Supabase est indisponible (build local sans env, panne réseau…).
// Lecture via l'API REST (anon) + revalidation ISR : les pages restent
// statiques et rapides (mobile 3G), rafraîchies toutes les 5 minutes.

import { fallbackSessions, type SessionIA } from '@/lib/formations-ia'

interface SessionRow {
  id: string
  formation_slug: string
  date: string
  lieu: string
  places_restantes: number | null
}

export async function getSessionsBySlug(): Promise<Record<string, SessionIA[]>> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return fallbackSessions

  try {
    const today = new Date().toISOString().slice(0, 10)
    const endpoint =
      `${url}/rest/v1/fia_sessions_publiques` +
      `?select=id,formation_slug,date,lieu,places_restantes` +
      `&date=gte.${today}&order=date.asc`

    const res = await fetch(endpoint, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      next: { revalidate: 300 },
    })
    if (!res.ok) return fallbackSessions

    const data = (await res.json()) as SessionRow[]
    if (!Array.isArray(data) || data.length === 0) return fallbackSessions

    const out: Record<string, SessionIA[]> = {}
    for (const row of data) {
      const list = out[row.formation_slug] ?? (out[row.formation_slug] = [])
      list.push({
        id: row.id,
        date: row.date,
        lieu: row.lieu,
        placesRestantes: row.places_restantes,
      })
    }
    return out
  } catch {
    return fallbackSessions
  }
}
