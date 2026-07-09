import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ArrowRight,
  CalendarDays,
  CheckCircle,
  MessageCircle,
  Quote,
  Users,
} from 'lucide-react'
import { TimelineJournee } from '@/components/formations-ia/TimelineJournee'
import { StickyCTA } from '@/components/formations-ia/StickyCTA'
import { FormDevisEntreprise } from '@/components/formations-ia/FormDevisEntreprise'
import {
  WHATSAPP_NUMBER,
  fcfa,
  formatDateFr,
  formationsIA,
  getFormation,
} from '@/lib/formations-ia'
import { getSessionsBySlug } from '@/lib/formations-ia-data'

export function generateStaticParams() {
  return formationsIA.map((f) => ({ slug: f.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const f = getFormation(slug)
  if (!f) return {}
  return {
    title: `${f.titre} — Formation IA à Libreville | Studia Academy`,
    description: `« ${f.promesse} ». ${f.publicCible}. 1 journée, ${f.effectif}, Libreville.`,
    openGraph: {
      title: `${f.code} · ${f.titre} — Studia Academy`,
      description: `« ${f.promesse} »`,
    },
  }
}

export default async function FormationIAPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const f = getFormation(slug)
  if (!f) notFound()

  const sessionsBySlug = await getSessionsBySlug()
  const sessions = sessionsBySlug[f.slug] ?? []
  const prochaine = sessions[0]

  const waText = encodeURIComponent(
    `Bonjour Studia Academy, je suis intéressé(e) par la formation ${f.titre}.`
  )
  const isExec = !!f.executive

  return (
    <div className={isExec ? 'bg-[#f7f7f4] pt-16' : 'bg-[#f7f8fc] pt-16'}>
      {/* ── HERO ── */}
      <section
        className="relative overflow-hidden text-white"
        style={{
          background: isExec
            ? 'linear-gradient(140deg, #0e1120, #141828 55%, #2a2f4a)'
            : `linear-gradient(135deg, ${f.from}, ${f.to})`,
        }}
      >
        {/* Vidéo de fond abstraite (IA qui met de l'ordre) — bouclable, muette */}
        <video
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          poster={`/fia-hero-${f.slug}-poster.jpg`}
          aria-hidden
        >
          <source src={`/fia-hero-${f.slug}.mp4`} type="video/mp4" />
        </video>
        {/* Teinte de marque pour l'identité + lisibilité */}
        <div
          className="absolute inset-0"
          style={{
            background: isExec
              ? 'linear-gradient(140deg, rgba(14,17,32,0.90), rgba(20,24,40,0.72) 55%, rgba(42,47,74,0.62))'
              : `linear-gradient(135deg, ${f.from}e6, ${f.to}b3)`,
          }}
          aria-hidden
        />
        {/* Scrim latéral pour le texte */}
        <div
          className="absolute inset-0 bg-gradient-to-r from-black/45 via-black/10 to-transparent"
          aria-hidden
        />

        <div className="relative z-10 mx-auto max-w-6xl px-4 py-14 sm:px-6 md:py-20">
          <p
            className="text-xs font-bold uppercase tracking-[0.2em]"
            style={{ color: isExec ? '#f5b301' : 'rgba(255,255,255,0.85)' }}
          >
            {isExec && '★ '}Formation {f.code} · {f.tag}
          </p>
          <h1 className="mt-3 font-heading text-3xl font-extrabold leading-tight md:text-5xl">
            {f.titre}
            <span className="mt-1 block text-lg font-bold opacity-90 md:text-2xl">
              {f.sousTitre}
            </span>
          </h1>
          {/* La promesse, en très grand : c'est elle qui vend */}
          <p
            className="mt-6 max-w-3xl font-heading text-2xl font-extrabold italic leading-snug md:text-4xl"
            style={{ color: isExec ? '#f5b301' : '#ffe8a3' }}
          >
            « {f.promesse} »
          </p>
          <p className="mt-4 max-w-2xl text-white/80">{f.publicCible}</p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            {prochaine && (
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur">
                <CalendarDays className="h-4 w-4" />
                <span className="capitalize">{formatDateFr(prochaine.date)}</span>
                {prochaine.placesRestantes != null && (
                  <span className="text-[#ffe8a3]">
                    · {prochaine.placesRestantes} places restantes
                  </span>
                )}
              </span>
            )}
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur">
              <Users className="h-4 w-4" />
              {f.effectif}
            </span>
            <span className="inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-extrabold text-[#141828]">
              {f.prixFcfa ? `${fcfa(f.prixFcfa)} / participant` : 'Sur devis'}
            </span>
          </div>

          <div className="mt-8 hidden gap-3 md:flex">
            <Link
              href={
                isExec
                  ? '#entretien'
                  : `/formations-ia/inscription?f=${f.slug}${prochaine && !prochaine.id.startsWith('fallback-') ? `&session=${prochaine.id}` : ''}`
              }
              className="inline-flex items-center gap-2 rounded-xl bg-[#f5b301] px-7 py-3.5 text-sm font-extrabold text-[#141828]"
            >
              {isExec ? 'Demander un entretien' : "S'inscrire à cette session"}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${waText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border-2 border-white/30 px-7 py-3.5 text-sm font-bold text-white"
            >
              <MessageCircle className="h-4 w-4" />
              Poser une question
            </a>
          </div>
        </div>
      </section>

      {/* ── DOULEURS ── */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <h2 className="font-heading text-2xl font-extrabold text-[#141828] md:text-3xl">
          Cette journée est pour vous si…
        </h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {f.douleurs.map((d) => (
            <div
              key={d.titre}
              className="rounded-2xl bg-white p-6 shadow-[0_6px_20px_rgba(20,24,40,0.08)]"
            >
              <h3 className="font-heading text-base font-extrabold text-[#141828]">
                {d.titre}
              </h3>
              <p className="mt-2 text-sm text-[#4a5068]">{d.texte}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── TIMELINE ── */}
      <section className="mx-auto max-w-3xl px-4 pb-14 sm:px-6">
        <h2 className="font-heading text-2xl font-extrabold text-[#141828] md:text-3xl">
          Le déroulé de la journée
        </h2>
        <p className="mt-2 text-sm text-[#4a5068]">
          8h30 → 16h30 · pause déjeuner d&apos;une heure incluse
        </p>
        <div className="mt-8">
          <TimelineJournee steps={f.timeline} from={f.from} to={f.to} />
        </div>
      </section>

      {/* ── KIT ── */}
      <section className="border-y border-[#e8eaf3] bg-white">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <h2 className="font-heading text-2xl font-extrabold text-[#141828] md:text-3xl">
            Vous repartez avec
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {f.kit.map((k) => (
              <div
                key={k.titre}
                className="rounded-2xl border border-[#e8eaf3] p-5"
              >
                <CheckCircle
                  className="h-5 w-5"
                  style={{ color: isExec ? '#f5b301' : f.from }}
                />
                <h3 className="mt-2 font-heading text-sm font-extrabold text-[#141828]">
                  {k.titre}
                </h3>
                <p className="mt-1 text-sm text-[#4a5068]">{k.texte}</p>
              </div>
            ))}
          </div>
          <div className="mt-8">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#4a5068]">
              Outils pris en main
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {f.outils.map((o) => (
                <span
                  key={o}
                  className="rounded-full bg-[#f0f1fa] px-3 py-1.5 text-xs font-bold text-[#141828]"
                >
                  {o}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── MÉTHODE ── */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <h2 className="font-heading text-2xl font-extrabold text-[#141828] md:text-3xl">
          La méthode Studia
        </h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl bg-white p-6 shadow-[0_6px_20px_rgba(20,24,40,0.08)]">
            <p className="font-heading text-3xl font-extrabold" style={{ color: f.executive ? '#8a6200' : f.from }}>
              70&nbsp;%
            </p>
            <h3 className="mt-1 font-heading text-base font-extrabold text-[#141828]">
              de pratique sur VOS vraies tâches
            </h3>
            <p className="mt-2 text-sm text-[#4a5068]">
              On produit, on n&apos;écoute pas : chaque notion est immédiatement
              appliquée à votre quotidien, vos documents, votre marque.
            </p>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-[0_6px_20px_rgba(20,24,40,0.08)]">
            <p className="font-heading text-3xl font-extrabold" style={{ color: f.executive ? '#8a6200' : f.from }}>
              Mesuré
            </p>
            <h3 className="mt-1 font-heading text-base font-extrabold text-[#141828]">
              Évaluation en direct + suivi J+30
            </h3>
            <p className="mt-2 text-sm text-[#4a5068]">
              Quiz d&apos;acquis, livrables vérifiés à chaud, et suivi à J+30
              pour s&apos;assurer que les usages sont réellement installés.
            </p>
          </div>
        </div>
      </section>

      {/* ── TÉMOIGNAGES ── */}
      <section className="border-y border-[#e8eaf3] bg-white">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <h2 className="font-heading text-2xl font-extrabold text-[#141828] md:text-3xl">
            Ils l&apos;ont vécue
          </h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {f.temoignages.map((t) => (
              <figure
                key={t.auteur}
                className="rounded-2xl border border-[#e8eaf3] p-6"
              >
                <Quote className="h-6 w-6" style={{ color: '#f5b301' }} />
                <blockquote className="mt-3 text-sm italic text-[#141828]">
                  « {t.citation} »
                </blockquote>
                <figcaption className="mt-3 text-xs font-bold text-[#4a5068]">
                  {t.auteur} · {t.fonction}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ── TARIFS ou ENTRETIEN F4 ── */}
      {isExec ? (
        <section id="entretien" className="mx-auto max-w-3xl scroll-mt-20 px-4 py-14 sm:px-6">
          <h2 className="font-heading text-2xl font-extrabold text-[#141828] md:text-3xl">
            Demander un entretien
          </h2>
          <p className="mt-2 text-sm text-[#4a5068]">
            Format executive sur devis. Échange confidentiel, réponse sous 48 h.
          </p>
          <div className="mt-6 rounded-2xl bg-white p-6 shadow-[0_10px_30px_rgba(20,24,40,0.10)] md:p-8">
            <FormDevisEntreprise variant="entretien-f4" />
          </div>
        </section>
      ) : (
        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <h2 className="font-heading text-2xl font-extrabold text-[#141828] md:text-3xl">
            Tarifs
          </h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-white p-6 shadow-[0_6px_20px_rgba(20,24,40,0.08)]">
              <p className="text-xs font-bold uppercase tracking-wide text-[#4a5068]">Individuel</p>
              <p className="mt-2 font-heading text-2xl font-extrabold text-[#141828]">
                {f.prixFcfa ? fcfa(f.prixFcfa) : '—'}
              </p>
              <p className="mt-1 text-sm text-[#4a5068]">par participant, kit et suivi J+30 inclus</p>
            </div>
            <div className="rounded-2xl border-2 bg-white p-6" style={{ borderColor: f.from }}>
              <p className="text-xs font-bold uppercase tracking-wide" style={{ color: f.from }}>
                Groupe · 3 participants et +
              </p>
              <p className="mt-2 font-heading text-2xl font-extrabold text-[#141828]">
                {f.prixGroupeFcfa ? fcfa(f.prixGroupeFcfa) : '—'}
              </p>
              <p className="mt-1 text-sm text-[#4a5068]">par participant (−15 %), même structure</p>
            </div>
            <div className="rounded-2xl bg-[#141828] p-6 text-white">
              <p className="text-xs font-bold uppercase tracking-wide text-[#f5b301]">Intra-entreprise</p>
              <p className="mt-2 font-heading text-2xl font-extrabold">Sur devis</p>
              <Link href="/formations-ia/entreprises" className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-[#f5b301]">
                Former toute une équipe <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Sessions + CTA */}
          {sessions.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-3">
              {sessions.map((s) => (
                <Link
                  key={s.id}
                  href={`/formations-ia/inscription?f=${f.slug}${s.id.startsWith('fallback-') ? '' : `&session=${s.id}`}`}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#e3e5f0] bg-white px-4 py-2.5 text-sm font-semibold capitalize text-[#141828] hover:border-transparent hover:shadow-md"
                >
                  <CalendarDays className="h-4 w-4" style={{ color: f.from }} />
                  {formatDateFr(s.date)}
                </Link>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── FAQ ── */}
      <section className="border-t border-[#e8eaf3] bg-white pb-28 md:pb-14">
        <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
          <h2 className="font-heading text-2xl font-extrabold text-[#141828] md:text-3xl">
            Questions fréquentes
          </h2>
          <div className="mt-6 divide-y divide-[#e8eaf3]">
            {f.faq.map((item) => (
              <details key={item.q} className="group py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-heading text-sm font-extrabold text-[#141828]">
                  {item.q}
                  <span className="text-[#f5b301] transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-2 text-sm text-[#4a5068]">{item.r}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <StickyCTA
        slug={f.slug}
        titre={f.titre}
        from={f.from}
        to={f.to}
        executive={isExec}
      />
    </div>
  )
}
