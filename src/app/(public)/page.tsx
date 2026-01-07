import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Search,
  BarChart,
  PenTool,
  GraduationCap,
  Bot,
  Building2,
  Users,
  ArrowRight,
  CheckCircle,
  Star,
  Sparkles,
  Play,
  Zap,
  Award,
  TrendingUp,
} from 'lucide-react'

export default function Home() {
  const categories = [
    {
      title: 'Évaluer',
      description: 'Testez vos compétences et obtenez une certification reconnue.',
      icon: BarChart,
      href: '/services/assess',
      color: '#e97e42',
    },
    {
      title: 'Créer',
      description: 'Générez des CVs et lettres de motivation professionnels.',
      icon: PenTool,
      href: '/services/create',
      color: '#8B5CF6',
    },
    {
      title: 'Apprendre',
      description: 'Suivez des micro-cours et progressez rapidement.',
      icon: GraduationCap,
      href: '/services/learn',
      color: '#10B981',
    },
    {
      title: 'Outils IA',
      description: "Utilisez la puissance de l'IA pour votre carrière.",
      icon: Bot,
      href: '/services/assistant',
      color: '#3B82F6',
    },
    {
      title: 'Entreprises',
      description: 'Solutions pour le recrutement et la formation.',
      icon: Building2,
      href: '/services/business',
      color: '#F59E0B',
    },
    {
      title: 'Communauté',
      description: "Échangez avec d'autres professionnels et experts.",
      icon: Users,
      href: '/community',
      color: '#EC4899',
    },
  ]

  const stats = [
    { label: 'Services Actifs', value: '15+', icon: Zap },
    { label: 'Utilisateurs', value: '2k+', icon: Users },
    { label: 'Certifications', value: '500+', icon: Award },
    { label: 'Taux de réussite', value: '94%', icon: TrendingUp },
  ]

  const testimonials = [
    {
      name: 'Marie Nguema',
      role: 'Designer Graphique',
      content: "Grâce à Studia Academy, j'ai pu créer un CV professionnel et obtenir mon poste de rêve en moins d'un mois.",
      avatar: '👩‍🎨',
      rating: 5,
    },
    {
      name: 'Patrick Mba',
      role: 'Développeur Web',
      content: "Les tests de compétences m'ont permis de valider mes acquis et de gagner en crédibilité auprès des recruteurs.",
      avatar: '👨‍💻',
      rating: 5,
    },
    {
      name: 'Claire Ndong',
      role: 'Chef de Projet',
      content: "L'assistant IA est incroyable ! Il m'a aidé à préparer mes entretiens et à négocier mon salaire.",
      avatar: '👩‍💼',
      rating: 5,
    },
  ]

  const features = [
    'Tests adaptatifs avec IA',
    'CV optimisés pour les ATS',
    'Certificats reconnus',
    'Micro-cours impactants',
    'Assistant carrière 24/7',
    'Communauté active',
  ]

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative w-full py-16 md:py-24 lg:py-32 bg-white overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#e97e42]/10 to-[#d56a2e]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-[#e97e42]/10 to-transparent rounded-full blur-3xl" />

        <div className="container px-4 md:px-6 relative">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-[#fff7ed] text-[#e97e42] px-4 py-2 rounded-full text-sm font-medium">
                <Sparkles className="w-4 h-4" />
                Plateforme #1 en Afrique Centrale
              </div>

              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl text-gray-900">
                Votre carrière,{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#e97e42] to-[#d56a2e]">
                  propulsée par l'IA
                </span>
              </h1>

              <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto lg:mx-0">
                Studia Academy vous accompagne avec des outils intelligents pour évaluer, créer et
                apprendre. Rejoignez la nouvelle génération de professionnels.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link href="/signup">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-[#e97e42] to-[#d56a2e] hover:from-[#d56a2e] hover:to-[#c45a20] text-white px-8 py-6 text-lg rounded-xl shadow-lg shadow-[#e97e42]/30"
                  >
                    Commencer gratuitement
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link href="/services">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-2 border-[#e97e42] text-[#e97e42] hover:bg-[#fff7ed] px-8 py-6 text-lg rounded-xl"
                  >
                    <Play className="mr-2 w-5 h-5" />
                    Voir la démo
                  </Button>
                </Link>
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap items-center gap-6 justify-center lg:justify-start pt-4">
                {features.slice(0, 3).map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-gray-600">
                    <CheckCircle className="w-5 h-5 text-[#e97e42]" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Hero illustration */}
            <div className="flex-1 relative">
              <div className="relative w-full max-w-lg mx-auto">
                {/* Main card */}
                <div className="bg-[#fbf8f3] rounded-3xl p-6 shadow-xl border border-[#f0ebe3]">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#e97e42] to-[#d56a2e] rounded-xl flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800">Studia Academy</h3>
                      <p className="text-sm text-gray-500">Votre parcours personnalisé</p>
                    </div>
                  </div>

                  {/* Progress cards */}
                  <div className="space-y-3">
                    <div className="bg-white rounded-xl p-4 border border-[#f0ebe3]">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-700">Test de Compétences</span>
                        <span className="text-[#e97e42] font-bold">85%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full w-[85%] bg-gradient-to-r from-[#e97e42] to-[#d56a2e] rounded-full" />
                      </div>
                    </div>

                    <div className="bg-white rounded-xl p-4 border border-[#f0ebe3]">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-700">Micro-Cours Leadership</span>
                        <span className="text-green-600 font-bold">Terminé</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full w-full bg-green-500 rounded-full" />
                      </div>
                    </div>

                    <div className="bg-white rounded-xl p-4 border border-[#f0ebe3]">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-700">CV Professionnel</span>
                        <span className="text-[#8B5CF6] font-bold">En cours</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full w-[60%] bg-[#8B5CF6] rounded-full" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating badges */}
                <div className="absolute -top-4 -right-4 bg-white rounded-xl p-3 shadow-lg border border-[#f0ebe3]">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-[#e97e42]" />
                    <span className="font-bold text-gray-800">+500</span>
                  </div>
                  <p className="text-xs text-gray-500">Certificats</p>
                </div>

                <div className="absolute -bottom-4 -left-4 bg-gradient-to-r from-[#e97e42] to-[#d56a2e] rounded-xl p-3 shadow-lg text-white">
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5" fill="white" />
                    <span className="font-bold">4.9/5</span>
                  </div>
                  <p className="text-xs text-white/80">Satisfaction</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="w-full py-12 bg-[#fbf8f3] border-y border-[#f0ebe3]">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <div key={index} className="flex flex-col items-center space-y-2">
                  <div className="w-12 h-12 bg-[#fff7ed] rounded-xl flex items-center justify-center mb-2">
                    <Icon className="w-6 h-6 text-[#e97e42]" />
                  </div>
                  <h3 className="text-3xl font-bold text-gray-800">{stat.value}</h3>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="w-full py-16 md:py-24 bg-white">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-[#fff7ed] text-[#e97e42] px-4 py-2 rounded-full text-sm font-medium">
              <Zap className="w-4 h-4" />
              Nos Services
            </div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl text-gray-900">
              Explorez nos{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#e97e42] to-[#d56a2e]">
                micro-services
              </span>
            </h2>
            <p className="max-w-[700px] text-gray-600 md:text-lg">
              Une suite complète d'outils pour chaque étape de votre développement professionnel.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category, index) => {
              const Icon = category.icon
              return (
                <Link
                  key={index}
                  href={category.href}
                  className="group bg-[#fbf8f3] rounded-2xl p-6 border border-[#f0ebe3] hover:shadow-xl hover:shadow-[#e97e42]/10 transition-all hover:-translate-y-1"
                >
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                    style={{ backgroundColor: `${category.color}15` }}
                  >
                    <Icon className="w-7 h-7" style={{ color: category.color }} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-[#e97e42] transition-colors">
                    {category.title}
                  </h3>
                  <p className="text-gray-500 mb-4">{category.description}</p>
                  <div className="flex items-center text-[#e97e42] font-medium">
                    Découvrir
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="w-full py-16 md:py-24 bg-[#fbf8f3]">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-white text-[#e97e42] px-4 py-2 rounded-full text-sm font-medium border border-[#f0ebe3]">
              <Star className="w-4 h-4" fill="#e97e42" />
              Témoignages
            </div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl text-gray-900">
              Ce que disent nos utilisateurs
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-6 border border-[#f0ebe3] shadow-sm"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400" fill="#FACC15" />
                  ))}
                </div>
                <p className="text-gray-600 mb-6 italic">"{testimonial.content}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#fbf8f3] rounded-full flex items-center justify-center text-2xl">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">{testimonial.name}</h4>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-16 md:py-24 bg-gradient-to-r from-[#e97e42] to-[#d56a2e] relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl" />

        <div className="container px-4 md:px-6 relative">
          <div className="flex flex-col items-center space-y-6 text-center text-white">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              Prêt à transformer votre carrière ?
            </h2>
            <p className="mx-auto max-w-[600px] text-white/90 md:text-xl">
              Rejoignez des milliers d'utilisateurs qui font confiance à Studia Academy pour leur
              évolution professionnelle.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/signup">
                <Button
                  size="lg"
                  className="bg-white text-[#e97e42] hover:bg-[#fbf8f3] px-8 py-6 text-lg rounded-xl"
                >
                  Créer un compte gratuit
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/services">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-white text-white hover:bg-white/10 px-8 py-6 text-lg rounded-xl"
                >
                  Explorer les services
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
