import type { Metadata } from 'next'
import { BarChart3, GraduationCap, ShieldCheck, Users } from 'lucide-react'
import { FormDevisEntreprise } from '@/components/formations-ia/FormDevisEntreprise'
import { formationsIA } from '@/lib/formations-ia'

export const metadata: Metadata = {
  title: 'Formations IA en entreprise (intra) — Studia Academy',
  description:
    "Le pack « Transformation IA » : F1 pour tous, F2/F3 par métier, F4 pour la direction. Formations IA intra-entreprise à Libreville, montée en compétence mesurée.",
  openGraph: {
    title: 'Pack Transformation IA — Studia Academy',
    description:
      'Toute votre organisation montée en compétence IA, du guichet au comité de direction.',
  },
}

const benefices = [
  {
    icon: Users,
    titre: 'Toute l’organisation, du guichet au comité de direction',
    texte:
      'F1 donne le socle à tous, F2/F3 spécialisent par métier, F4 aligne la direction. Un langage commun, des usages cohérents.',
  },
  {
    icon: BarChart3,
    titre: 'Montée en compétence mesurée',
    texte:
      'Quiz d’acquis en direct, livrables vérifiés à chaud, gain de temps chiffré par participant, et rapports de session remis aux RH.',
  },
  {
    icon: ShieldCheck,
    titre: 'Vos données protégées',
    texte:
      'Chaque journée inclut un module confidentialité (anonymisation, catégories interdites, loi n°001/2011). Vos équipes gagnent en productivité sans exposer l’organisation.',
  },
  {
    icon: GraduationCap,
    titre: 'Autonomie durable',
    texte:
      'Kits complets (prompts, chartes, routines) : vos équipes restent autonomes après la formation — pas de dépendance à un prestataire.',
  },
]

export default function EntreprisesPage() {
  return (
    <div className="min-h-screen bg-[#f7f8fc] pt-16">
      {/* Hero */}
      <section className="bg-[#141828] text-white">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 md:py-20">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#f5b301]">
            Formations IA · Offre entreprises & institutions
          </p>
          <h1 className="mt-3 max-w-3xl font-heading text-3xl font-extrabold leading-tight md:text-5xl">
            Le pack « Transformation IA » :
            <span className="text-[#f5b301]"> toute votre organisation</span>,
            montée en compétence.
          </h1>
          <p className="mt-4 max-w-2xl text-white/80">
            En intra, dans vos locaux ou les nôtres, sur vos vrais documents et
            vos vrais enjeux. Tarif préférentiel sur le parcours complet et les
            sessions multiples.
          </p>
        </div>
      </section>

      {/* Parcours */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <h2 className="font-heading text-2xl font-extrabold text-[#141828] md:text-3xl">
          Le parcours complet
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {formationsIA.map((f) => (
            <div
              key={f.slug}
              className="rounded-2xl bg-white p-5 shadow-[0_6px_20px_rgba(20,24,40,0.08)]"
            >
              <span
                className="inline-block rounded-full px-3 py-1 text-xs font-extrabold text-white"
                style={{ background: `linear-gradient(135deg, ${f.from}, ${f.to})` }}
              >
                {f.code} · {f.tag}
              </span>
              <h3 className="mt-2 font-heading text-base font-extrabold text-[#141828]">
                {f.titre}
              </h3>
              <p className="mt-1 text-xs italic text-[#4a5068]">« {f.promesse} »</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-[#4a5068]">
          Déploiement recommandé : <b className="text-[#141828]">F4 en session inaugurale</b> (les
          dirigeants s&apos;alignent), puis F1 pour tous, puis F2/F3 par métier.
        </p>
      </section>

      {/* Bénéfices RH */}
      <section className="border-y border-[#e8eaf3] bg-white">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <h2 className="font-heading text-2xl font-extrabold text-[#141828] md:text-3xl">
            Ce que votre organisation y gagne
          </h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {benefices.map((b) => {
              const Icon = b.icon
              return (
                <div key={b.titre} className="flex gap-4 rounded-2xl border border-[#e8eaf3] p-6">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#fdf3d7]">
                    <Icon className="h-5 w-5 text-[#8a6200]" />
                  </div>
                  <div>
                    <h3 className="font-heading text-base font-extrabold text-[#141828]">
                      {b.titre}
                    </h3>
                    <p className="mt-1 text-sm text-[#4a5068]">{b.texte}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Formulaire devis */}
      <section className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <h2 className="font-heading text-2xl font-extrabold text-[#141828] md:text-3xl">
          Demander un devis
        </h2>
        <p className="mt-2 text-sm text-[#4a5068]">Réponse sous 48 h.</p>
        <div className="mt-6 rounded-2xl bg-white p-6 shadow-[0_10px_30px_rgba(20,24,40,0.10)] md:p-8">
          <FormDevisEntreprise />
        </div>
      </section>
    </div>
  )
}
