'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Star,
  Users,
  Clock,
  Award,
  Play,
  ChevronRight,
  TestTube,
  FileText,
  BrainCircuit,
  Bot,
  GraduationCap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

// Service data
const servicesData: Record<string, {
  name: string
  category: string
  description: string
  longDescription: string
  price: number
  freeLimit: number
  users: number
  rating: number
  duration: string
  features: string[]
  benefits: { title: string; description: string }[]
  faqs: { question: string; answer: string }[]
  icon: React.ElementType
  color: string
}> = {
  'assess': {
    name: 'Test de Compétences',
    category: 'Évaluation',
    description: 'Évaluez vos compétences techniques et comportementales avec nos tests adaptatifs.',
    longDescription: 'Notre système d\'évaluation utilise l\'intelligence artificielle pour adapter les questions à votre niveau et vous fournir une analyse détaillée de vos compétences. Obtenez une certification reconnue par les recruteurs.',
    price: 0,
    freeLimit: 1,
    users: 2340,
    rating: 4.8,
    duration: '15-45 min',
    icon: TestTube,
    color: '#e97e42',
    features: [
      'Tests adaptatifs intelligents',
      'Analyse détaillée des résultats',
      'Comparaison avec le marché',
      'Certificat de réussite',
      'Suggestions de formation personnalisées',
      'Historique des évaluations',
    ],
    benefits: [
      { title: 'Validez vos acquis', description: 'Prouvez vos compétences auprès des recruteurs avec des tests standardisés.' },
      { title: 'Progressez rapidement', description: 'Identifiez précisément vos lacunes pour mieux cibler votre apprentissage.' },
      { title: 'Gagnez en crédibilité', description: 'Ajoutez des certifications vérifiées à votre CV et profil LinkedIn.' },
    ],
    faqs: [
      { question: 'Combien de temps durent les tests ?', answer: 'La durée varie selon le test, généralement entre 15 et 45 minutes.' },
      { question: 'Puis-je repasser un test ?', answer: 'Oui, après une période de carence de 30 jours pour permettre la progression.' },
      { question: 'Les certificats sont-ils reconnus ?', answer: 'Oui, nos certificats sont reconnus par de nombreuses entreprises partenaires.' },
    ],
  },
  'create': {
    name: 'Générateur de CV',
    category: 'Création',
    description: 'Créez un CV professionnel en quelques minutes avec nos modèles optimisés.',
    longDescription: 'Notre générateur utilise des modèles conçus par des experts RH et optimisés pour les systèmes ATS (Applicant Tracking Systems). Mettez toutes les chances de votre côté.',
    price: 2000,
    freeLimit: 1,
    users: 1856,
    rating: 4.7,
    duration: '10-20 min',
    icon: FileText,
    color: '#8B5CF6',
    features: [
      'Modèles professionnels et modernes',
      'Optimisation pour les ATS',
      'Suggestions de contenu par IA',
      'Export PDF illimité',
      'Gestion de plusieurs versions',
      'Personnalisation avancée',
    ],
    benefits: [
      { title: 'Gagnez du temps', description: 'Ne perdez plus des heures sur la mise en page. Concentrez-vous sur le contenu.' },
      { title: 'Passez les filtres', description: 'Nos modèles sont conçus pour être lus parfaitement par les logiciels de recrutement.' },
      { title: 'Démarquez-vous', description: 'Des designs élégants qui captent l\'attention des recruteurs.' },
    ],
    faqs: [
      { question: 'Combien de CV puis-je créer ?', answer: 'Avec un compte premium, vous pouvez créer un nombre illimité de CV.' },
      { question: 'Puis-je exporter en Word ?', answer: 'Oui, l\'export est disponible en PDF et Word.' },
    ],
  },
  'analyze': {
    name: 'Analyse CV par IA',
    category: 'Création',
    description: 'Obtenez un feedback instantané sur votre CV et des suggestions d\'amélioration.',
    longDescription: 'Notre IA analyse votre CV en profondeur : structure, mots-clés, expériences, et vous donne des conseils personnalisés pour l\'améliorer.',
    price: 1500,
    freeLimit: 0,
    users: 987,
    rating: 4.9,
    duration: '2-5 min',
    icon: BrainCircuit,
    color: '#EC4899',
    features: [
      'Score global de qualité',
      'Analyse des mots-clés',
      'Détection des erreurs courantes',
      'Conseils de reformulation',
      'Comparaison avec les offres d\'emploi',
      'Suggestions d\'amélioration',
    ],
    benefits: [
      { title: 'Feedback instantané', description: 'Recevez une analyse complète en quelques secondes.' },
      { title: 'Conseils d\'experts', description: 'Nos recommandations sont basées sur les meilleures pratiques RH.' },
      { title: 'Améliorez votre score', description: 'Suivez vos progrès et optimisez votre CV.' },
    ],
    faqs: [
      { question: 'Quels formats de CV sont acceptés ?', answer: 'PDF, Word (.doc, .docx) et images (PNG, JPG).' },
      { question: 'L\'analyse est-elle confidentielle ?', answer: 'Oui, vos données sont cryptées et ne sont jamais partagées.' },
    ],
  },
  'assistant': {
    name: 'Assistant Carrière IA',
    category: 'IA',
    description: 'Un coach virtuel disponible 24/7 pour répondre à vos questions professionnelles.',
    longDescription: 'Notre assistant intelligent vous accompagne dans toutes vos démarches professionnelles : conseils de carrière, préparation d\'entretiens, rédaction de lettres de motivation, et plus encore.',
    price: 0,
    freeLimit: 10,
    users: 3210,
    rating: 4.8,
    duration: 'Illimité',
    icon: Bot,
    color: '#3B82F6',
    features: [
      'Chat disponible 24/7',
      'Conseils personnalisés',
      'Aide à la rédaction',
      'Préparation d\'entretiens',
      'Orientation professionnelle',
      'Suivi de progression',
    ],
    benefits: [
      { title: 'Disponible 24/7', description: 'Obtenez des réponses à vos questions à tout moment.' },
      { title: 'Conseils personnalisés', description: 'L\'assistant s\'adapte à votre profil et vos objectifs.' },
      { title: 'Gratuit', description: '10 conversations gratuites par mois.' },
    ],
    faqs: [
      { question: 'L\'assistant peut-il rédiger ma lettre de motivation ?', answer: 'Oui, il peut vous aider à rédiger et améliorer vos lettres.' },
      { question: 'Comment fonctionne la limite gratuite ?', answer: 'Vous avez 10 conversations gratuites par mois, renouvelées le 1er de chaque mois.' },
    ],
  },
  'learn': {
    name: 'Micro-Cours',
    category: 'Formation',
    description: 'Développez vos compétences avec nos modules courts et impactants.',
    longDescription: 'Nos micro-cours sont conçus pour un apprentissage rapide et efficace. Chaque module dure entre 15 et 30 minutes et se termine par un quiz de validation.',
    price: 5000,
    freeLimit: 0,
    users: 1432,
    rating: 4.7,
    duration: '15-30 min',
    icon: GraduationCap,
    color: '#F59E0B',
    features: [
      'Modules courts et impactants',
      'Quiz de validation',
      'Certificats de complétion',
      'Contenu mis à jour régulièrement',
      'Accessible sur mobile',
      'Progression sauvegardée',
    ],
    benefits: [
      { title: 'Apprentissage flexible', description: 'Apprenez à votre rythme, où que vous soyez.' },
      { title: 'Contenu de qualité', description: 'Nos cours sont créés par des experts reconnus.' },
      { title: 'Certificats', description: 'Validez vos acquis avec des certificats.' },
    ],
    faqs: [
      { question: 'Combien de temps ai-je accès aux cours ?', answer: 'L\'accès est illimité une fois le cours acheté.' },
      { question: 'Puis-je télécharger les cours ?', answer: 'Les supports PDF sont téléchargeables, les vidéos sont en streaming.' },
    ],
  },
}

