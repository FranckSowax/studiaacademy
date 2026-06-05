export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft, Monitor, PlayCircle } from 'lucide-react'
import { FormationsBrowser, type BrowserFormation } from '@/components/formations/FormationsBrowser'

export default async function FormationsEnLignePage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('formations')
    .select('id, slug, titre, sous_titre, categorie, niveau, prix_fcfa, cover_image, ordre, created_at')
    .eq('is_published', true)
    .order('ordre', { ascending: true })
    .order('created_at', { ascending: false })

  const formations = (data ?? []) as BrowserFormation[]

  return (
    <div className="relative flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 pt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <Link href="/formations" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#e97e42] mb-6">
            <ArrowLeft className="w-4 h-4" />
            Formations
          </Link>

          <div className="mb-8">
            <div className="inline-flex items-center gap-2 bg-[#fff7ed] text-[#a84d16] px-4 py-1.5 rounded-full text-sm font-medium mb-3">
              <Monitor className="w-4 h-4" />
              Formations en ligne
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold font-heading text-gray-900">
              Apprenez à votre rythme
            </h1>
            <p className="text-gray-500 mt-2">Des formations IA par secteur d'activité — cherchez la vôtre.</p>
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
            <FormationsBrowser formations={formations} />
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
