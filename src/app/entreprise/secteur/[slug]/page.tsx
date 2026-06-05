export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { getSecteur, SECTEURS } from '@/lib/secteurs'
import { getServiceBySlug } from '@/lib/ai-services/definitions'
import { formatNumber } from '@/lib/utils'
import {
  ArrowLeft, ArrowRight, CheckCircle, Sparkles, GraduationCap, MapPin, Monitor,
  Users, Landmark, ClipboardList, Calculator, ShoppingBag, Megaphone, HeartPulse,
  BarChart3, ChevronRight, FileText, FileCheck, FileSignature, Briefcase, Mail,
  Presentation, BookOpen, PenTool, TrendingUp, Compass, Receipt, Building2, Globe,
  Palette, Lightbulb, AlignLeft, Sprout, Rocket, Scale, Wrench,
} from 'lucide-react'

const iconMap: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  Users, Landmark, ClipboardList, Calculator, ShoppingBag, Megaphone, GraduationCap, HeartPulse,
  FileText, FileCheck, FileSignature, Briefcase, Mail, Presentation, BookOpen, PenTool, TrendingUp,
  Compass, Receipt, Building2, Globe, Palette, Lightbulb, AlignLeft, Sparkles, Sprout, Rocket, Scale, Wrench,
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const s = getSecteur(slug)
  return { title: s ? `${s.label} — Formations IA | Studia Academy` : 'Secteur', description: s?.description }
}

