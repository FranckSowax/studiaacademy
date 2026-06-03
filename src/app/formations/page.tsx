export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { createClient } from '@/lib/supabase/server'
import {
  Monitor, MapPin, ArrowRight, CheckCircle, Clock, Award,
  Users, Sparkles, PlayCircle, CalendarDays,
} from 'lucide-react'

export default async function FormationsLandingPage() {
  const supabase = await createClient()

  const [{ count: nbOnline }, { count: nbSessions }] = await Promise.all([
    supabase.from('formations').select('*', { count: 'exact', head: true }).eq('is_published', true),
    supabase.from('presentiel_sessions').select('*', { count: 'exact', head: true }).eq('is_published', true),
  ])

  const avantages = [
    { icon: Award, label: 'Certification reconnue' },
    { icon: Users, label: 'Formateurs experts' },
    { icon: Clock, label: 'À votre rythme' },
    { icon: CheckCircle, label: 'Accompagnement dédié' },
  ]

  return (
    <div className="relative flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative pt-28 pb-16 bg-gradient-to-b from-[#fff7ed] to-white overflow-hidden">
          <div className="absolute top-10 right-0 w-[400px] h-[400px] bg-gradient-to-bl from-[#e97e42]/10 to-transparent rounded-full blur-3xl pointer-events-none" />
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
            <div className="inline-flex items-center gap-2 bg-white border border-[#f0ebe3] text-[#a84d16] px-4 py-1.5 rounded-full text-sm font-medium mb-6 shadow-sm">
              <Sparkles className="w-4 h-4" />
              Centre de formation Studia Academy
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold font-heading text-gray-900 mb-5 leading-tight">
              Montez en compétences,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#e97e42] to-[#d56a2e]">
                à votre façon
              </span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-8">
              Choisissez votre mode d'apprentissage : suivez nos formations en ligne où que vous soyez,
              ou rejoignez-nous en présentiel à Libreville. Dans les deux cas, un accompagnement de
              qualité signé Studia.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {avantages.map((a) => {
                const Icon = a.icon
                return (
                  <span key={a.label} className="inline-flex items-center gap-1.5 text-sm text-gray-600 bg-[#fbf8f3] border border-[#f0ebe3] px-3 py-1.5 rounded-full">
                    <Icon className="w-4 h-4 text-[#e97e42]" />
                    {a.label}
                  </span>
                )
              })}
            </div>
          </div>
        </section>

        {/* Choix : en ligne vs présentiel */}
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold font-heading text-gray-900">
                Comment souhaitez-vous apprendre ?
              </h2>
              <p className="text-gray-500 mt-2">Deux formats, une même exigence d'excellence.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* En ligne */}
              <Link
                href="/formations/en-ligne"
                className="group relative bg-gradient-to-br from-[#e97e42] to-[#d56a2e] rounded-3xl p-8 text-white overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all"
              >
                <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white/10 rounded-full" />
                <div className="relative">
                  <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-5">
                    <Monitor className="w-7 h-7" />
                  </div>
                  <h3 className="text-2xl font-bold font-heading mb-2">Formations en ligne</h3>
                  <p className="text-white/90 mb-5">
                    Accédez à une plateforme d'apprentissage moderne : vidéos, supports, quiz et suivi
                    de progression. Apprenez où et quand vous voulez.
                  </p>
                  <ul className="space-y-2 mb-6">
                    {['Vidéos et supports téléchargeables', 'Progression sauvegardée', 'Certificat à la clé'].map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-white/90">
                        <CheckCircle className="w-4 h-4 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 font-semibold">
                      <PlayCircle className="w-5 h-5" />
                      {nbOnline ?? 0} formation{(nbOnline ?? 0) > 1 ? 's' : ''} disponible{(nbOnline ?? 0) > 1 ? 's' : ''}
                    </span>
                    <span className="inline-flex items-center gap-1 bg-white text-[#e97e42] px-4 py-2 rounded-xl font-semibold group-hover:gap-2 transition-all">
                      Explorer <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </Link>

              {/* Présentiel */}
              <Link
                href="/formations/presentiel"
                className="group relative bg-white border-2 border-[#f0ebe3] rounded-3xl p-8 overflow-hidden hover:border-[#e97e42] hover:shadow-2xl hover:-translate-y-1 transition-all"
              >
                <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-[#fff7ed] rounded-full" />
                <div className="relative">
                  <div className="w-14 h-14 bg-[#fff7ed] rounded-2xl flex items-center justify-center mb-5">
                    <MapPin className="w-7 h-7 text-[#e97e42]" />
                  </div>
                  <h3 className="text-2xl font-bold font-heading text-gray-900 mb-2">Formations présentiel</h3>
                  <p className="text-gray-600 mb-5">
                    Rejoignez nos sessions en salle à Libreville. Networking, pratique intensive et
                    immersion totale avec nos formateurs experts.
                  </p>
                  <ul className="space-y-2 mb-6">
                    {['Sessions en petits groupes', 'Pratique et networking', 'Attestation officielle'].map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 flex-shrink-0 text-[#e97e42]" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 font-semibold text-gray-700">
                      <CalendarDays className="w-5 h-5 text-[#e97e42]" />
                      {nbSessions ?? 0} session{(nbSessions ?? 0) > 1 ? 's' : ''} au planning
                    </span>
                    <span className="inline-flex items-center gap-1 bg-[#e97e42] text-white px-4 py-2 rounded-xl font-semibold group-hover:gap-2 transition-all">
                      Voir le planning <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </section>

        {/* Rassurance / conversion */}
        <section className="py-16 bg-[#fbf8f3]">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl font-bold font-heading text-gray-900 mb-4">
              Pas sûr de votre choix ?
            </h2>
            <p className="text-gray-600 mb-8">
              Notre équipe vous oriente vers la formation idéale selon vos objectifs et votre
              disponibilité. Échangeons sur votre projet, sans engagement.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#e97e42] to-[#d56a2e] text-white px-8 py-3.5 rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                Être conseillé <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="https://wa.me/24100000000?text=Bonjour%2C%20je%20souhaite%20des%20conseils%20sur%20vos%20formations"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-white border-2 border-green-500 text-green-600 px-8 py-3.5 rounded-xl font-semibold hover:bg-green-50 transition-all"
              >
                WhatsApp
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
