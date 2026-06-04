export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { createClient } from '@/lib/supabase/server'
import { getServiceBySlug, aiServices } from '@/lib/ai-services/definitions'
import { ToolRunner } from '@/components/outils/ToolRunner'
import type { Metadata } from 'next'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const s = getServiceBySlug(slug)
  if (!s) return {}
  return { title: `${s.titre} — Outils IA Studia`, description: s.description }
}

export default async function OutilPage({ params }: Props) {
  const { slug } = await params
  const service = getServiceBySlug(slug)
  if (!service) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let solde: number | null = null
  if (user) {
    const { data: wallet } = await supabase.from('wallets').select('balance').eq('user_id', user.id).maybeSingle()
    solde = wallet?.balance ?? null
  }

  // Sérialiser la définition sans la fonction buildPrompt (non transférable au client)
  const clientDef = {
    slug: service.slug,
    titre: service.titre,
    sousTitre: service.sousTitre,
    description: service.description,
    couleur: service.couleur,
    badge: service.badge,
    prixCredits: service.prixCredits,
    ctaLabel: service.ctaLabel,
    generateLabel: service.generateLabel,
    outputType: service.outputType,
    fields: service.fields,
  }

  return (
    <div className="relative flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 pt-24">
        <ToolRunner def={clientDef} isLoggedIn={!!user} solde={solde} />
      </main>
      <Footer />
    </div>
  )
}

export function generateStaticParams() {
  return aiServices.map((s) => ({ slug: s.slug }))
}
