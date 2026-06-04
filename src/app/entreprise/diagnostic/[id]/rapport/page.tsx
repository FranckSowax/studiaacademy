export const dynamic = 'force-dynamic'

import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { RapportView } from '@/components/entreprise/RapportView'

export default async function RapportPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?redirect=/entreprise/diagnostic/${id}/rapport`)

  const { data: assessment } = await supabase.from('company_assessments').select('id, titre, nb_submissions').eq('id', id).maybeSingle()
  if (!assessment) notFound()

  const { data: result } = await supabase.from('assessment_results').select('synthese, aggregate, nb_repondants, generated_at').eq('assessment_id', id).maybeSingle()
  const { data: proposal } = await supabase.from('training_proposals').select('*').eq('assessment_id', id).maybeSingle()

  if (!result) redirect(`/entreprise/diagnostic/${id}`)

  return (
    <div className="relative flex min-h-screen flex-col bg-[#faf8f5]">
      <Header />
      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <RapportView
            assessmentId={id}
            titre={assessment.titre}
            nbRepondants={result.nb_repondants ?? 0}
            synthese={result.synthese ?? {}}
            proposal={proposal ?? null}
          />
        </div>
      </main>
    </div>
  )
}
