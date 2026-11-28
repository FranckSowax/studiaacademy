export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/require-admin'
import {
  AdminFormationsManager,
  type EnrollmentCounts,
  type GenerationRow,
} from '@/components/formations/AdminFormationsManager'
import type { Formation } from '@/types/formation'
import type { GenerationStatus } from '@/types/generation'

export default async function AdminFormationsPage() {
  await requireAdmin()
  const supabase = await createClient()

  const [{ data: formations }, { data: gens }, { data: inscriptions }] = await Promise.all([
    supabase.from('formations').select('*').order('created_at', { ascending: false }),
    // Générations IA (sommaires générés / validés / en cours)
    supabase
      .from('formation_generations')
      .select('id, titre, niveau, status, formation_id, updated_at')
      .order('updated_at', { ascending: false }),
    supabase.from('formation_enrollments').select('formation_id, status'),
  ])

  // Inscriptions par formation : élèves ayant accès, et demandes à valider.
  const counts: EnrollmentCounts = {}
  for (const i of inscriptions ?? []) {
    const id = i.formation_id as string
    const c = (counts[id] ??= { inscrits: 0, enAttente: 0 })
    if (i.status === 'active' || i.status === 'completed') c.inscrits += 1
    else if (i.status === 'pending') c.enAttente += 1
  }

  // WHY: une seule requête pour toutes les sections (au lieu d'une par génération).
  const genIds = (gens ?? []).map((g) => g.id as string)
  const avancement = new Map<string, { total: number; generated: number }>()
  if (genIds.length > 0) {
    const { data: sections } = await supabase
      .from('formation_generation_sections')
      .select('generation_id, content')
      .in('generation_id', genIds)
    for (const s of sections ?? []) {
      const id = s.generation_id as string
      const a = avancement.get(id) ?? { total: 0, generated: 0 }
      a.total += 1
      if (s.content) a.generated += 1
      avancement.set(id, a)
    }
  }

  // Index id formation → état de publication réel
  const publishedById = new Map<string, boolean>(
    (formations ?? []).map((f) => [f.id as string, f.is_published as boolean])
  )

  const generations: GenerationRow[] = (gens ?? []).map((g) => {
    const formationId = g.formation_id as string | null
    const a = avancement.get(g.id as string)
    return {
      id: g.id as string,
      titre: g.titre as string,
      niveau: g.niveau as string,
      status: g.status as GenerationStatus,
      sections_total: a?.total ?? 0,
      sections_generated: a?.generated ?? 0,
      formation_id: formationId,
      formation_published: formationId ? (publishedById.get(formationId) ?? null) : null,
      updated_at: g.updated_at as string,
    }
  })

  return (
    <AdminFormationsManager
      initial={(formations ?? []) as Formation[]}
      generations={generations}
      counts={counts}
    />
  )
}
