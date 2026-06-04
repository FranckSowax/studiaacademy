export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { AssessmentCreateForm } from '@/components/entreprise/AssessmentCreateForm'

export default async function NouveauDiagnosticPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=/entreprise/diagnostic/nouveau')
  const { data: company } = await supabase.from('company_profiles').select('id').eq('user_id', user.id).maybeSingle()
  if (!company) redirect('/entreprise/diagnostic')

  return (
    <div className="relative flex min-h-screen flex-col bg-[#faf8f5]">
      <Header />
      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <AssessmentCreateForm />
        </div>
      </main>
    </div>
  )
}
