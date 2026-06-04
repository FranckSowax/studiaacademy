export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { AdminFormationsManager, type GenerationRow } from '@/components/formations/AdminFormationsManager'
import type { Formation } from '@/types/formation'
import type { GenerationStatus } from '@/types/generation'

export default async function AdminFormationsPage() {
  const supabase = await createClient()

  const { data: formations } = await supabase
    .from('formations')
    .select('*')
    .order('created_at', { ascending: false })

  // Générations IA (sommaires générés / validés / en cours)
  const { data: gens } = await supabase
    .from('formation_generations')
    .select('id, titre, niveau, status, formation_id, updated_at')
    .order('updated_at', { ascending: false })

  // Index id formation → état de publication réel
  const publishedById = new Map<string, boolean>(
    (formations ?? []).map((f) => [f.id as string, f.is_published as boolean])
  )

  const generations: GenerationRow[] = []
  for (const g of gens ?? []) {
    const { data: secs } = await supabase
      .from('formation_generation_sections')
      .select('content')
      .eq('generation_id', g.id)
    const total = secs?.length ?? 0
    const generated = (secs ?? []).filter((s) => s.content).length
    const formationId = g.formation_id as string | null
    generations.push({
      id: g.id as string,
      titre: g.titre as string,
      niveau: g.niveau as string,
      status: g.status as GenerationStatus,
      sections_total: total,
      sections_generated: generated,
      formation_id: formationId,
      formation_published: formationId ? (publishedById.get(formationId) ?? null) : null,
      updated_at: g.updated_at as string,
    })
  }

  return (
    <AdminFormationsManager
      initial={(formations ?? []) as Formation[]}
      generations={generations}
    />
  )
}
