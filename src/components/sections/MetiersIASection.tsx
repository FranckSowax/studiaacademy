import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Briefcase, CheckCircle2, Sparkles } from 'lucide-react'
import { SECTEURS } from '@/lib/secteurs'

/**
 * Section d'accueil « une formation par métier » : pour chaque secteur, la formation qui
 * apprend les astuces du quotidien avec des outils IA accessibles (gratuits en priorité).
 */
export function MetiersIASection() {
  return (
    <section id="metiers" className="w-full border-y border-[#f0ebe3] bg-[#fbf8f3] py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-12 max-w-3xl text-center">
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

        <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {SECTEURS.map((s) => {
            const f = s.formation
            const aDuPayant = f.outils.some((o) => o.acces === 'payant')
            return (
              <li key={s.slug}>
                <Link
                  href={`/entreprise/secteur/${s.slug}`}
                  className="group flex h-full flex-col overflow-hidden rounded-3xl border border-[#ece4d8] bg-white transition-all hover:-translate-y-1 hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e97e42]"
                >
                  <div className="relative aspect-[16/9] w-full" style={{ backgroundColor: s.couleur }}>
                    <Image
                      src={s.cover}
                      alt=""
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                    <span className="absolute bottom-3 left-3 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-gray-800">
                      {s.label}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col p-6">
                    <h3 className="font-heading text-lg font-bold leading-snug text-gray-900">{f.titre}</h3>
                    <ul className="mt-4 space-y-2">
                      {f.cas.slice(0, 3).map((c) => (
                        <li key={c.titre} className="flex items-start gap-2 text-sm text-gray-600">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#e97e42]" />
                          <span>{c.titre}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-5 flex flex-wrap gap-1.5">
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

                    <div className="mt-auto flex items-center justify-between pt-5">
                      <span className="text-xs font-semibold text-emerald-800">
                        {aDuPayant ? 'Outils gratuits + option payante' : 'Outils 100 % gratuits'}
                      </span>
                      <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#a84d16]">
                        Voir le programme
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            )
          })}

          <li>
            <Link
              href="/contact"
              className="group flex h-full min-h-64 flex-col justify-between rounded-3xl bg-[#0f0d0b] p-8 text-white transition-all hover:-translate-y-1 hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e97e42]"
            >
              <Sparkles className="h-8 w-8 text-[#f3a268]" />
              <div>
                <h3 className="font-heading text-xl font-bold">Votre métier n&apos;est pas dans la liste&nbsp;?</h3>
                <p className="mt-2 text-sm text-gray-300">
                  Dites-nous ce que vous faites au quotidien : nous construisons la formation autour de
                  vos tâches.
                </p>
                <span className="mt-5 inline-flex items-center gap-2 font-semibold text-[#f3a268]">
                  Nous écrire
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          </li>
        </ul>
      </div>
    </section>
  )
}
