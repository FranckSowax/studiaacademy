export const dynamic = 'force-dynamic'

import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { AssessmentDetail } from '@/components/entreprise/AssessmentDetail'
import type { CompanyAssessment, DomainScore } from '@/types/entreprise'

export default async function AssessmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?redirect=/entreprise/diagnostic/${id}`)

  const { data: assessment } = await supabase
    .from('company_assessments')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (!assessment) notFound()
  const a = assessment as CompanyAssessment

  // Agrégat par domaine (moyenne des pct des soumissions scorées)
  const { data: subs } = await supabase
    .from('assessment_submissions')
    .select('scores_domaines, status')
    .eq('assessment_id', id)
    .eq('status', 'scored')

  const agg: Record<string, { sum: number; n: number }> = {}
  for (const s of subs ?? []) {
    const sd = (s.scores_domaines ?? {}) as Record<string, DomainScore>
    for (const [dom, v] of Object.entries(sd)) {
      if (!agg[dom]) agg[dom] = { sum: 0, n: 0 }
      agg[dom].sum += v.pct
      agg[dom].n += 1
    }
  }
  const aggregate = Object.fromEntries(
    Object.entries(agg).map(([dom, v]) => [dom, Math.round(v.sum / Math.max(1, v.n))])
  )

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://studiaacademy-production.up.railway.app'
  const joinUrl = `${baseUrl}/diagnostic/${a.link_token}`

  return (
    <div className="relative flex min-h-screen flex-col bg-[#faf8f5]">
      <Header />
      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <AssessmentDetail
            assessment={a}
            joinUrl={joinUrl}
            scoredCount={(subs ?? []).length}
            aggregate={aggregate}
          />
        </div>
      </main>
    </div>
  )
}
