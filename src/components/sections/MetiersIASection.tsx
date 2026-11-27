import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Briefcase, CheckCircle2, Sparkles } from 'lucide-react'
import { HorizontalGallery } from '@/components/home/HorizontalGallery'
import { SECTEURS } from '@/lib/secteurs'

const CARD = 'w-[82vw] max-w-[340px] flex-shrink-0 snap-start sm:w-[340px]'

/**
 * Section d'accueil « une formation par métier » : galerie horizontale où chaque carte met
 * d'abord en avant le secteur, puis la formation et ses outils IA (gratuits en priorité).
 */
export function MetiersIASection() {
  return (
    <section id="metiers" className="w-full border-y border-[#f0ebe3] bg-[#fbf8f3] py-16 md:py-24">
      <div className="mx-auto mb-8 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#fff7ed] px-3 py-1 text-sm font-medium text-[#a84d16]">
            <Briefcase className="h-4 w-4" />
            Une formation par métier
          </span>
          <h2 className="font-heading text-3xl font-extrabold text-gray-900 md:text-4xl">
            Boostez votre métier avec les bons outils IA
          </h2>
          <p className="mt-3 text-gray-600">
            Apprenez les astuces et les raccourcis de votre quotidien, à partir de situations réelles de
            votre travail. Des outils accessibles, gratuits d&apos;abord.
          </p>
        </div>
      </div>

      <HorizontalGallery label="Formations par secteur d'activité">
        {SECTEURS.map((s) => {
          const f = s.formation
          const aDuPayant = f.outils.some((o) => o.acces === 'payant')
          return (
            <li key={s.slug} className={CARD}>
              <Link
                href={`/entreprise/secteur/${s.slug}`}
                className="group flex h-full flex-col overflow-hidden rounded-3xl border border-[#ece4d8] bg-white transition-all hover:-translate-y-1 hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e97e42]"
              >
                {/* Le secteur est l'élément le plus visible de la carte */}
                <div className="relative aspect-[4/3] w-full" style={{ backgroundColor: s.couleur }}>
                  <Image src={s.cover} alt="" fill sizes="340px" className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-5">
                    <span className="mb-3 block h-1 w-10 rounded-full" style={{ backgroundColor: s.couleur }} />
                    <p className="font-heading text-2xl font-extrabold leading-tight text-white drop-shadow">
                      {s.label}
                    </p>
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <h3 className="font-heading text-base font-bold leading-snug text-gray-900">{f.titre}</h3>
                  <ul className="mt-3 space-y-2">
                    {f.cas.slice(0, 2).map((c) => (
                      <li key={c.titre} className="flex items-start gap-2 text-sm text-gray-600">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#e97e42]" />
                        <span>{c.titre}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {f.outils.map((o) => (
                      <span
                        key={o.nom}
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          o.acces === 'gratuit' ? 'bg-emerald-50 text-emerald-800' : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {o.nom}
                      </span>
                    ))}
                  </div>

                  <div className="mt-auto flex items-center justify-between gap-3 pt-5">
                    <span className="text-xs font-semibold text-emerald-800">
                      {aDuPayant ? 'Gratuit + option payante' : 'Outils 100 % gratuits'}
                    </span>
                    <span className="inline-flex items-center gap-1 whitespace-nowrap text-sm font-semibold text-[#a84d16]">
                      Le programme
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </div>
              </Link>
            </li>
          )
        })}

        <li className={CARD}>
          <Link
            href="/contact"
            className="group flex h-full min-h-80 flex-col justify-between rounded-3xl bg-[#0f0d0b] p-8 text-white transition-all hover:-translate-y-1 hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e97e42]"
          >
            <Sparkles className="h-8 w-8 text-[#f3a268]" />
            <div>
              <h3 className="font-heading text-xl font-bold">Votre métier n&apos;est pas dans la liste&nbsp;?</h3>
              <p className="mt-2 text-sm text-gray-300">
                Dites-nous ce que vous faites au quotidien : nous construisons la formation autour de vos
                tâches.
              </p>
              <span className="mt-5 inline-flex items-center gap-2 font-semibold text-[#f3a268]">
                Nous écrire
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </div>
          </Link>
        </li>
      </HorizontalGallery>
    </section>
  )
}
