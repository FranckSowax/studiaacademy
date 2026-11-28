export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { getSecteur, SECTEURS, type OutilIA } from '@/lib/secteurs'
import { WHATSAPP_NUMBER } from '@/lib/formations-ia'
import { getFormationsParSecteur } from '@/lib/formations/secteur-formations'
import { UpgradeMetierSticker } from '@/components/formations/UpgradeMetierSticker'
import {
  ArrowLeft, ArrowRight, Calculator, CheckCircle2, ChevronRight, ClipboardList, GraduationCap,
  HeartPulse, Landmark, MapPin, Megaphone, MessageCircle, Rocket, ShieldCheck, ShoppingBag,
  Sparkles, Sprout, Users, Wrench,
} from 'lucide-react'

/** Badge d'accès d'un outil : couleur et texte, jamais la couleur seule. */
const ACCES: Record<OutilIA['acces'], { libelle: string; classe: string }> = {
  gratuit: { libelle: 'Gratuit', classe: 'bg-emerald-50 text-emerald-800' },
  payant: { libelle: 'Option payante', classe: 'bg-gray-100 text-gray-700' },
  a_verifier: { libelle: 'Accès à vérifier', classe: 'bg-amber-50 text-amber-900' },
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Users, Landmark, ClipboardList, Calculator, ShoppingBag, Megaphone, GraduationCap, HeartPulse,
  Sprout, Rocket, Wrench,
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const s = getSecteur(slug)
  if (!s) return { title: 'Secteur' }
  return { title: `${s.formation.titre} — ${s.label} | Studia Academy`, description: s.formation.promesse }
}

