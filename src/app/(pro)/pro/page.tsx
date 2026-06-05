export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { aiServices } from '@/lib/ai-services/definitions'
import {
  BarChart3, Sparkles, GraduationCap, ArrowRight, Building2, Megaphone, FileText,
  FileCheck, FileSignature, Briefcase, Mail, Presentation, BookOpen, PenTool,
  TrendingUp, Compass, Receipt, ChevronRight, Users,
} from 'lucide-react'

const iconMap: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  Megaphone, FileText, FileCheck, FileSignature, Briefcase, Mail, Presentation, BookOpen, PenTool, TrendingUp, Compass, Receipt, GraduationCap,
}

export default async function ProDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = user ? await supabase.from('profiles').select('full_name, email').eq('id', user.id).maybeSingle() : { data: null }
  const { data: company } = user ? await supabase.from('company_profiles').select('id, nom_entreprise').eq('user_id', user.id).maybeSingle() : { data: null }

  let nbAssessments = 0
  if (company) {
    const { count } = await supabase.from('company_assessments').select('*', { count: 'exact', head: true }).eq('company_id', company.id)
    nbAssessments = count ?? 0
  }

  const name = profile?.full_name || profile?.email?.split('@')[0] || ''
  const services = aiServices.filter((s) => s.category === 'entreprise').slice(0, 6)
  const { data: formations } = await supabase
    .from('formations')
    .select('slug, titre, sous_titre, niveau, prix_fcfa')
    .eq('categorie', 'Entreprise')
    .eq('is_published', true)
    .limit(4)

  return (
    <div className="max-w-6xl space-y-6">
      {/* En-tête */}
      <div className="bg-gradient-to-br from-[#2e1065] to-[#7C3AED] rounded-3xl p-6 sm:p-8 text-white">
        <div className="inline-flex items-center gap-1.5 bg-white/15 px-2.5 py-1 rounded-full text-xs font-medium mb-3"><Building2 className="w-3 h-3" />Espace Professionnel</div>
        <h1 className="text-2xl sm:text-3xl font-extrabold font-heading">Bonjour {name} 👋</h1>
        <p className="text-white/75 mt-1">{company ? company.nom_entreprise : 'Faites monter vos équipes en compétences sur l\'IA et le digital.'}</p>
      </div>

      {/* Actions rapides */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/entreprise/diagnostic" className="group bg-white rounded-2xl border border-[#f0ebe3] p-5 hover:shadow-lg transition-all">
          <div className="w-11 h-11 rounded-xl bg-[#e97e42]/15 flex items-center justify-center mb-3"><BarChart3 className="w-5 h-5 text-[#e97e42]" /></div>
          <h3 className="font-bold font-heading text-gray-900">Évaluer mes effectifs</h3>
          <p className="text-sm text-gray-500 mt-0.5 mb-2">{nbAssessments > 0 ? `${nbAssessments} diagnostic(s)` : 'Diagnostic gratuit'}</p>
          <span className="text-sm font-semibold text-[#e97e42] inline-flex items-center gap-1">Lancer<ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" /></span>
        </Link>
        <Link href="/outils" className="group bg-white rounded-2xl border border-[#f0ebe3] p-5 hover:shadow-lg transition-all">
          <div className="w-11 h-11 rounded-xl bg-violet-100 flex items-center justify-center mb-3"><Sparkles className="w-5 h-5 text-[#7C3AED]" /></div>
          <h3 className="font-bold font-heading text-gray-900">Outils IA & RH</h3>
          <p className="text-sm text-gray-500 mt-0.5 mb-2">Annonces, CV, contrats…</p>
          <span className="text-sm font-semibold text-[#7C3AED] inline-flex items-center gap-1">Explorer<ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" /></span>
        </Link>
        <Link href="/formations/en-ligne" className="group bg-white rounded-2xl border border-[#f0ebe3] p-5 hover:shadow-lg transition-all">
          <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center mb-3"><GraduationCap className="w-5 h-5 text-blue-600" /></div>
          <h3 className="font-bold font-heading text-gray-900">Formations entreprise</h3>
          <p className="text-sm text-gray-500 mt-0.5 mb-2">IA, digitalisation, data…</p>
          <span className="text-sm font-semibold text-blue-600 inline-flex items-center gap-1">Découvrir<ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" /></span>
        </Link>
      </div>

      {/* Outils RH */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold font-heading text-gray-900 flex items-center gap-2"><Sparkles className="w-5 h-5 text-[#7C3AED]" />Outils RH à l&apos;IA</h2>
          <Link href="/outils" className="text-sm text-[#7C3AED] hover:underline">Tout voir</Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((s) => {
            const Icon = iconMap[s.iconName] ?? Sparkles
            return (
              <Link key={s.slug} href={`/outils/${s.slug}`} className="group bg-white rounded-2xl border border-[#f0ebe3] p-5 hover:shadow-md transition-all">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: `${s.couleur}18` }}><Icon className="w-5 h-5" style={{ color: s.couleur }} /></div>
                <h3 className="font-semibold text-gray-900 group-hover:text-[#7C3AED] transition-colors">{s.titre}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{s.sousTitre}</p>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Formations B2B */}
      {(formations ?? []).length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold font-heading text-gray-900 flex items-center gap-2"><GraduationCap className="w-5 h-5 text-blue-600" />Formations pour vos équipes</h2>
            <Link href="/formations/en-ligne" className="text-sm text-[#7C3AED] hover:underline">Tout voir</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(formations ?? []).map((f) => (
              <Link key={f.slug} href={`/formations/en-ligne/${f.slug}`} className="group bg-white rounded-2xl border border-[#f0ebe3] p-5 hover:shadow-md transition-all flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-[#7C3AED] transition-colors">{f.titre}</h3>
                  {f.sous_titre && <p className="text-xs text-gray-500 mt-0.5">{f.sous_titre}</p>}
                  <p className="text-xs text-gray-400 mt-1 inline-flex items-center gap-1"><Users className="w-3 h-3" />{f.niveau}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-[#7C3AED] flex-shrink-0 mt-1" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
