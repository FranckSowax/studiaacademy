export const dynamic = 'force-dynamic'

import Link from 'next/link'
import Image from 'next/image'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { createClient } from '@/lib/supabase/server'
import { formatNumber } from '@/lib/utils'
import { ArrowLeft, ArrowRight, Clock, BarChart, Monitor, PlayCircle } from 'lucide-react'
import type { Formation } from '@/types/formation'

export default async function FormationsEnLignePage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('formations')
    .select('*')
    .eq('is_published', true)
    .order('ordre', { ascending: true })
    .order('created_at', { ascending: false })

  const formations = (data ?? []) as Formation[]

  return (
    <div className="relative flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 pt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <Link href="/formations" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#e97e42] mb-6">
            <ArrowLeft className="w-4 h-4" />
            Formations
          </Link>

          <div className="mb-10">
            <div className="inline-flex items-center gap-2 bg-[#fff7ed] text-[#a84d16] px-4 py-1.5 rounded-full text-sm font-medium mb-3">
              <Monitor className="w-4 h-4" />
              Formations en ligne
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold font-heading text-gray-900">
              Apprenez à votre rythme
            </h1>
            <p className="text-gray-500 mt-2">Vidéos, supports et suivi de progression sur notre plateforme.</p>
          </div>

          {formations.length === 0 ? (
            <div className="text-center py-20 bg-[#fbf8f3] rounded-3xl border border-[#f0ebe3]">
              <PlayCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Les premières formations arrivent bientôt.</p>
              <Link href="/contact" className="inline-block mt-4 text-[#a84d16] font-semibold hover:underline">
                Être prévenu·e
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {formations.map((f) => (
                <Link
                  key={f.id}
                  href={`/formations/en-ligne/${f.slug}`}
                  className="group bg-white rounded-2xl border border-[#f0ebe3] overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all"
                >
                  <div className="relative h-40 w-full bg-[#fbf8f3]">
                    {f.cover_image ? (
                      <Image src={f.cover_image} alt={f.titre} fill sizes="(max-width:768px) 100vw, 33vw" className="object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#e97e42]/20 to-[#fff7ed] flex items-center justify-center">
                        <Monitor className="w-10 h-10 text-[#e97e42]" />
                      </div>
                    )}
                    {f.categorie && (
                      <span className="absolute top-3 left-3 bg-white/90 text-gray-700 text-xs font-medium px-2.5 py-1 rounded-full">
                        {f.categorie}
                      </span>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold font-heading text-gray-900 mb-1 group-hover:text-[#e97e42] transition-colors line-clamp-2">
                      {f.titre}
                    </h3>
                    {f.sous_titre && <p className="text-sm text-gray-500 mb-3 line-clamp-2">{f.sous_titre}</p>}
                    <div className="flex items-center gap-3 text-xs text-gray-400 mb-4">
                      {f.duree_estimee && (
                        <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{f.duree_estimee}</span>
                      )}
                      <span className="inline-flex items-center gap-1"><BarChart className="w-3.5 h-3.5" />{f.niveau}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#e97e42]">
                        {f.prix_fcfa > 0 ? `${formatNumber(f.prix_fcfa)} FCFA` : 'Gratuit'}
                      </span>
                      <span className="inline-flex items-center gap-1 text-sm font-semibold text-gray-700 group-hover:text-[#e97e42] transition-colors">
                        Découvrir <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