export default async function SecteurPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const secteur = getSecteur(slug)
  if (!secteur) notFound()
  const SectorIcon = iconMap[secteur.iconName] ?? Sparkles
  const f = secteur.formation
  // Formation réelle créée dans l'admin et rattachée à ce secteur (absente tant qu'elle n'est pas publiée).
  const liee = (await getFormationsParSecteur()).get(secteur.slug)
  const waText = encodeURIComponent(
    `Bonjour Studia Academy, je suis intéressé(e) par la formation « ${f.titre} » (${secteur.label}).`,
  )

  return (
    <div className="relative flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {/* HERO — pt-16 = décalage du header fixe */}
        <section className="bg-[#0f0d0b] pt-16 text-white">
          <div className="relative overflow-hidden">
            <Image src={secteur.cover} alt="" fill priority sizes="100vw" className="object-cover object-[50%_12%]" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0f0d0b]/95 via-[#0f0d0b]/75 to-[#0f0d0b]/30" />
            <div className="relative mx-auto max-w-7xl px-4 pb-14 pt-10 sm:px-6 lg:px-8 lg:pb-20">
              <Link href="/#metiers" className="mb-6 inline-flex items-center gap-2 text-sm text-white/80 hover:text-white">
                <ArrowLeft className="h-4 w-4" />
                Toutes les formations métier
              </Link>
              <div className="max-w-2xl">
                <UpgradeMetierSticker className="mb-4 mr-3" />
                <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm font-medium backdrop-blur">
                  <SectorIcon className="h-4 w-4" />
                  {secteur.label}
                </span>
                <h1 className="mt-4 font-heading text-3xl font-extrabold leading-tight md:text-5xl">{f.titre}</h1>
                <p className="mt-4 text-lg text-gray-200">{f.promesse}</p>
                {liee?.live_code && (
                  <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#e97e42]/20 px-3 py-1 text-sm font-medium text-[#f8b98a]">
                    <Sparkles className="h-4 w-4" />
                    Formation interactive sur Studia Live
                  </p>
                )}
                <div className="mt-8 flex flex-wrap gap-3">
                  {liee ? (
                    <Link
                      href={`/formations/en-ligne/${liee.slug}`}
                      className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#e97e42] to-[#d56a2e] px-6 py-3.5 font-bold text-white shadow-lg shadow-[#e97e42]/30 transition-shadow hover:shadow-xl"
                    >
                      Commencer la formation
                      <ArrowRight className="h-5 w-5" />
                    </Link>
                  ) : (
                  <a
                    href={`https://wa.me/${WHATSAPP_NUMBER}?text=${waText}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#e97e42] to-[#d56a2e] px-6 py-3.5 font-bold text-white shadow-lg shadow-[#e97e42]/30 transition-shadow hover:shadow-xl"
                  >
                    <MessageCircle className="h-5 w-5" />
                    Je veux cette formation
                  </a>
                  )}
                  <a
                    href="#programme"
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/30 bg-white/10 px-6 py-3.5 font-bold text-white backdrop-blur transition-colors hover:bg-white hover:text-gray-900"
                  >
                    Voir le programme
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PROGRAMME */}
        <section id="programme" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[1fr_360px]">
            <div>
              <h2 className="font-heading text-2xl font-extrabold text-gray-900 md:text-3xl">
                5 situations réelles de votre métier
              </h2>
              <p className="mt-2 text-gray-600">
                Chaque leçon part d&apos;une tâche que vous faites déjà, et se termine par un prompt prêt à copier
                et un exercice sur vos propres documents.
              </p>
              <ol className="mt-8 space-y-4">
                {f.cas.map((c, i) => (
                  <li key={c.titre} className="flex gap-4 rounded-2xl border border-[#ece4d8] bg-white p-5">
                    <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#fff7ed] font-heading font-bold text-[#a84d16]">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div>
                      <h3 className="font-semibold text-gray-900">{c.titre}</h3>
                      <p className="mt-1 text-sm text-gray-500">Avec {c.outil}</p>
                    </div>
                  </li>
                ))}
              </ol>

              {f.garde_fou && (
                <div className="mt-6 flex items-start gap-3 rounded-2xl border border-[#ece4d8] bg-[#fbf8f3] p-5">
                  <ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#a84d16]" />
                  <p className="text-sm text-gray-700">
                    <strong className="text-gray-900">À retenir.</strong> {f.garde_fou}
                  </p>
                </div>
              )}
            </div>

            <aside className="space-y-6">
              <div className="rounded-3xl border border-[#ece4d8] bg-white p-6">
                <h2 className="font-heading text-lg font-bold text-gray-900">Les outils utilisés</h2>
                <ul className="mt-4 space-y-3">
                  {f.outils.map((o) => (
                    <li key={o.nom} className="flex items-center justify-between gap-3 text-sm">
                      <span className="flex items-center gap-2 text-gray-800">
                        <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-[#e97e42]" />
                        {o.nom}
                      </span>
                      <span
                        title={o.verifie_le ? `Vérifié le ${o.verifie_le.split('-').reverse().join('/')} sur la page officielle` : "Gratuité non confirmée par la page officielle de l'outil"}
                        className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${ACCES[o.acces].classe}`}
                      >
                        {ACCES[o.acces].libelle}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-xs text-gray-500">
                  Chaque exercice se fait sans abonnement, en simulation sur Studia Live. « Gratuit » et « Option payante » ont été vérifiés sur la page officielle de l&apos;outil ; « Accès à vérifier » signale une gratuité que cette page ne confirme pas.
                </p>
              </div>

              <div className="rounded-3xl border border-[#ece4d8] bg-[#fbf8f3] p-6">
                <MapPin className="h-5 w-5 text-[#e97e42]" />
                <h2 className="mt-3 font-heading text-lg font-bold text-gray-900">Pour toute une équipe</h2>
                <p className="mt-2 text-sm text-gray-600">
                  Cette formation peut être animée dans votre entreprise, sur vos propres documents.
                </p>
                <Link href="/contact" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#a84d16] hover:gap-2">
                  Demander une session
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </aside>
          </div>
        </section>

        {/* AUTRES MÉTIERS */}
        <section className="border-t border-[#f0ebe3] bg-[#fbf8f3]">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <h2 className="mb-4 font-heading text-lg font-bold text-gray-900">Les autres métiers</h2>
            <div className="flex flex-wrap gap-2">
              {SECTEURS.filter((s) => s.slug !== secteur.slug).map((s) => (
                <Link
                  key={s.slug}
                  href={`/entreprise/secteur/${s.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#ece4d8] bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-[#e97e42] hover:text-[#a84d16]"
                >
                  {s.label}
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
