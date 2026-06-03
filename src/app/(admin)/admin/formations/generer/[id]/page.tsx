export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { GenerationWorkspace } from '@/components/formations/GenerationWorkspace'
import type { FormationGeneration, GenerationSection } from '@/types/generation'

export default async function GenerationWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: gen } = await supabase.from('formation_generations').select('*').eq('id', id).single()
  if (!gen) redirect('/admin/formations')

  const { data: sections } = await supabase
    .from('formation_generation_sections')
    .select('*')
    .eq('generation_id', id)
    .order('ordre', { ascending: true })

  return (
    <GenerationWorkspace
      generation={gen as FormationGeneration}
      initialSections={(sections ?? []) as GenerationSection[]}
    />
  )
}
