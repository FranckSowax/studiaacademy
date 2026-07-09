import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Building2, CalendarDays } from 'lucide-react'
import { FormationCard } from '@/components/formations-ia/FormationCard'
import { formationsIA, formatDateFr, getFormation } from '@/lib/formations-ia'
import { getSessionsBySlug } from '@/lib/formations-ia-data'

export const metadata: Metadata = {
  title: 'Formations IA à Libreville — Studia Academy',
  description:
    "4 journées de formation IA 100 % pratiques au Gabon : les bases, la communication, l'administratif et la direction. Sans prérequis technique, paiement Mobile Money.",
  openGraph: {
    title: 'Formations IA — Studia Academy',
    description:
      "L'IA, un avantage concurrentiel à la portée de toutes vos équipes. 4 formations d'une journée à Libreville.",
  },
}

export default async function FormationsIAHubPage() {
  const sessionsBySlug = await getSessionsBySlug()

  const prochaines = Object.entries(sessionsBySlug)
    .flatMap(([slug, sessions]) =>
      sessions.slice(0, 1).map((s) => ({ slug, ...s }))
    )
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 4)

  return (
    <div className="bg-[#f7f8fc] pt-16">
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 md:py-20">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#f5b301]">
          Studia Academy · Formations IA · Gabon
        </p>
        <h1 className="mt-3 max-w-3xl font-heading text-4xl font-extrabold leading-[1.1] text-[#141828] md:text-6xl">
          L&apos;intelligence artificielle, un avantage concurrentiel à la
          portée de toutes vos équipes.
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-[#4a5068]">
          Les outils existent, sont gratuits pour la plupart, et vos équipes les
          utilisent déjà — souvent mal, parfois au risque de vos données. Une
          journée de formation structurée transforme cette curiosité en
          productivité maîtrisée.
        </p>
      </section>

      {/* Le spectre Studia : les 4 formations */}
      <section className="mx-auto max-w-6xl px-4 pb-4 sm:px-6">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {formationsIA.map((f) => (
            <FormationCard key={f.slug} formation={f} />
          ))}
        </div>
      </section>

      {/* Logique de parcours */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <h2 className="font-heading text-2xl font-extrabold text-[#141828] md:text-3xl">
          Un parcours, pas un catalogue
        </h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            {
              step: 'Socle',
              titre: 'F1 pour tous',
              texte:
                'Chaque collaborateur maîtrise les bases : méthode R.C.T.F., 5 usages universels, réflexes de confidentialité.',
              couleur: '#4338ca',
            },
            {
              step: 'Métier',
              titre: 'F2 / F3 par fonction',
              texte:
                'Communication ou administratif : chacun approfondit sur SES vraies tâches, avec des livrables produits sur place.',
              couleur: '#db2777',
            },
            {
              step: 'Direction',
              titre: 'F4 Executive',
              texte:
                'Les dirigeants décident mieux et pilotent la feuille de route IA de toute l’organisation.',
              couleur: '#f5b301',
            },
          ].map((p) => (
            <div
              key={p.step}
              className="rounded-2xl border-t-4 bg-white p-6 shadow-[0_6px_20px_rgba(20,24,40,0.08)]"
              style={{ borderTopColor: p.couleur }}
            >
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#4a5068]">
                {p.step}
              </p>
              <h3 className="mt-1 font-heading text-lg font-extrabold text-[#141828]">
                {p.titre}
              </h3>
              <p className="mt-2 text-sm text-[#4a5068]">{p.texte}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Prochaines sessions */}
      <section className="border-y border-[#e8eaf3] bg-white">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <h2 className="flex items-center gap-2 font-heading text-xl font-extrabold text-[#141828]">
            <CalendarDays className="h-5 w-5 text-[#f5b301]" />
            Prochaines sessions à Libreville
          </h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {prochaines.map((s) => {
              const f = getFormation(s.slug)
              if (!f) return null
              return (
                <Link
                  key={s.id}
                  href={`/formations-ia/${f.slug}`}
                  className="group rounded-xl border border-[#e8eaf3] p-4 transition-colors hover:border-transparent hover:shadow-md"
                >
                  <p
                    className="text-xs font-extrabold uppercase tracking-wide"
                    style={{ color: f.executive ? '#8a6200' : f.from }}
                  >
                    {f.code} · {f.titre}
                  </p>
                  <p className="mt-1 text-sm font-semibold capitalize text-[#141828]">
                    {formatDateFr(s.date)}
                  </p>
                  <p className="mt-0.5 text-xs text-[#4a5068]">{s.lieu}</p>
                  {s.placesRestantes != null && (
                    <p className="mt-1 text-xs font-bold text-[#0d9488]">
                      {s.placesRestantes} places restantes
                    </p>
                  )}
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA entreprise */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-6 rounded-2xl bg-[#141828] p-8 text-white md:flex-row md:items-center md:p-10">
          <div>
            <h2 className="flex items-center gap-2 font-heading text-2xl font-extrabold">
              <Building2 className="h-6 w-6 text-[#f5b301]" />
              Former toute votre organisation ?
            </h2>
            <p className="mt-2 max-w-xl text-white/75">
              Le pack « Transformation IA » : F1 pour tous, F2/F3 par métier, F4
              pour la direction — en intra, dans vos locaux. Tarif préférentiel
              sur le parcours complet.
            </p>
          </div>
          <Link
            href="/formations-ia/entreprises"
            className="inline-flex items-center gap-2 rounded-xl bg-[#f5b301] px-6 py-3.5 text-sm font-extrabold text-[#141828]"
          >
            Demander un devis
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  )
}