export default function ServiceDetailPage() {
  const params = useParams()
  const slug = params.slug as string
  const service = servicesData[slug]

  if (!service) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Service non trouvé</h1>
        <Link href="/services">
          <Button className="bg-gradient-to-r from-[#e97e42] to-[#d56a2e] text-white">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux services
          </Button>
        </Link>
      </div>
    )
  }

  const Icon = service.icon

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/services" className="hover:text-[#e97e42] transition-colors">
          Services
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-800">{service.name}</span>
      </div>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#e97e42] to-[#d56a2e] rounded-3xl p-8 text-white relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-60 h-60 bg-white/10 rounded-full" />
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full" />

        <div className="relative flex flex-col md:flex-row gap-8 items-start">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                <Icon className="w-7 h-7" />
              </div>
              <div>
                <span className="text-sm bg-white/20 px-3 py-1 rounded-full">{service.category}</span>
              </div>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold mb-4">{service.name}</h1>
            <p className="text-lg text-white/90 mb-6 max-w-2xl">{service.longDescription}</p>

            <div className="flex flex-wrap items-center gap-6 mb-6">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-400" fill="#FACC15" />
                <span className="font-semibold">{service.rating}</span>
                <span className="text-white/70">({service.users.toLocaleString()} avis)</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                <span>{service.users.toLocaleString()} utilisateurs</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <span>{service.duration}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <Link href={`/services/${slug}/start`}>
                <Button size="lg" className="bg-white text-[#e97e42] hover:bg-[#fbf8f3]">
                  Commencer maintenant <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              {service.price > 0 ? (
                <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-xl">
                  <span className="text-2xl font-bold">{service.price.toLocaleString()}</span>
                  <span className="text-white/80">XAF</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-green-500/30 px-4 py-2 rounded-xl">
                  <span className="text-xl font-bold">Gratuit</span>
                  {service.freeLimit > 0 && (
                    <span className="text-white/80">({service.freeLimit} essai{service.freeLimit > 1 ? 's' : ''})</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Features & Benefits Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Features */}
        <div className="bg-[#fbf8f3] rounded-2xl border border-[#f0ebe3] p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Check className="w-5 h-5 text-[#e97e42]" />
            Fonctionnalités
          </h2>
          <ul className="space-y-3">
            {service.features.map((feature, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#fff7ed] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5 text-[#e97e42]" />
                </div>
                <span className="text-gray-700">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Benefits */}
        <div className="bg-[#fbf8f3] rounded-2xl border border-[#f0ebe3] p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-[#e97e42]" />
            Avantages
          </h2>
          <div className="space-y-4">
            {service.benefits.map((benefit, idx) => (
              <div key={idx} className="bg-white rounded-xl p-4">
                <h3 className="font-semibold text-gray-800 mb-1">{benefit.title}</h3>
                <p className="text-sm text-gray-500">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="bg-[#fbf8f3] rounded-2xl border border-[#f0ebe3] p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Questions Fréquentes</h2>
        <div className="space-y-4">
          {service.faqs.map((faq, idx) => (
            <div key={idx} className="bg-white rounded-xl p-4">
              <h3 className="font-semibold text-gray-800 mb-2">{faq.question}</h3>
              <p className="text-gray-500">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="bg-gradient-to-r from-[#e97e42] to-[#d56a2e] rounded-2xl p-8 text-white text-center">
        <h2 className="text-2xl font-bold mb-2">Prêt à commencer ?</h2>
        <p className="text-white/80 mb-6">Boostez votre carrière dès aujourd'hui avec {service.name}</p>
        <Link href={`/services/${slug}/start`}>
          <Button size="lg" className="bg-white text-[#e97e42] hover:bg-[#fbf8f3]">
            <Play className="w-5 h-5 mr-2" />
            Accéder au service
          </Button>
        </Link>
      </div>
    </div>
  )
}
