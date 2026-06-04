export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { CompanyOnboarding } from '@/components/entreprise/CompanyOnboarding'
import { BarChart3, Plus, Users, Radio, CheckCircle, Clock } from 'lucide-react'
import type { CompanyProfile } from '@/types/entreprise'

const STATUS_META: Record<string, { label: string; cls: string; icon: typeof Radio }> = {
  draft: { label: 'Brouillon', cls: 'bg-gray-100 text-gray-500', icon: Clock },
  open: { label: 'Ouvert', cls: 'bg-green-50 text-green-600', icon: Radio },
  closed: { label: 'Clôturé', cls: 'bg-gray-100 text-gray-500', icon: CheckCircle },
  analyzing: { label: 'Analyse…', cls: 'bg-blue-50 text-blue-600', icon: Clock },
  analyzed: { label: 'Rapport prêt', cls: 'bg-violet-50 text-violet-600', icon: CheckCircle },
}

export default async function DiagnosticListPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=/entreprise/diagnostic')

  const { data: company } = await supabase.from('company_profiles').select('*').eq('user_id', user.id).maybeSingle()

  return (
    <div className="relative flex min-h-screen flex-col bg-[#faf8f5]">
      <Header />
      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {!company ? (
            <CompanyOnboarding />
          ) : (
            <Diagnostics company={company as CompanyProfile} />
          )}
        </div>
      </main>
    </div>
  )
}

async function Diagnostics({ company }: { company: CompanyProfile }) {
  const supabase = await createClient()
  const { data: assessments } = await supabase
    .from('company_assessments')
    .select('id, titre, domaines, status, nb_submissions, created_at')
    .eq('company_id', company.id)
    .order('created_at', { ascending: false })

  const list = assessments ?? []

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-8">
        <div>
          <h1 className="text-3xl font-bold font-heading text-gray-900">Diagnostics de compétences</h1>
          <p className="text-gray-500 mt-1">{company.nom_entreprise} · évaluez le niveau de vos effectifs</p>
        </div>
        <Link href="/entreprise/diagnostic/nouveau" className="inline-flex items-center gap-2 bg-[#7C3AED] hover:bg-[#6d28d9] text-white rounded-xl px-4 py-2.5 text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" />Nouveau diagnostic
        </Link>
      </div>

      {list.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-[#f0ebe3]">
          <div className="w-16 h-16 bg-[#7C3AED]/10 rounded-2xl flex items-center justify-center mx-auto mb-4"><BarChart3 className="w-8 h-8 text-[#7C3AED]" /></div>
          <h3 className="text-xl font-bold font-heading text-gray-900 mb-2">Aucun diagnostic</h3>
          <p className="text-gray-500 max-w-sm mx-auto mb-6">Créez un test de compétences, partagez le lien à vos équipes, et recevez un rapport du niveau de vos effectifs.</p>
          <Link href="/entreprise/diagnostic/nouveau" className="inline-flex items-center gap-2 bg-[#7C3AED] text-white rounded-xl px-5 py-3 font-medium"><Plus className="w-4 h-4" />Créer le premier</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((a) => {
            const m = STATUS_META[a.status as string] ?? STATUS_META.draft
            return (
              <Link key={a.id} href={`/entreprise/diagnostic/${a.id}`} className="flex items-center justify-between bg-white rounded-2xl border border-[#f0ebe3] p-5 hover:shadow-md hover:border-[#7C3AED]/40 transition-all">
                <div>
                  <h3 className="font-semibold text-gray-900">{a.titre}</h3>
                  <p className="text-sm text-gray-500 inline-flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />{a.nb_submissions} participant{a.nb_submissions > 1 ? 's' : ''} · {(a.domaines ?? []).length} domaines</p>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${m.cls}`}><m.icon className="w-3 h-3" />{m.label}</span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
