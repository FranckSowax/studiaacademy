export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { SECTEURS } from '@/lib/secteurs'
import { createClient } from '@/lib/supabase/server'
import { EntrepriseHeroSlider, type HeroSlide } from '@/components/entreprise/EntrepriseHeroSlider'
import {
  ArrowRight, BarChart3, Building2, Sparkles, ChevronRight, MessageSquare, Clock,
  ShieldCheck, Users, Landmark, ClipboardList, Calculator, ShoppingBag, Megaphone,
  GraduationCap, HeartPulse, Sprout, Rocket, Scale, Wrench,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Entreprise & Secteurs — Se former à l\'IA selon son métier | Studia Academy',
  description: "Choisissez votre secteur d'activité et accédez à des formations IA et des outils adaptés à votre métier. En ligne ou en présentiel, au Gabon et en Afrique.",
}

const iconMap: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  Users, Landmark, ClipboardList, Calculator, ShoppingBag, Megaphone, GraduationCap, HeartPulse, Sprout, Rocket, Scale, Wrench,
}

export default async function EntreprisePage() {
  const supabase = await createClient()
  const { data: slidesData } = await supabase
    .from('entreprise_slides')
    .select('id, titre, sous_titre, texte, cta_label, cta_href, image_url, side, couleur')
    .eq('is_active', true)
    .order('ordre', { ascending: true })
  const slides = (slidesData ?? []) as HeroSlide[]

  return (
    <div className="relative flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {/* HERO — slider défilant (géré depuis l'admin) */}
        {slides.length > 0 ? (
          <EntrepriseHeroSlider slides={slides} />
        ) : (
          <section className="relative overflow-hidden bg-gradient-to-br from-[#2e1065] via-[#4c1d95] to-[#7C3AED] text-white pt-28 pb-16">
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <span className="inline-flex items-center gap-2 bg-white/10 border border-white/15 px-3 py-1.5 rounded-full text-sm font-medium mb-5"><Building2 className="w-4 h-4" />Entreprises, professionnels & administrations</span>
              <h1 className="text-4xl md:text-5xl font-extrabold font-heading leading-tight mb-4 max-w-3xl mx-auto">Formez-vous à l&apos;IA selon votre secteur d&apos;activité</h1>
              <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">Choisissez votre métier et accédez à des formations et des outils IA qui transforment votre quotidien.</p>
              <a href="#secteurs" className="inline-flex items-center justify-center gap-2 bg-white text-[#4c1d95] rounded-2xl px-7 py-4 font-bold"><span>Choisir mon secteur</span><ArrowRight className="w-5 h-5" /></a>
            </div>
          </section>
        )}

        {/* BÉNÉFICES */}
        <section className="bg-[#faf8f5] border-y border-[#f0ebe3]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: BarChart3, v: '-70 %', l: 'vs formation à l\'étranger' },
              { icon: Clock, v: '48 h', l: 'pour votre rapport d\'effectifs' },
              { icon: Building2, v: '100 %', l: 'à distance ou en intra' },
              { icon: ShieldCheck, v: 'FCFA', l: 'paiement local, sans engagement' },
            ].map((b) => (
              <div key={b.l} className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#7C3AED]/10 flex items-center justify-center flex-shrink-0"><b.icon className="w-5 h-5 text-[#7C3AED]" /></div>
                <div><p className="text-xl font-extrabold font-heading text-gray-900">{b.v}</p><p className="text-xs text-gray-500">{b.l}</p></div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTEURS */}
        <section id="secteurs" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold font-heading text-gray-900">Votre secteur d&apos;activité</h2>
            <p className="text-gray-500 mt-2">Cliquez sur votre métier pour découvrir vos formations et outils.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {SECTEURS.map((s) => {
              const Icon = iconMap[s.iconName] ?? Building2
              return (
                <Link key={s.slug} href={`/entreprise/secteur/${s.slug}`} className="group relative overflow-hidden bg-white rounded-3xl border border-[#f0ebe3] p-6 hover:shadow-xl hover:-translate-y-1 transition-all">
                  <div className="absolute -right-8 -top-8 w-28 h-28 rounded-full opacity-10 group-hover:opacity-20 transition-opacity" style={{ backgroundColor: s.couleur }} />
                  <div className="relative">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: `${s.couleur}18` }}><Icon className="w-6 h-6" style={{ color: s.couleur }} /></div>
                    <h3 className="font-bold font-heading text-lg text-gray-900 mb-1">{s.label}</h3>
                    <p className="text-sm text-gray-500 mb-4">{s.accroche}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">{s.formations.length} formations · {s.outils.length} outils</span>
                      <span className="inline-flex items-center gap-1 text-sm font-semibold" style={{ color: s.couleur }}>Découvrir<ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" /></span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>

        {/* DIAGNOSTIC */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="bg-gradient-to-br from-[#7C3AED] to-[#4c1d95] rounded-3xl p-8 md:p-12 text-white grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <span className="inline-block bg-[#e97e42] text-white text-xs font-bold px-3 py-1 rounded-full mb-4">GRATUIT · SANS ENGAGEMENT</span>
              <h2 className="text-3xl font-extrabold font-heading mb-4">Évaluez le niveau digital de vos équipes</h2>
              <p className="text-white/80 mb-6">Envoyez un test de compétences à vos collaborateurs et recevez, en 48 h, un rapport du niveau de vos effectifs et un pack de formation sur mesure.</p>
              <Link href="/entreprise/diagnostic" className="inline-flex items-center gap-2 bg-white text-[#4c1d95] rounded-2xl px-7 py-4 font-bold hover:bg-white/90 transition-colors">Lancer mon diagnostic<ArrowRight className="w-5 h-5" /></Link>
            </div>
            <div className="space-y-3">
              {['Vous recevez un lien de test à partager', 'Chaque salarié répond en quelques minutes', 'Vous recevez le rapport + un pack sur mesure'].map((t, i) => (
                <div key={i} className="flex items-start gap-3 bg-white/10 rounded-2xl p-4">
                  <span className="w-8 h-8 rounded-full bg-white text-[#4c1d95] font-extrabold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                  <p className="font-medium pt-1">{t}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CONTACT */}
        <section id="contact" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 md:p-12 text-white text-center">
            <MessageSquare className="w-10 h-10 mx-auto mb-4 text-[#e97e42]" />
            <h2 className="text-3xl font-extrabold font-heading mb-3">Une session présentielle pour vos équipes ?</h2>
            <p className="text-white/70 max-w-xl mx-auto mb-8">Toutes nos formations sectorielles sont disponibles en intra-entreprise, sur demande. Parlons de vos besoins.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/contact?sujet=presentiel" className="inline-flex items-center justify-center gap-2 bg-[#e97e42] hover:bg-[#d56a2e] text-white rounded-2xl px-7 py-4 font-bold transition-colors">Demander une session</Link>
              <Link href="/contact?sujet=devis" className="inline-flex items-center justify-center gap-2 border-2 border-white/30 hover:bg-white/10 text-white rounded-2xl px-7 py-4 font-semibold transition-colors">Demander un devis</Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
