'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import {
  Sparkles,
  Users,
  Globe2,
  GraduationCap,
  Building2,
  Laptop,
  BookOpen,
  Bot,
  ArrowRight,
  CheckCircle,
  Handshake,
  Award,
  Repeat,
  Send,
  MessageCircle,
  Quote,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

const stats = [
  { value: 'Vitrine', label: 'Partenaire IA officiel' },
  { value: '2 volets', label: 'Staff interne + communauté' },
  { value: '9', label: 'Modules IA mobilisables' },
  { value: '100%', label: 'Co-brandé / marque blanche' },
]

const voletStaff = [
  "IA au quotidien : rédaction, synthèse, traduction, organisation",
  "Automatisation des tâches administratives & reporting",
  "Création de contenus & supports pédagogiques assistée par IA",
  "IA appliquée à l'enseignement et l'apprentissage du français",
  "Sensibilisation aux usages responsables & souveraineté des données",
]

const voletCommunaute = [
  "Initiation à l'IA grand public (adhérents & abonnés)",
  "IA pour candidats aux universités chinoises & à l'international",
  "IA pour étudiants : révisions, mémoires, orientation",
  "IA pour entrepreneurs & expatriés : productivité, création d'entreprise",
  "Accès aux outils IA Studia en marque blanche Institut Français",
]

const catalogue = [
  { icon: Bot, titre: 'Outils IA Studia', desc: '20+ assistants prêts à l\'emploi (CV, dissertations, business plan, etc.)' },
  { icon: GraduationCap, titre: 'Studia China Pass', desc: 'Préparation et orientation vers les universités chinoises.' },
  { icon: Building2, titre: 'IA pour entreprises', desc: "Audit & montée en compétences des équipes par secteur d'activité." },
  { icon: BookOpen, titre: 'Formations certifiantes', desc: 'Parcours certifiés, présentiel à Libreville ou en ligne.' },
  { icon: Laptop, titre: 'Outils en marque blanche', desc: 'Les assistants IA aux couleurs de l\'Institut Français.' },
  { icon: Users, titre: 'Sessions sur-mesure', desc: 'Ateliers présentiels animés pour vos équipes et adhérents.' },
]

const etapes = [
  { icon: Handshake, titre: 'Diagnostic', desc: "Audit des besoins IA des équipes et de la communauté de l'Institut." },
  { icon: Sparkles, titre: 'Programme sur-mesure', desc: 'Co-construction des parcours staff + adhérents, co-brandés.' },
  { icon: Laptop, titre: 'Déploiement', desc: 'Sessions présentielles à Libreville + accès aux outils IA Studia.' },
  { icon: Award, titre: 'Certification', desc: 'Certifications Studia vérifiables pour les participants.' },
  { icon: Repeat, titre: 'Suivi annuel', desc: 'Bilan, mise à jour des contenus et renouvellement du partenariat.' },
]

const publics = [
  'Équipe & staff interne',
  'Adhérents & clients',
  'Expatriés',
  'Les deux volets',
]

