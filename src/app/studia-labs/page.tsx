export const dynamic = 'force-dynamic'

import Link from 'next/link'
import Image from 'next/image'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { createClient } from '@/lib/supabase/server'
import { labsServices } from '@/lib/labs-services'
import {
  Brain, Code2, Workflow, BarChart3, Cloud, Lightbulb, Sparkles,
  ArrowRight, ArrowUpRight, FlaskConical, CheckCircle, ExternalLink,
} from 'lucide-react'
import type { LabsSolution } from '@/types/labs'

const serviceIcons: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  Brain, Code2, Workflow, BarChart3, Cloud, Lightbulb,
}

export default async function StudiaLabsPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('labs_solutions')
    .select('*')
    .eq('is_published', true)
    .order('ordre', { ascending: true })
    .order('created_at', { ascending: false })
  const solutions = (data ?? []) as LabsSolution[]

  return (
    <div className="relative flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative pt-28 pb-16 bg-gradient-to-b from-[#0f172a] to-[#1e293b] text-white overflow-hidden">
          <div className="absolute top-10 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-[#7C3AED]/30 to-transparent rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-[#e97e42]/20 to-transparent rounded-full blur-3xl pointer-events-none" />
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white px-4 py-1.5 rounded-full text-sm font-medium mb-6">
              <FlaskConical className="w-4 h-4 text-[#e97e42]" />
              Studia Labs
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold font-heading mb-5 leading-tight">
              L'innovation IT,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#e97e42] to-[#a855f7]">
                signée Studia
              </span>
            </h1>
            <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-8">
              De l'expertise IA au développement sur mesure : Studia Labs réalise vos projets
              technologiques et conçoit des solutions ouvertes au test et à la souscription.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="#solutions" className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#e97e42] to-[#d56a2e] text-white px-8 py-3.5 rounded-xl font-semibold hover:shadow-lg transition-all">
                Découvrir nos solutions <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/contact" className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-white/20 transition-all">
                Démarrer un projet
              </Link>
            </div>
          </div>
        </section>

        {/* Prestations IT */}
        <section className="py-16 md:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-[#fff7ed] text-[#a84d16] px-4 py-1.5 rounded-full text-sm font-medium mb-4">
                <Sparkles className="w-3.5 h-3.5" />
                Nos prestations
              </div>
              <h2 className="text-3xl md:text-4xl font-bold font-heading text-gray-900 mb-3">
                Toute prestation IT, un seul partenaire
              </h2>
              <p className="text-gray-500 max-w-2xl mx-auto">
                Studia Labs accompagne entreprises et institutions sur l'ensemble de leurs besoins technologiques.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {labsServices.map((s) => {
                const Icon = serviceIcons[s.iconName] ?? Code2
                return (
                  <div key={s.titre} className="bg-[#fbf8f3] rounded-2xl p-6 border border-[#f0ebe3] hover:shadow-lg transition-all">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: `${s.couleur}18` }}>
                      <Icon className="w-6 h-6" style={{ color: s.couleur }} />
                    </div>
                    <h3 className="font-bold font-heading text-gray-900 mb-2">{s.titre}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed mb-4">{s.description}</p>
                    <ul className="space-y-1.5">
                      {s.exemples.map((e) => (
                        <li key={e} className="flex items-center gap-2 text-xs text-gray-600">
                          <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: s.couleur }} />{e}
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}
            </div>

            <div className="text-center mt-10">
              <Link href="/contact" className="inline-flex items-center gap-2 bg-gradient-to-r from-[#e97e42] to-[#d56a2e] text-white px-8 py-3.5 rounded-xl font-semibold hover:shadow-lg transition-all">
                Confiez-nous votre projet <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* Solutions */}
        <section id="solutions" className="py-16 md:py-24 bg-[#fbf8f3] scroll-mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-white border border-[#f0ebe3] text-[#a84d16] px-4 py-1.5 rounded-full text-sm font-medium mb-4">
                <FlaskConical className="w-3.5 h-3.5" />
                Nos solutions
              </div>
              <h2 className="text-3xl md:text-4xl font-bold font-heading text-gray-900 mb-3">
                Des produits prêts à l'emploi
              </h2>
              <p className="text-gray-500 max-w-2xl mx-auto">
                Les dernières solutions conçues par les acteurs de Studia Labs — ouvertes au test et à la souscription.
              </p>
            </div>

            {solutions.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-[#f0ebe3]">
                <FlaskConical className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Nos premières solutions arrivent très bientôt.</p>
                <Link href="/contact" className="inline-block mt-4 text-[#a84d16] font-semibold hover:underline">
                  Rester informé·e
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {solutions.map((sol) => {
                  const href = sol.has_detail_page ? `/studia-labs/${sol.slug}` : (sol.app_url || '#')
                  const external = !sol.has_detail_page && !!sol.app_url
                  const CardInner = (
                    <>
                      <div className="relative h-40 w-full bg-gradient-to-br from-[#0f172a] to-[#1e293b]">
                        {sol.cover_image ? (
                          <Image src={sol.cover_image} alt={sol.nom} fill sizes="(max-width:768px) 100vw, 33vw" className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <FlaskConical className="w-10 h-10 text-white/40" />
                          </div>
                        )}
                        {sol.badge && (
                          <span className="absolute top-3 right-3 bg-[#e97e42] text-white text-xs font-bold px-2.5 py-1 rounded-full">
                            {sol.badge}
                          </span>
                        )}
                        {sol.logo_url && (
                          <div className="absolute -bottom-6 left-5 w-12 h-12 rounded-xl bg-white shadow-lg border border-[#f0ebe3] flex items-center justify-center overflow-hidden">
                            <Image src={sol.logo_url} alt={`${sol.nom} logo`} width={40} height={40} className="object-contain" />
                          </div>
                        )}
                      </div>
                      <div className={`p-5 ${sol.logo_url ? 'pt-8' : ''}`}>
                        {sol.categorie && (
                          <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">{sol.categorie}</span>
                        )}
                        <h3 className="font-bold font-heading text-gray-900 mt-1 group-hover:text-[#e97e42] transition-colors">{sol.nom}</h3>
                        {sol.tagline && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{sol.tagline}</p>}
                        <div className="flex items-center gap-1 mt-4 text-sm font-semibold text-[#e97e42]">
                          {external ? <>Ouvrir l'application <ArrowUpRight className="w-3.5 h-3.5" /></> : <>En savoir plus <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" /></>}
                        </div>
                      </div>
                    </>
                  )
                  return external ? (
                    <a key={sol.id} href={href} target="_blank" rel="noopener noreferrer"
                      className="group bg-white rounded-2xl border border-[#f0ebe3] overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all">
                      {CardInner}
                    </a>
                  ) : (
                    <Link key={sol.id} href={href}
                      className="group bg-white rounded-2xl border border-[#f0ebe3] overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all">
                      {CardInner}
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-gradient-to-br from-[#0f172a] to-[#1e293b] text-white">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl font-bold font-heading mb-4">Une idée, un projet IT ?</h2>
            <p className="text-white/80 mb-8">
              Discutons de votre besoin. Studia Labs transforme vos idées en solutions concrètes.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/contact" className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#e97e42] to-[#d56a2e] text-white px-8 py-3.5 rounded-xl font-semibold hover:shadow-lg transition-all">
                Nous contacter <ArrowRight className="w-4 h-4" />
              </Link>
              <a href="https://wa.me/24100000000?text=Bonjour%20Studia%20Labs%2C%20j%27ai%20un%20projet" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-white/10 border border-white/20 text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-white/20 transition-all">
                <ExternalLink className="w-4 h-4" /> WhatsApp
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
