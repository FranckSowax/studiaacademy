export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DocumentsList } from '@/components/outils/DocumentsList'
import type { OutilGeneration } from '@/types/ai-service'

export const metadata = {
  title: 'Mes documents — Studia Academy',
  description: 'Retrouvez tous les résultats générés par les outils IA.',
}

export default async function MesDocumentsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=/dashboard/documents')

  const { data } = await supabase
    .from('outil_generations')
    .select('id, user_id, tool_slug, title, inputs, output, output_type, credits_used, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const items = (data ?? []) as OutilGeneration[]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-heading text-gray-900">Mes documents</h1>
        <p className="text-gray-500 mt-1">
          Tous les résultats générés par les outils IA, sauvegardés automatiquement.
          {items.length > 0 && <span className="ml-1 text-gray-400">({items.length})</span>}
        </p>
      </div>

      <DocumentsList initial={items} />
    </div>
  )
}