export default function InstitutFrancaisPage() {
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    nom: '',
    organisation: 'Institut Français',
    email: '',
    telephone: '',
    publicCible: '',
    message: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await new Promise((r) => setTimeout(r, 1000))
    setSubmitted(true)
    setLoading(false)
  }

  const whatsappText = encodeURIComponent(
    `Bonjour Studia Academy, je représente ${form.organisation || "l'Institut Français"} et je souhaite discuter d'un partenariat formations IA${form.publicCible ? ` (${form.publicCible})` : ''}.`
  )

  return (
    <div className="min-h-screen bg-white">
      {/* ─── HERO CO-BRANDÉ ──────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#1e1b4b] via-[#4c1d95] to-[#7C3AED] text-white pt-28 pb-20">
        <div className="absolute top-10 right-0 w-[500px] h-[500px] bg-[#e97e42]/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          {/* Co-branding logos */}
          <div className="flex items-center justify-center gap-5 mb-8">
            <Image src="/logo.png" alt="Studia Academy" width={52} height={52} className="w-13 h-13 object-contain bg-white rounded-xl p-1.5" />
            <span className="text-2xl font-light text-white/50">×</span>
            <span className="bg-white rounded-xl px-3 py-2">
              <Image src="/institut-francais-logo-vector.png" alt="Institut Français" width={120} height={48} className="h-10 w-auto object-contain" />
            </span>
          </div>

          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/15 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4 text-[#f3a268]" />
              Partenariat formations IA
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold font-heading leading-[1.08] mb-5">
              Former la communauté francophone à{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#f3a268] to-[#e97e42]">
                l&apos;intelligence artificielle
              </span>
            </h1>
            <p className="text-lg md:text-xl text-white/80 mb-8">
              Studia Academy accompagne l&apos;Institut Français dans la formation IA de ses
              équipes, et déploie pour ses adhérents, clients et expatriés un catalogue complet
              de formations et d&apos;outils IA — en partenariat durable et co-brandé.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="#volets">
                <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-[#e97e42] to-[#d56a2e] hover:from-[#d56a2e] hover:to-[#c45a20] text-white px-8 py-6 text-base rounded-xl shadow-lg shadow-[#e97e42]/30">
                  Former notre équipe
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="#partenariat-contact">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-2 border-white/25 bg-white/5 backdrop-blur-md text-white hover:bg-white/10 hover:text-white px-8 py-6 text-base rounded-xl">
                  Proposer à nos adhérents
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── BANDEAU CONFIANCE ───────────────────────────────────────── */}
      <section className="bg-[#faf8f5] border-y border-[#f0ebe3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-2xl md:text-3xl font-extrabold font-heading text-[#7C3AED]">{s.value}</p>
              <p className="text-sm text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 2 VOLETS ────────────────────────────────────────────────── */}
      <section id="volets" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 scroll-mt-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-extrabold font-heading text-gray-900 mb-4">
            Deux volets de formation IA
          </h2>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">
            Studia est en mesure de répondre aux deux besoins de l&apos;Institut Français : former
            ses propres équipes, et proposer des formations IA à toute sa communauté.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Volet A */}
          <div className="rounded-3xl border border-[#f0ebe3] bg-gradient-to-br from-[#f5f3ff] to-white p-8 lg:p-10">
            <div className="inline-flex items-center gap-2 bg-[#7C3AED]/10 text-[#5b21b6] px-3 py-1 rounded-full text-xs font-semibold mb-5">
              <Users className="w-3.5 h-3.5" /> Volet A
            </div>
            <h3 className="text-2xl font-bold font-heading text-gray-900 mb-2">
              Pour les équipes & le staff
            </h3>
            <p className="text-gray-500 mb-6">
              Montée en compétences interne des collaborateurs de l&apos;Institut Français —
              format présentiel ou hybride à Libreville, certifiant.
            </p>
            <ul className="space-y-3">
              {voletStaff.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-gray-700">
                  <CheckCircle className="w-5 h-5 text-[#7C3AED] flex-shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Volet B */}
          <div className="rounded-3xl border border-[#f0ebe3] bg-gradient-to-br from-[#fff7ed] to-white p-8 lg:p-10">
            <div className="inline-flex items-center gap-2 bg-[#e97e42]/10 text-[#a84d16] px-3 py-1 rounded-full text-xs font-semibold mb-5">
              <Globe2 className="w-3.5 h-3.5" /> Volet B
            </div>
            <h3 className="text-2xl font-bold font-heading text-gray-900 mb-2">
              Pour les adhérents, clients & expatriés
            </h3>
            <p className="text-gray-500 mb-6">
              Les formations et outils IA que l&apos;Institut propose à sa communauté, livrés par
              Studia en co-branding ou marque blanche.
            </p>
            <ul className="space-y-3">
              {voletCommunaute.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-gray-700">
                  <CheckCircle className="w-5 h-5 text-[#e97e42] flex-shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ─── CATALOGUE IA ────────────────────────────────────────────── */}
      <section className="bg-[#faf8f5] border-y border-[#f0ebe3] py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-extrabold font-heading text-gray-900 mb-4">
              Le catalogue IA mobilisable
            </h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              Tout l&apos;arsenal Studia Academy, disponible pour le partenariat.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {catalogue.map((c) => {
              const Icon = c.icon
              return (
                <div key={c.titre} className="bg-white rounded-2xl border border-[#f0ebe3] p-6 hover:shadow-md hover:border-[#e97e42]/30 transition-all">
                  <div className="w-12 h-12 bg-[#fff7ed] rounded-xl flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-[#e97e42]" />
                  </div>
                  <h3 className="font-bold font-heading text-gray-900 mb-1.5">{c.titre}</h3>
                  <p className="text-sm text-gray-500">{c.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── PARTENARIAT DANS LA DURÉE ───────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-extrabold font-heading text-gray-900 mb-4">
            Un partenariat pensé dans la durée
          </h2>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">
            De l&apos;audit initial au renouvellement annuel, un accompagnement continu.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {etapes.map((e, i) => {
            const Icon = e.icon
            return (
              <div key={e.titre} className="relative text-center">
                <div className="w-14 h-14 mx-auto bg-gradient-to-br from-[#7C3AED] to-[#4c1d95] rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg shadow-[#7C3AED]/20">
                  <Icon className="w-6 h-6" />
                </div>
                <p className="text-xs font-semibold text-[#7C3AED] mb-1">Étape {i + 1}</p>
                <h3 className="font-bold font-heading text-gray-900 text-sm mb-1">{e.titre}</h3>
                <p className="text-xs text-gray-500">{e.desc}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* ─── POURQUOI L'INSTITUT FRANÇAIS (vitrine) ──────────────────── */}
      <section className="bg-gradient-to-br from-[#1e1b4b] via-[#4c1d95] to-[#7C3AED] text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="bg-white rounded-xl px-3 py-2 inline-block mb-8">
            <Image src="/institut-francais-logo-vector.png" alt="Institut Français" width={140} height={56} className="h-12 w-auto object-contain" />
          </span>
          <Quote className="w-10 h-10 text-[#f3a268] mx-auto mb-4" />
          <p className="text-2xl md:text-3xl font-heading font-medium leading-snug mb-6">
            « Une référence de la francophonie au Gabon, partenaire vitrine de l&apos;excellence
            IA de Studia Academy. »
          </p>
          <p className="text-white/60">
            L&apos;Institut Français incarne le rayonnement culturel et éducatif francophone —
            le partenaire idéal pour démontrer la valeur des formations IA de Studia auprès de
            toute la communauté.
          </p>
        </div>
      </section>

      {/* ─── FORMULAIRE PARTENARIAT ──────────────────────────────────── */}
      <section id="partenariat-contact" className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 scroll-mt-20">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-[#fff7ed] text-[#a84d16] px-4 py-1.5 rounded-full text-sm font-medium mb-4">
            <Handshake className="w-4 h-4" /> Construisons le partenariat
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold font-heading text-gray-900 mb-3">
            Démarrons la collaboration
          </h2>
          <p className="text-gray-500 text-lg">
            Décrivez votre besoin — notre équipe à Libreville revient vers vous sous 24h.
          </p>
        </div>

        {submitted ? (
          <div className="flex flex-col items-center justify-center text-center py-20 bg-[#fbf8f3] rounded-3xl border border-[#f0ebe3]">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold font-heading text-gray-900 mb-2">Demande envoyée !</h3>
            <p className="text-gray-500 max-w-sm">
              Merci. Notre équipe partenariats vous recontacte sous 24h pour cadrer le programme.
            </p>
            <a
              href={`https://wa.me/24100000000?text=${whatsappText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              Continuer sur WhatsApp
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 bg-[#fbf8f3] rounded-3xl p-8 border border-[#f0ebe3]">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <Label htmlFor="nom" className="text-sm font-medium text-gray-700">Nom du contact *</Label>
                <Input id="nom" required placeholder="Prénom Nom" value={form.nom}
                  onChange={(e) => setForm({ ...form, nom: e.target.value })}
                  className="border-[#e2e8f0] focus:border-[#e97e42] focus:ring-[#e97e42]/20 rounded-xl bg-white" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="organisation" className="text-sm font-medium text-gray-700">Organisation</Label>
                <Input id="organisation" value={form.organisation}
                  onChange={(e) => setForm({ ...form, organisation: e.target.value })}
                  className="border-[#e2e8f0] focus:border-[#e97e42] focus:ring-[#e97e42]/20 rounded-xl bg-white" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email *</Label>
                <Input id="email" type="email" required placeholder="contact@if-gabon.com" value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="border-[#e2e8f0] focus:border-[#e97e42] focus:ring-[#e97e42]/20 rounded-xl bg-white" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="telephone" className="text-sm font-medium text-gray-700">Téléphone (+241)</Label>
                <Input id="telephone" placeholder="+241 06 XX XX XX" value={form.telephone}
                  onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                  className="border-[#e2e8f0] rounded-xl bg-white" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="publicCible" className="text-sm font-medium text-gray-700">Public visé</Label>
              <select id="publicCible" value={form.publicCible}
                onChange={(e) => setForm({ ...form, publicCible: e.target.value })}
                className="w-full h-10 rounded-xl border border-[#e2e8f0] bg-white px-3 text-sm text-gray-700 focus:border-[#e97e42] focus:outline-none focus:ring-2 focus:ring-[#e97e42]/20">
                <option value="">Choisir un public</option>
                {publics.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="message" className="text-sm font-medium text-gray-700">Votre besoin *</Label>
              <Textarea id="message" required rows={5}
                placeholder="Décrivez le profil des participants, le volume, le calendrier souhaité..."
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="border-[#e2e8f0] focus:border-[#e97e42] focus:ring-[#e97e42]/20 rounded-xl bg-white resize-none" />
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button type="submit" disabled={loading}
                className="flex-1 bg-gradient-to-r from-[#e97e42] to-[#d56a2e] hover:from-[#d56a2e] hover:to-[#c45a20] text-white py-5 rounded-xl font-semibold">
                {loading ? 'Envoi...' : 'Envoyer la demande'}
                <Send className="ml-2 w-4 h-4" />
              </Button>
              <a href={`https://wa.me/24100000000?text=${whatsappText}`} target="_blank" rel="noopener noreferrer" className="flex-1">
                <Button type="button" variant="outline"
                  className="w-full border-2 border-green-500 text-green-600 hover:bg-green-50 py-5 rounded-xl font-semibold">
                  <MessageCircle className="mr-2 w-4 h-4" /> WhatsApp (immédiat)
                </Button>
              </a>
            </div>
          </form>
        )}
      </section>
    </div>
  )
}