export default async function SecteurPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const secteur = getSecteur(slug)
  if (!secteur) notFound()
  const SectorIcon = iconMap[secteur.iconName] ?? Sparkles
  const tools = secteur.outils.map((sl) => getServiceBySlug(sl)).filter(Boolean)
  const isRH = secteur.slug === 'ressources-humaines'

  const fmtIcon = (f: string) => (f === 'Présentiel' ? MapPin : f === 'Hybride' ? Sparkles : Monitor)

  return (
    <div className="relative flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {/* HERO */}
        <section className="relative overflow-hidden text-white pt-28 pb-16" style={{ background: `linear-gradient(135deg, ${secteur.couleur}, #2e1065)` }}>
          <div className="pointer-events-none absolute -top-24 -right-24 w-[40vw] h-[40vw] rounded-full bg-white/10 blur-3xl" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Link href="/entreprise" className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white mb-6"><ArrowLeft className="w-4 h-4" />Tous les secteurs</Link>
            <div className="flex items-start gap-4 max-w-3xl">
              <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center flex-shrink-0"><SectorIcon className="w-7 h-7" /></div>
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold font-heading mb-2">{secteur.label}</h1>
                <p className="text-lg text-white/85">{secteur.accroche}</p>
                <p className="text-white/70 mt-2">{secteur.description}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 mt-7">
              <a href="#formations" className="inline-flex items-center gap-2 bg-white text-gray-900 rounded-2xl px-6 py-3 font-bold hover:bg-white/90 transition-colors"><GraduationCap className="w-5 h-5" />Voir les formations</a>
              {isRH && <Link href="/entreprise/diagnostic" className="inline-flex items-center gap-2 bg-[#e97e42] text-white rounded-2xl px-6 py-3 font-bold hover:bg-[#d56a2e] transition-colors"><BarChart3 className="w-5 h-5" />Diagnostic gratuit</Link>}
            </div>
          </div>
        </section>

        {/* FORMATIONS */}
        <section id="formations" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-2 bg-[#fff7ed] text-[#a84d16] px-3 py-1 rounded-full text-sm font-medium mb-3"><Sparkles className="w-4 h-4" />Transformez votre quotidien avec l&apos;IA</span>
            <h2 className="text-3xl font-extrabold font-heading text-gray-900">Formations adaptées à votre métier</h2>
            <p className="text-gray-500 mt-2">En ligne ou en présentiel intra-entreprise (sur demande).</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {secteur.formations.map((f) => {
              const FIcon = fmtIcon(f.format)
              return (
                <div key={f.slug} className="group bg-white rounded-3xl border border-[#f0ebe3] overflow-hidden hover:shadow-xl transition-all flex flex-col">
                  <div className="relative h-40 w-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${secteur.couleur}, ${secteur.couleur}99)` }}>
                    <SectorIcon className="w-12 h-12 text-white/40" />
                    <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 bg-white/90 text-gray-700 text-xs font-medium px-2.5 py-1 rounded-full"><FIcon className="w-3.5 h-3.5" />{f.format}</span>
                  </div>
                  <div className="p-6 flex flex-col flex-1">
                    <h3 className="font-bold font-heading text-lg text-gray-900 mb-1">{f.titre}</h3>
                    <p className="text-sm text-gray-500 mb-4">{f.pitch}</p>
                    <ul className="space-y-2 mb-5">
                      {f.arguments.map((a) => (
                        <li key={a} className="flex items-start gap-2 text-sm text-gray-700"><CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: secteur.couleur }} />{a}</li>
                      ))}
                    </ul>
                    <div className="mt-auto flex items-center justify-between">
                      <span className="font-bold" style={{ color: secteur.couleur }}>{f.prix_fcfa > 0 ? `${formatNumber(f.prix_fcfa)} FCFA` : 'Gratuit'}</span>
                      <Link href={`/formations/en-ligne/${f.slug}`} className="inline-flex items-center gap-1 text-sm font-semibold text-gray-900 group-hover:gap-2 transition-all">S&apos;inscrire<ArrowRight className="w-4 h-4" /></Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="mt-8 bg-[#fbf8f3] rounded-2xl border border-[#f0ebe3] p-5 flex items-start gap-3">
            <MapPin className="w-5 h-5 text-[#e97e42] flex-shrink-0 mt-0.5" />
            <div className="text-sm text-gray-600">
              <p className="font-semibold text-gray-800">Aussi en présentiel dans votre entreprise</p>
              Toutes ces formations peuvent être animées en <strong>intra-entreprise</strong> (sur demande, dates à convenir). <Link href="/entreprise#contact" className="text-[#e97e42] font-medium hover:underline">Demander une session</Link>.
            </div>
          </div>
        </section>

        {/* OUTILS */}
        {tools.length > 0 && (
          <section className="bg-[#faf8f5] border-y border-[#f0ebe3]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-extrabold font-heading text-gray-900">Outils IA pour ce métier</h2>
                <p className="text-gray-500 mt-2">Gagnez du temps dès aujourd&apos;hui, à la demande.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {tools.map((s) => {
                  const Icon = iconMap[s!.iconName] ?? Sparkles
                  return (
                    <Link key={s!.slug} href={`/outils/${s!.slug}`} className="group bg-white rounded-2xl border border-[#f0ebe3] p-5 hover:shadow-md transition-all">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: `${s!.couleur}18` }}><Icon className="w-5 h-5" style={{ color: s!.couleur }} /></div>
                      <h3 className="font-semibold text-gray-900 group-hover:text-[#e97e42] transition-colors">{s!.titre}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">{s!.sousTitre}</p>
                    </Link>
                  )
                })}
              </div>
            </div>
          </section>
        )}

        {/* AUTRES SECTEURS */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-lg font-bold font-heading text-gray-900 mb-4">Autres secteurs</h2>
          <div className="flex flex-wrap gap-2">
            {SECTEURS.filter((s) => s.slug !== secteur.slug).map((s) => (
              <Link key={s.slug} href={`/entreprise/secteur/${s.slug}`} className="inline-flex items-center gap-1.5 bg-white border border-[#f0ebe3] rounded-full px-4 py-2 text-sm font-medium text-gray-700 hover:border-[#e97e42] hover:text-[#e97e42] transition-colors">
                {s.label}<ChevronRight className="w-3.5 h-3.5" />
              </Link>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
