export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { aiServices } from '@/lib/ai-services/definitions'
import {
  ArrowRight, Megaphone, FileText, FileCheck, FileSignature, Briefcase, Sparkles,
  CheckCircle, BarChart3, Clock, ShieldCheck, Building2, Users, Rocket,
  GraduationCap, Target, MessageSquare, ChevronRight,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Entreprise — Former vos équipes à l\'IA & au digital | Studia Academy',
  description:
    "Montez en compétences vos équipes sur l'IA et la digitalisation, localement et à coût maîtrisé. Micro-services RH à l'IA, formations sur mesure et diagnostic gratuit des effectifs.",
}

const iconMap: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  Megaphone, FileText, FileCheck, FileSignature, Briefcase,
}

const packs = [
  {
    nom: 'Découverte', sousTitre: 'Acculturation IA', couleur: '#16A34A',
    pitch: "Sensibiliser dirigeants et équipes aux usages concrets de l'IA.",
    points: ['IA générative au travail', 'Cybersécurité de base', 'Webinaire dirigeant'],
    duree: '~18 h · 1 mois', niveau: 'Initiation',
  },
  {
    nom: 'Transformation', sousTitre: 'Digitalisation opérationnelle', couleur: '#7C3AED', featured: true,
    pitch: 'Digitaliser les process et automatiser les tâches à faible valeur.',
    points: ['IA + automatisation no-code', 'Digitalisation des process', 'Data & tableaux de bord', 'Conduite du changement'],
    duree: '~60 h · 3 mois · cohortes', niveau: 'Intermédiaire',
  },
  {
    nom: 'Sur-mesure', sousTitre: 'Stratégie & déploiement', couleur: '#e97e42',
    pitch: 'Un pack 100 % personnalisé, issu du diagnostic de vos effectifs.',
    points: ['Diagnostic des compétences', 'Formations ciblées sur vos lacunes', 'Session intra dédiée', 'Suivi d\'adoption'],
    duree: 'Selon besoins', niveau: 'Tous niveaux',
  },
]

const faqs = [
  { q: 'C\'est trop cher de former mes équipes ?', r: "Nos parcours sont à distance ou en intra, sans frais de déplacement à l'étranger. Vous payez en FCFA, par pack, avec un retour sur investissement mesurable (temps gagné, process digitalisés)." },
  { q: 'Mes équipes n\'ont pas le niveau pour l\'IA ?', r: "C'est justement l'objectif du diagnostic gratuit : mesurer le niveau réel par domaine, puis proposer des formations adaptées — de l'initiation à l'avancé." },
  { q: 'La connexion internet est faible chez nous ?', r: "Les contenus sont légers et accessibles sur mobile. Les sessions peuvent aussi se tenir en présentiel intra-entreprise." },
  { q: 'L\'IA va-t-elle remplacer mes salariés ?', r: "Non : l'IA augmente la productivité de vos équipes. Bien formées, elles font plus et mieux. Notre rôle est de les rendre autonomes sur ces outils." },
  { q: 'Mes données restent-elles confidentielles ?', r: "Les diagnostics sont agrégés et anonymisés : aucun résultat n'est nominatif. Vos données sont protégées (accès restreint par compte)." },
]

