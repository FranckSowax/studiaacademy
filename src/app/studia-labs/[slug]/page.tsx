export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { createClient } from '@/lib/supabase/server'
import {
  ArrowLeft, ArrowUpRight, CheckCircle, FlaskConical, Play,
} from 'lucide-react'
import type { LabsSolution } from '@/types/labs'
import type { Metadata } from 'next'

type Props = { params: Promise<{ slug: string }> }

function embedUrl(url: string): string {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]+)/)
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`
  const vm = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`
  return url
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('labs_solutions').select('nom, tagline').eq('slug', slug).single()
  if (!data) return {}
  return { title: `${data.nom} — Studia Labs`, description: data.tagline ?? undefined }
}

export default async function SolutionDetailPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('labs_solutions')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()
  if (!data) notFound()
  const sol = data as LabsSolution

  return (
    <div className="relative flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 pt-24">
        {/* Hero */}
        <section className="bg-gradient-to-b from-[#0f172a] to-[#1e293b] text-white py-12">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <Link href="/studia-labs" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white mb-6">
              <ArrowLeft className="w-4 h-4" />
              Studia Labs
            </Link>
            <div className="flex flex-col sm:flex-row sm:items-center gap-5">
              {sol.logo_url && (
                <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center overflow-hidden flex-shrink-0">
                  <Image src={sol.logo_url} alt={`${sol.nom} logo`} width={56} height={56} className="object-contain" />
                </div>
              )}
              <div>
                {sol.categorie && <span className="text-sm text-[#e97e42] font-medium">{sol.categorie}</span>}
                <h1 className="text-3xl md:text-4xl font-extrabold font-heading">{sol.nom}</h1>
                {sol.tagline && <p className="text-white/80 mt-1 text-lg">{sol.tagline}</p>}
              </div>
            </div>
            {sol.app_url && (
              <a href={sol.app_url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-[#e97e42] to-[#d56a2e] text-white px-7 py-3.5 rounded-xl font-semibold mt-6 hover:shadow-lg transition-all">
                Ouvrir l'application <ArrowUpRight className="w-4 h-4" />
              </a>
            )}
          </div>
        </section>

        {/* Chiffres clés */}
        {sol.key_figures.length > 0 && (
          <section className="bg-white border-b border-[#f0ebe3] py-10">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
                {sol.key_figures.map((kf, i) => (
                  <div key={i} className="text-center">
                    <p className="text-3xl md:text-4xl font-extrabold font-heading text-transparent bg-clip-text bg-gradient-to-r from-[#e97e42] to-[#d56a2e]">
                      {kf.value}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">{kf.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Contenu */}
          <div className="lg:col-span-2 space-y-8">
            {/* Vidéo */}
            {sol.video_url && (
              <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-lg">
                <iframe src={embedUrl(sol.video_url)} className="w-full h-full" allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" title={sol.nom} />
              </div>
            )}

            {/* Cover si pas de vidéo */}
            {!sol.video_url && sol.cover_image && (
              <div className="relative aspect-video w-full rounded-2xl overflow-hidden shadow-lg">
                <Image src={sol.cover_image} alt={sol.nom} fill sizes="(max-width:1024px) 100vw, 640px" className="object-cover" />
              </div>
            )}

            {/* Description */}
            {sol.description && (
              <div>
                <h2 className="text-xl font-bold font-heading text-gray-900 mb-3">Présentation</h2>
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">{sol.description}</p>
              </div>
            )}

            {/* Features */}
            {sol.features.length > 0 && (
              <div className="bg-[#fbf8f3] rounded-2xl p-6 border border-[#f0ebe3]">
                <h2 className="text-xl font-bold font-heading text-gray-900 mb-4">Fonctionnalités</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {sol.features.map((f, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircle className="w-4 h-4 text-[#e97e42] flex-shrink-0 mt-0.5" />{f}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* CTA latéral */}
          <div>
            <div className="bg-gradient-to-br from-[#0f172a] to-[#1e293b] rounded-3xl p-6 text-white sticky top-24">
              <FlaskConical className="w-8 h-8 text-[#e97e42] mb-3" />
              <h3 className="font-bold font-heading text-lg mb-2">Testez {sol.nom}</h3>
              <p className="text-sm text-white/70 mb-5">
                Solution ouverte au test et à la souscription. Lancez-vous dès maintenant.
              </p>
              {sol.app_url ? (
                <a href={sol.app_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#e97e42] to-[#d56a2e] text-white px-5 py-3 rounded-xl font-semibold hover:shadow-lg transition-all w-full">
                  <Play className="w-4 h-4" /> Accéder à l'application
                </a>
              ) : (
                <Link href="/contact" className="flex items-center justify-center gap-2 bg-white text-[#0f172a] px-5 py-3 rounded-xl font-semibold w-full">
                  Nous contacter
                </Link>
              )}
              <Link href="/studia-labs" className="block text-center text-sm text-white/50 hover:text-white mt-4">
                ← Toutes les solutions
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
