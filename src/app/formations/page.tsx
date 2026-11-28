export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { createClient } from '@/lib/supabase/server'
import { afficherNumeroWhatsApp, WHATSAPP_NUMBER } from '@/lib/formations-ia'
import {
  ArrowRight, Award, Briefcase, Building2, CalendarDays, Clock, MapPin, MessageCircle, Monitor, Users,
  type LucideIcon,
} from 'lucide-react'
import { getFormationsParSecteur } from '@/lib/formations/secteur-formations'
import { horsCollectionMetier } from '@/lib/formations/secteur-link'
import { EVENT_TYPE_LABELS, lienEvenement, placesRestantes, typeEvenement } from '@/lib/events/rules'
import { formatNumber } from '@/lib/utils'
import { PlacesLimiteesBandeau } from '@/components/formations/PlacesLimiteesBandeau'
import { etatPlaces } from '@/lib/formations/places'
import { getPlacesFormations } from '@/lib/formations/places-data'
import type { PresentielSession } from '@/types/formation'

export const metadata: Metadata = {
  title: 'Formations — Studia Academy',
  description:
    'En ligne à votre rythme, en présentiel à Libreville ou par métier : trouvez la formation Studia Academy qui vous correspond et inscrivez-vous en ligne.',
}

const FUSEAU = 'Africa/Libreville'

interface FormationCarte {
  id: string
  slug: string
  titre: string
  categorie: string | null
  niveau: string | null
  duree_estimee: string | null
  prix_fcfa: number | null
  cover_image: string | null
}

interface Parcours {
  icon: LucideIcon
  profil: string
  titre: string
  texte: string
  info: string
  href: string
  action: string
  accent?: boolean
}

/** Un événement commencé depuis moins de 24 h compte encore comme « à venir ». */
const depuisHier = () => new Date(Date.now() - 24 * 3600 * 1000).toISOString()

const prix = (montant: number | null | undefined) => ((montant ?? 0) > 0 ? `${formatNumber(montant ?? 0)} FCFA` : 'Gratuit')

/**
 * /formations — page d'orientation : elle aide l'élève ou le candidat à
 * choisir son format (en ligne, en présentiel, par métier, pour une équipe),
 * montre les prochaines dates et explique comment s'inscrire.
 */
