export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { DiagnosticRunner } from '@/components/entreprise/DiagnosticRunner'

export default async function DiagnosticPublicPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const admin = createAdminClient()

  const { data } = await admin
    .from('company_assessments')
    .select('titre, description, duree_minutes, status, domaines')
    .eq('link_token', token)
    .maybeSingle()

  if (!data) notFound()

  return (
    <DiagnosticRunner
      token={token}
      titre={data.titre}
      description={data.description}
      dureeMinutes={data.duree_minutes ?? 15}
      nbDomaines={(data.domaines ?? []).length}
      closed={data.status !== 'open'}
    />
  )
}
