export const dynamic = 'force-dynamic'

import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { aiServices, coverFor } from '@/lib/ai-services/definitions'
import { Sparkles } from 'lucide-react'
import { OutilsCatalogue, type CatalogueService } from '@/components/outils/OutilsCatalogue'

export default async function OutilsPage({ searchParams }: { searchParams: Promise<{ p?: string }> }) {
  const { p } = await searchParams
  // Sérialisation côté serveur (sans buildPrompt, non transférable au client)
  const services: CatalogueService[] = aiServices.map((s) => ({
    slug: s.slug,
    titre: s.titre,
    sousTitre: s.sousTitre,
    description: s.description,
    couleur: s.couleur,
    category: s.category,
    badge: s.badge,
    prixCredits: s.prixCredits,
    iconName: s.iconName,
    cover: coverFor(s),
  }))

  return (
    <div className="relative flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 pt-24">
        {/* Hero */}
        <section className="bg-gradient-to-b from-[#fff7ed] to-white py-14">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 bg-white border border-[#f0ebe3] text-[#a84d16] px-4 py-1.5 rounded-full text-sm font-medium mb-5 shadow-sm">
              <Sparkles className="w-4 h-4" />
              Outils IA Studia
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold font-heading text-gray-900 mb-4">
              Des résultats concrets en{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#e97e42] to-[#d56a2e]">
                2 minutes
              </span>
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Pour les élèves, les profs, les parents et les pros : révisions, exercices, sujets, CV,
              candidatures, courriers… Générés par IA, prêts à utiliser.
            </p>
          </div>
        </section>

        {/* Catalogue avec filtre par persona */}
        <OutilsCatalogue services={services} initialPersona={p} />
      </main>
      <Footer />
    </div>
  )
}