export default async function FormationsLandingPage() {
  const supabase = await createClient()
  const hier = depuisHier()

  const [collection, places, formationsRes, evenementsRes] = await Promise.all([
    getFormationsParSecteur(),
    getPlacesFormations(supabase),
    supabase
      .from('formations')
      .select('id, slug, titre, categorie, niveau, duree_estimee, prix_fcfa, cover_image')
      .eq('is_published', true)
      .order('ordre', { ascending: true })
      .order('created_at', { ascending: false }),
    supabase
      .from('presentiel_sessions')
      .select('*')
      .eq('is_published', true)
      .gte('date_debut', hier)
      .order('date_debut', { ascending: true }),
  ])

  // La collection « Upgrade Métier » a sa propre entrée : hors du catalogue en ligne.
  const enLigne = horsCollectionMetier((formationsRes.data ?? []) as FormationCarte[], collection)
  const evenements = (evenementsRes.data ?? []) as PresentielSession[]
  const pluriel = (n: number, mot: string) => `${n} ${mot}${n > 1 ? 's' : ''}`

  const parcours: Parcours[] = [
    {
      icon: Monitor,
      profil: 'Je veux apprendre à mon rythme',
      titre: 'Formations en ligne',
      texte: 'Leçons animées, exercices interactifs et assistant IA, sur téléphone ou ordinateur. Certificat à la clé.',
      info: enLigne.length > 0 ? `${pluriel(enLigne.length, 'formation')} disponible${enLigne.length > 1 ? 's' : ''}` : 'Catalogue en préparation',
      href: '/formations/en-ligne',
      action: 'Voir le catalogue',
      accent: true,
    },
    {
      icon: MapPin,
      profil: 'Je préfère la salle, avec un formateur',
      titre: 'En présentiel à Libreville',
      texte: 'Formations, masterclass et présentations à Studia Academy, en petit groupe. Places limitées.',
      info: evenements.length > 0 ? `${pluriel(evenements.length, 'date')} à venir` : 'Prochaines dates bientôt annoncées',
      href: '/formations/presentiel',
      action: 'Voir l’agenda',
    },
    {
      icon: Briefcase,
      profil: 'Je veux une formation pour mon métier',
      titre: 'Collection Upgrade Métier',
      texte: 'Une formation IA par secteur : RH, comptabilité, commerce, santé, éducation… avec les outils utiles à votre poste.',
      info: '11 métiers couverts',
      href: '/#metiers',
      action: 'Choisir mon métier',
    },
    {
      icon: Building2,
      profil: 'Je forme mon équipe',
      titre: 'Entreprises et organisations',
      texte: 'Diagnostic gratuit des besoins, puis un plan de formation sur mesure, dans vos locaux ou à Studia Academy.',
      info: 'Diagnostic gratuit',
      href: '/entreprise',
      action: 'Découvrir l’offre',
    },
  ]

  const etapes = [
    { titre: 'Choisissez', texte: 'Un format, puis une formation ou une date dans l’agenda.' },
    { titre: 'Inscrivez-vous en ligne', texte: 'En quelques champs, avec votre numéro WhatsApp. Les places en salle sont retenues tout de suite.' },
    { titre: 'Réglez si la formation est payante', texte: 'Par Airtel Money, avec la capture d’écran du paiement, ou en espèces à Studia Academy.' },
    { titre: 'Apprenez', texte: 'L’équipe valide votre inscription, vous prévient sur WhatsApp, et vous commencez.' },
  ]

  return (
    <div className="relative flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {/* Accroche + choix du parcours */}
        <section className="relative overflow-hidden bg-gradient-to-b from-[#fff7ed] to-white pb-16 pt-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-[#a84d16]">Formations Studia Academy</p>
              <h1 className="font-heading text-4xl font-extrabold leading-tight text-gray-900 md:text-5xl">
                Quelle formation est faite <span className="text-[#e97e42]">pour vous</span> ?
              </h1>
              <p className="mt-4 text-lg text-gray-600">
                Partez de votre situation : choisissez l’entrée qui vous ressemble, on vous amène au bon endroit.
              </p>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {parcours.map((p) => (
                <Link
                  key={p.href}
                  href={p.href}
                  className={`group flex flex-col rounded-3xl border p-6 transition-all hover:-translate-y-1 hover:shadow-xl ${
                    p.accent
                      ? 'border-transparent bg-gradient-to-br from-[#e97e42] to-[#d56a2e] text-white'
                      : 'border-[#f0ebe3] bg-white hover:border-[#e97e42]'
                  }`}
                >
                  <span className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${p.accent ? 'bg-white/20' : 'bg-[#fff7ed]'}`}>
                    <p.icon className={`h-6 w-6 ${p.accent ? 'text-white' : 'text-[#e97e42]'}`} />
                  </span>
                  <p className={`text-sm font-medium ${p.accent ? 'text-white/90' : 'text-[#a84d16]'}`}>« {p.profil} »</p>
                  <h2 className={`mt-1 font-heading text-xl font-bold ${p.accent ? 'text-white' : 'text-gray-900'}`}>{p.titre}</h2>
                  <p className={`mt-2 flex-1 text-sm ${p.accent ? 'text-white/90' : 'text-gray-600'}`}>{p.texte}</p>
                  <p className={`mt-4 text-xs font-semibold uppercase tracking-wide ${p.accent ? 'text-white/80' : 'text-gray-500'}`}>{p.info}</p>
                  <span className={`mt-3 inline-flex items-center gap-1.5 font-semibold transition-all group-hover:gap-2.5 ${p.accent ? 'text-white' : 'text-[#a84d16]'}`}>
                    {p.action} <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Prochaines dates en présentiel */}
        <section className="bg-white py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-[#a84d16]">À Studia Academy, Libreville</p>
                <h2 className="mt-1 font-heading text-2xl font-bold text-gray-900 md:text-3xl">Prochaines dates en présentiel</h2>
              </div>
              <Link href="/formations/presentiel" className="inline-flex items-center gap-1.5 font-semibold text-[#a84d16] hover:underline">
                Tout l’agenda <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {evenements.length === 0 ? (
              <div className="rounded-3xl border border-[#f0ebe3] bg-[#fbf8f3] p-10 text-center">
                <CalendarDays className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                <p className="text-gray-600">Les prochaines dates seront annoncées ici.</p>
                <Link href="/contact" className="mt-3 inline-block font-semibold text-[#a84d16] hover:underline">
                  Être prévenu·e des prochaines dates
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                {evenements.slice(0, 3).map((e) => {
                  const date = new Date(e.date_debut)
                  const places = placesRestantes(e)
                  return (
                    <Link
                      key={e.id}
                      href={lienEvenement(e.id)}
                      className="group flex flex-col overflow-hidden rounded-2xl border border-[#f0ebe3] bg-white transition-shadow hover:shadow-lg"
                    >
                      <div className="relative aspect-[16/9] bg-gradient-to-br from-[#fff7ed] to-[#fde8d3]">
                        {e.cover_image && (
                          // eslint-disable-next-line @next/next/no-img-element -- adresse libre saisie par l'admin (hôte non prévu par next/image)
                          <img src={e.cover_image} alt="" loading="lazy" className="h-full w-full object-cover" />
                        )}
                        <span className="absolute left-3 top-3 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-[#a84d16] shadow-sm">
                          {EVENT_TYPE_LABELS[typeEvenement(e)]}
                        </span>
                        <span className="absolute right-3 top-3 rounded-full bg-gray-900/80 px-2.5 py-1 text-xs font-semibold text-white">
                          {prix(e.prix_fcfa)}
                        </span>
                      </div>
                      <div className="flex flex-1 flex-col p-4">
                        <p className="text-sm font-semibold capitalize text-[#a84d16]">
                          {date.toLocaleDateString('fr-FR', { timeZone: FUSEAU, weekday: 'long', day: 'numeric', month: 'long' })} ·{' '}
                          {date.toLocaleTimeString('fr-FR', { timeZone: FUSEAU, hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <h3 className="mt-1 line-clamp-2 font-heading font-bold text-gray-900 group-hover:text-[#a84d16]">{e.titre}</h3>
                        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-3 text-xs text-gray-500">
                          <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{e.lieu || e.ville}</span>
                          <span className={`inline-flex items-center gap-1 ${places === 0 ? 'text-red-600' : places <= 3 ? 'text-amber-700' : ''}`}>
                            <Users className="h-3.5 w-3.5" />
                            {places === 0 ? 'Complet' : `${pluriel(places, 'place')} restante${places > 1 ? 's' : ''}`}
                          </span>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </section>

        {/* Formations en ligne à la une */}
        {enLigne.length > 0 && (
          <section className="bg-[#fbf8f3] py-16">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wider text-[#a84d16]">Où que vous soyez</p>
                  <h2 className="mt-1 font-heading text-2xl font-bold text-gray-900 md:text-3xl">Formations en ligne à découvrir</h2>
                </div>
                <Link href="/formations/en-ligne" className="inline-flex items-center gap-1.5 font-semibold text-[#a84d16] hover:underline">
                  Tout le catalogue <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {enLigne.slice(0, 4).map((f) => (
                  <Link
                    key={f.id}
                    href={`/formations/en-ligne/${f.slug}`}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-[#f0ebe3] bg-white transition-shadow hover:shadow-lg"
                  >
                    <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-[#fff7ed] to-[#fde8d3]">
                      {f.cover_image && (
                        // eslint-disable-next-line @next/next/no-img-element -- adresse libre saisie par l'admin (hôte non prévu par next/image)
                        <img src={f.cover_image} alt="" loading="lazy" className="h-full w-full object-cover" />
                      )}
                      <span className="absolute right-3 top-3 rounded-full bg-gray-900/80 px-2.5 py-1 text-xs font-semibold text-white">
                        {prix(f.prix_fcfa)}
                      </span>
                      <PlacesLimiteesBandeau etat={etatPlaces(places[f.id]?.max, places[f.id]?.prises)} />
                    </div>
                    <div className="flex flex-1 flex-col p-4">
                      {f.categorie && <p className="text-xs font-semibold uppercase tracking-wide text-[#a84d16]">{f.categorie}</p>}
                      <h3 className="mt-1 line-clamp-2 font-heading font-bold text-gray-900 group-hover:text-[#a84d16]">{f.titre}</h3>
                      <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-3 text-xs text-gray-500">
                        {f.niveau && <span>{f.niveau}</span>}
                        {f.duree_estimee && <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{f.duree_estimee}</span>}
                        <span className="inline-flex items-center gap-1"><Award className="h-3.5 w-3.5" />Certificat</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Comment s'inscrire */}
        <section className="bg-white py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-center font-heading text-2xl font-bold text-gray-900 md:text-3xl">Comment s’inscrire</h2>
            <ol className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {etapes.map((e, i) => (
                <li key={e.titre} className="rounded-2xl border border-[#f0ebe3] bg-[#fbf8f3] p-5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e97e42] font-heading font-bold text-white">{i + 1}</span>
                  <h3 className="mt-3 font-heading font-bold text-gray-900">{e.titre}</h3>
                  <p className="mt-1 text-sm text-gray-600">{e.texte}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Conseil */}
        <section className="bg-[#141828] py-16 text-white">
          <div className="mx-auto max-w-3xl px-4 text-center">
            <h2 className="font-heading text-2xl font-bold md:text-3xl">Vous hésitez encore ?</h2>
            <p className="mt-3 text-white/80">
              Dites-nous votre métier et votre objectif : l’équipe vous oriente vers la bonne formation, sans engagement.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Bonjour, je souhaite des conseils pour choisir une formation.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-500 px-7 py-3.5 font-semibold text-white transition-colors hover:bg-green-600"
              >
                <MessageCircle className="h-5 w-5" />
                WhatsApp · {afficherNumeroWhatsApp(WHATSAPP_NUMBER)}
              </a>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 px-7 py-3.5 font-semibold text-white transition-colors hover:bg-white/10"
              >
                Écrire à l’équipe <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