export default async function EntreprisePage() {
  const services = aiServices.filter((s) => s.category === 'entreprise')

  return (
    <div className="relative flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">

        {/* HERO */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#2e1065] via-[#4c1d95] to-[#7C3AED] text-white pt-28 pb-20">
          <div className="pointer-events-none absolute -top-24 -right-24 w-[40vw] h-[40vw] rounded-full bg-[#e97e42]/20 blur-3xl" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <span className="inline-flex items-center gap-2 bg-white/10 border border-white/15 px-3 py-1.5 rounded-full text-sm font-medium mb-5">
                <Building2 className="w-4 h-4" />Pour les RH & dirigeants au Gabon
              </span>
              <h1 className="text-4xl md:text-5xl font-extrabold font-heading leading-tight mb-5">
                Formez vos équipes à l&apos;IA et au digital — <span className="text-[#fcb88a]">sans envoyer personne à l&apos;étranger.</span>
              </h1>
              <p className="text-lg text-white/80 mb-8 max-w-xl">
                Micro-services RH à l&apos;IA, formations sur mesure et un diagnostic gratuit du niveau de vos effectifs. Localement, en FCFA, à coût maîtrisé.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/contact?sujet=diagnostic" className="inline-flex items-center justify-center gap-2 bg-[#e97e42] hover:bg-[#d56a2e] text-white rounded-2xl px-7 py-4 text-base font-bold transition-colors">
                  <BarChart3 className="w-5 h-5" />Évaluer mes effectifs — gratuit
                </Link>
                <Link href="#contact" className="inline-flex items-center justify-center gap-2 border-2 border-white/30 hover:bg-white/10 text-white rounded-2xl px-7 py-4 text-base font-semibold transition-colors">
                  Parler à un conseiller
                </Link>
              </div>
              <p className="text-white/50 text-sm mt-4">Propulsé par l&apos;IA · Sans engagement · Réponse sous 48 h</p>
            </div>

            {/* mockup rapport */}
            <div className="relative hidden lg:block">
              <div className="bg-white/95 rounded-3xl p-6 shadow-2xl text-gray-900 rotate-1">
                <div className="flex items-center justify-between mb-4">
                  <p className="font-bold font-heading">Diagnostic des effectifs</p>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">Rapport</span>
                </div>
                {[
                  { d: 'IA générative', p: 38, c: '#e11d48' },
                  { d: 'Bureautique', p: 72, c: '#16a34a' },
                  { d: 'Data & tableaux de bord', p: 45, c: '#f59e0b' },
                  { d: 'Communication digitale', p: 61, c: '#2563eb' },
                  { d: 'Cybersécurité', p: 29, c: '#e11d48' },
                ].map((r) => (
                  <div key={r.d} className="mb-3">
                    <div className="flex justify-between text-sm mb-1"><span className="text-gray-600">{r.d}</span><span className="font-semibold">{r.p}%</span></div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${r.p}%`, backgroundColor: r.c }} /></div>
                  </div>
                ))}
                <div className="mt-4 bg-[#fff7ed] rounded-xl p-3 text-sm text-[#a84d16] font-medium flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />Pack recommandé : Transformation digitale
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* BÉNÉFICES */}
        <section className="bg-[#faf8f5] border-y border-[#f0ebe3]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: BarChart3, v: '-70 %', l: 'vs formation à l\'étranger' },
              { icon: Clock, v: '48 h', l: 'pour votre rapport d\'effectifs' },
              { icon: Building2, v: '100 %', l: 'à distance ou en intra' },
              { icon: ShieldCheck, v: 'FCFA', l: 'paiement local, sans engagement' },
            ].map((b) => (
              <div key={b.l} className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#7C3AED]/10 flex items-center justify-center flex-shrink-0"><b.icon className="w-5 h-5 text-[#7C3AED]" /></div>
                <div><p className="text-xl font-extrabold font-heading text-gray-900">{b.v}</p><p className="text-xs text-gray-500">{b.l}</p></div>
              </div>
            ))}
          </div>
        </section>

        {/* PIVOT : DIAGNOSTIC GRATUIT */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-gradient-to-br from-[#7C3AED] to-[#4c1d95] rounded-3xl p-8 md:p-12 text-white relative overflow-hidden">
            <div className="pointer-events-none absolute -bottom-20 -left-10 w-72 h-72 rounded-full bg-[#e97e42]/20 blur-3xl" />
            <div className="relative grid lg:grid-cols-2 gap-8 items-center">
              <div>
                <span className="inline-block bg-[#e97e42] text-white text-xs font-bold px-3 py-1 rounded-full mb-4">GRATUIT · SANS ENGAGEMENT</span>
                <h2 className="text-3xl font-extrabold font-heading mb-4">Évaluez le niveau digital de vos équipes</h2>
                <p className="text-white/80 mb-6">Envoyez un test de compétences à vos collaborateurs. En 48 h, recevez un rapport clair du niveau de vos effectifs par domaine — et une proposition de formation sur mesure.</p>
                <Link href="/contact?sujet=diagnostic" className="inline-flex items-center gap-2 bg-white text-[#4c1d95] rounded-2xl px-7 py-4 font-bold hover:bg-white/90 transition-colors">
                  Lancer mon diagnostic gratuit <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
              <div className="space-y-3">
                {[
                  { n: 1, t: 'Vous recevez un lien de test', d: 'À partager à vos salariés (même sans compte).' },
                  { n: 2, t: 'Chacun répond en quelques minutes', d: 'Test de compétences par domaine, anonyme.' },
                  { n: 3, t: 'Vous recevez le rapport + un pack', d: 'Niveaux, lacunes prioritaires, formations recommandées.' },
                ].map((s) => (
                  <div key={s.n} className="flex items-start gap-3 bg-white/10 rounded-2xl p-4">
                    <span className="w-8 h-8 rounded-full bg-white text-[#4c1d95] font-extrabold flex items-center justify-center flex-shrink-0">{s.n}</span>
                    <div><p className="font-semibold">{s.t}</p><p className="text-sm text-white/70">{s.d}</p></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* MICRO-SERVICES RH */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-2 bg-[#fff7ed] text-[#a84d16] px-3 py-1 rounded-full text-sm font-medium mb-3"><Sparkles className="w-4 h-4" />Outils RH à l&apos;IA</span>
            <h2 className="text-3xl font-extrabold font-heading text-gray-900">Vos tâches RH, accélérées par l&apos;IA</h2>
            <p className="text-gray-500 mt-2 max-w-2xl mx-auto">Annonces, fiches de poste, tri de CV, entretiens, onboarding… générés en quelques secondes, à la demande.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {services.map((s) => {
              const Icon = iconMap[s.iconName] ?? Sparkles
              return (
                <Link key={s.slug} href={`/outils/${s.slug}`} className="group bg-white rounded-2xl border border-[#f0ebe3] p-6 hover:shadow-xl hover:-translate-y-1 transition-all">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: `${s.couleur}18` }}>
                    <Icon className="w-6 h-6" style={{ color: s.couleur }} />
                  </div>
                  <h3 className="font-bold font-heading text-gray-900 mb-1 group-hover:text-[#7C3AED] transition-colors">{s.titre}</h3>
                  <p className="text-sm text-gray-500 mb-4 leading-relaxed">{s.sousTitre}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">{s.prixCredits} crédits</span>
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#7C3AED]">{s.ctaLabel}<ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" /></span>
                  </div>
                </Link>
              )
            })}
          </div>
          <p className="text-center mt-6"><Link href="/outils" className="text-sm font-semibold text-[#7C3AED] hover:underline">Voir tous les outils IA →</Link></p>
        </section>

        {/* PACKS */}
        <section className="bg-[#faf8f5] border-y border-[#f0ebe3]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-extrabold font-heading text-gray-900">Des parcours pensés pour les entreprises</h2>
              <p className="text-gray-500 mt-2">IA générative, automatisation, data, cybersécurité, conduite du changement.</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {packs.map((p) => (
                <div key={p.nom} className={`relative bg-white rounded-3xl border p-7 ${p.featured ? 'border-[#7C3AED] shadow-lg lg:scale-[1.03]' : 'border-[#f0ebe3]'}`}>
                  {p.featured && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#7C3AED] text-white text-xs font-bold px-3 py-1 rounded-full">Le plus choisi</span>}
                  <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl mb-4" style={{ backgroundColor: `${p.couleur}18` }}>
                    <Rocket className="w-5 h-5" style={{ color: p.couleur }} />
                  </div>
                  <h3 className="text-xl font-extrabold font-heading text-gray-900">{p.nom}</h3>
                  <p className="text-sm font-medium mb-1" style={{ color: p.couleur }}>{p.sousTitre}</p>
                  <p className="text-sm text-gray-500 mb-4">{p.pitch}</p>
                  <ul className="space-y-2 mb-5">
                    {p.points.map((pt) => (
                      <li key={pt} className="flex items-start gap-2 text-sm text-gray-700"><CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />{pt}</li>
                    ))}
                  </ul>
                  <div className="flex items-center gap-3 text-xs text-gray-400 mb-5">
                    <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{p.duree}</span>
                    <span className="inline-flex items-center gap-1"><Target className="w-3.5 h-3.5" />{p.niveau}</span>
                  </div>
                  <Link href="/contact?sujet=pack" className="block text-center bg-gray-900 hover:bg-gray-800 text-white rounded-xl py-3 font-semibold transition-colors">Demander un devis</Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SESSIONS INTRA */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold font-heading text-gray-900">Sessions dédiées à votre entreprise</h2>
            <p className="text-gray-500 mt-2">En présentiel ou à distance, animées pour vos équipes.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Rocket, t: 'Sprint IA', d: '1 jour en présentiel (≤15 pers.) — repartez avec une boîte à outils opérationnelle le soir même.' },
              { icon: Users, t: 'Parcours Cohorte', d: '6 à 10 semaines en hybride — projets appliqués et suivi de l\'adoption dans vos équipes.' },
              { icon: GraduationCap, t: 'Comité de Direction IA', d: '½ journée pour le CODIR — arbitrer votre feuille de route et votre budget digital.' },
            ].map((s) => (
              <div key={s.t} className="bg-white rounded-2xl border border-[#f0ebe3] p-6">
                <div className="w-11 h-11 rounded-xl bg-[#7C3AED]/10 flex items-center justify-center mb-4"><s.icon className="w-5 h-5 text-[#7C3AED]" /></div>
                <h3 className="font-bold font-heading text-gray-900 mb-1">{s.t}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-[#faf8f5] border-y border-[#f0ebe3]">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <h2 className="text-3xl font-extrabold font-heading text-gray-900 text-center mb-8">Questions fréquentes</h2>
            <div className="space-y-3">
              {faqs.map((f) => (
                <details key={f.q} className="group bg-white rounded-2xl border border-[#f0ebe3] p-5">
                  <summary className="flex items-center justify-between cursor-pointer font-semibold text-gray-900 list-none">
                    {f.q}
                    <ChevronRight className="w-5 h-5 text-gray-400 group-open:rotate-90 transition-transform" />
                  </summary>
                  <p className="text-sm text-gray-600 leading-relaxed mt-3">{f.r}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* CONTACT */}
        <section id="contact" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 md:p-12 text-white text-center">
            <MessageSquare className="w-10 h-10 mx-auto mb-4 text-[#e97e42]" />
            <h2 className="text-3xl font-extrabold font-heading mb-3">Prêt à faire monter vos équipes en compétences ?</h2>
            <p className="text-white/70 max-w-xl mx-auto mb-8">Réservez un diagnostic gratuit ou demandez un devis pour un pack adapté à votre entreprise.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/contact?sujet=diagnostic" className="inline-flex items-center justify-center gap-2 bg-[#e97e42] hover:bg-[#d56a2e] text-white rounded-2xl px-7 py-4 font-bold transition-colors">
                <BarChart3 className="w-5 h-5" />Diagnostic gratuit
              </Link>
              <Link href="/contact?sujet=devis" className="inline-flex items-center justify-center gap-2 border-2 border-white/30 hover:bg-white/10 text-white rounded-2xl px-7 py-4 font-semibold transition-colors">
                Demander un devis
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
