export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft, MapPin, CalendarDays } from 'lucide-react'
import { SessionCard } from '@/components/formations/SessionCard'
import { getAppConfig } from '@/lib/config/app-config'
import type { PresentielSession } from '@/types/formation'

/** Un événement commencé depuis moins de 24 h compte encore comme « à venir ». */
const depuisHier = () => new Date(Date.now() - 86400000).toISOString()

export default async function PresentielPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('presentiel_sessions')
    .select('*')
    .eq('is_published', true)
    .gte('date_debut', depuisHier())
    .order('date_debut', { ascending: true })

  const sessions = (data ?? []) as PresentielSession[]
  const airtelNumber =
    getAppConfig().payment.methods.find((m) => m.id === 'airtel_money')?.merchantNumber ?? null

  return (
    <div className="relative flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 pt-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <Link href="/formations" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#e97e42] mb-6">
            <ArrowLeft className="w-4 h-4" />
            Formations
          </Link>

          <div className="mb-10">
            <div className="inline-flex items-center gap-2 bg-[#fff7ed] text-[#a84d16] px-4 py-1.5 rounded-full text-sm font-medium mb-3">
              <MapPin className="w-4 h-4" />
              Agenda · Studia Academy, Libreville
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold font-heading text-gray-900">
              Formations, masterclass et événements
            </h1>
            <p className="text-gray-500 mt-2">
              Toutes les dates à venir à Studia Academy. Inscrivez-vous en ligne : les places sont limitées.
            </p>
          </div>

          {sessions.length === 0 ? (
            <div className="text-center py-20 bg-[#fbf8f3] rounded-3xl border border-[#f0ebe3]">
              <CalendarDays className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Aucune session programmée pour le moment.</p>
              <Link href="/contact" className="inline-block mt-4 text-[#a84d16] font-semibold hover:underline">
                Être informé·e des prochaines dates
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((s) => (
                <SessionCard key={s.id} session={s} airtelNumber={airtelNumber} />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
