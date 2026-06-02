import { GraduationCap, Target, Users, Globe, Award, Zap } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

const values = [
  {
    icon: GraduationCap,
    title: 'Excellence académique',
    description:
      "Nous maintenons les plus hauts standards de qualité pédagogique, en partenariat avec des institutions académiques reconnues en Chine et en Afrique.",
    color: '#7C3AED',
  },
  {
    icon: Globe,
    title: 'Ouverture internationale',
    description:
      "Nous construisons des ponts entre l'Afrique Centrale et le monde, notamment via notre programme d'accès aux universités chinoises.",
    color: '#3B82F6',
  },
  {
    icon: Zap,
    title: 'Innovation IA',
    description:
      "Nous intégrons les dernières avancées de l'intelligence artificielle dans nos outils d'évaluation, de formation et d'accompagnement.",
    color: '#e97e42',
  },
  {
    icon: Users,
    title: 'Impact communautaire',
    description:
      "Notre mission est de démocratiser l'accès à l'excellence éducative et professionnelle pour les jeunes d'Afrique Centrale.",
    color: '#10B981',
  },
  {
    icon: Target,
    title: 'Résultats mesurables',
    description:
      "Nous mesurons notre succès à l'aune des résultats concrets de nos étudiants : certifications obtenues, promotions, créations d'entreprises.",
    color: '#F59E0B',
  },
  {
    icon: Award,
    title: 'Certification reconnue',
    description:
      "Nos certifications sont adossées à des référentiels internationaux et vérifiables numériquement par les employeurs partenaires.",
    color: '#F43F5E',
  },
]

const team = [
  {
    name: 'Direction',
    role: 'Studia Lab — Sowax Group',
    description: 'Une équipe pluridisciplinaire de pédagogues, ingénieurs IA et experts africains.',
    emoji: '🏛️',
  },
  {
    name: 'Nos coaches',
    role: 'Experts certifiés',
    description: '+20 coaches et formateurs certifiés, locaux et internationaux.',
    emoji: '👨‍🏫',
  },
  {
    name: 'Partenaires',
    role: 'Réseau institutions',
    description: "Universités chinoises, entreprises gabonaises, institutions d'Afrique Centrale.",
    emoji: '🤝',
  },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white pt-24">
      {/* Hero about */}
      <section className="w-full py-20 md:py-28 bg-gradient-to-b from-[#fbf8f3] to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-[#fff7ed] text-[#a84d16] px-4 py-1.5 rounded-full text-sm font-medium mb-6">
            Notre histoire
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold font-heading text-gray-900 mb-6 leading-tight">
            Studia Academy,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#e97e42] to-[#d56a2e]">
              l'excellence africaine
            </span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto">
            Fondée à Libreville, Gabon, Studia Academy est le centre d'excellence du Sowax Group
            dédié à la formation, la certification et la transformation digitale pour l'Afrique
            Centrale. Notre conviction : chaque talent africain mérite des outils de classe mondiale.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="w-full py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold font-heading text-gray-900">
                Notre mission
              </h2>
              <p className="text-gray-600 text-lg leading-relaxed">
                Démocratiser l'accès à l'excellence éducative et professionnelle pour les étudiants,
                les professionnels et les entreprises d'Afrique Centrale.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Nous combinons l'intelligence artificielle, des partenariats académiques
                internationaux (notamment avec des universités chinoises) et un accompagnement
                humain de proximité pour offrir une expérience de formation unique sur le continent.
              </p>
              <div className="grid grid-cols-2 gap-4 pt-4">
                {[
                  { label: 'Fondée en', value: '2022' },
                  { label: 'Libreville', value: 'Gabon' },
                  { label: 'Modules', value: '9' },
                  { label: 'Groupe', value: 'Sowax' },
                ].map((item) => (
                  <div key={item.label} className="bg-[#fbf8f3] rounded-2xl p-4 border border-[#f0ebe3]">
                    <p className="text-2xl font-extrabold font-heading text-[#e97e42]">{item.value}</p>
                    <p className="text-sm text-gray-500">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="bg-gradient-to-br from-[#fff7ed] to-[#fbf8f3] rounded-3xl p-8 border border-[#f0ebe3]">
                <blockquote className="text-xl font-medium text-gray-800 italic leading-relaxed mb-6">
                  "Notre vision : faire de Libreville un hub d'excellence académique et digitale
                  pour toute l'Afrique Centrale."
                </blockquote>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-[#e97e42] to-[#d56a2e] rounded-full flex items-center justify-center text-white text-xl">
                    🎓
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">Direction Studia Academy</p>
                    <p className="text-sm text-gray-500">Sowax Group — Libreville, Gabon</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Valeurs */}
      <section className="w-full py-20 bg-[#fbf8f3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold font-heading text-gray-900 mb-4">
              Nos valeurs
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {values.map((val) => {
              const Icon = val.icon
              return (
                <div
                  key={val.title}
                  className="bg-white rounded-2xl p-6 border border-[#f0ebe3] hover:shadow-lg hover:-translate-y-0.5 transition-all"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                    style={{ backgroundColor: `${val.color}18` }}
                  >
                    <Icon className="w-6 h-6" style={{ color: val.color }} />
                  </div>
                  <h3 className="font-bold font-heading text-gray-900 mb-2">{val.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{val.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Équipe */}
      <section className="w-full py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold font-heading text-gray-900 mb-4">
              Qui sommes-nous ?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {team.map((member) => (
              <div
                key={member.name}
                className="bg-[#fbf8f3] rounded-3xl p-8 border border-[#f0ebe3] text-center hover:shadow-lg transition-shadow"
              >
                <div className="text-5xl mb-4">{member.emoji}</div>
                <h3 className="text-xl font-bold font-heading text-gray-900 mb-1">{member.name}</h3>
                <p className="text-sm text-[#a84d16] font-medium mb-3">{member.role}</p>
                <p className="text-sm text-gray-500 leading-relaxed">{member.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="w-full py-16 bg-gradient-to-r from-[#e97e42] to-[#d56a2e]">
        <div className="max-w-2xl mx-auto px-4 text-center text-white">
          <h2 className="text-3xl font-bold font-heading mb-4">
            Rejoignez l'aventure Studia
          </h2>
          <p className="text-white/90 mb-8">
            Que vous soyez étudiant, professionnel ou entreprise, nous avons un module pour vous.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/#modules">
              <Button
                size="lg"
                className="bg-white text-[#e97e42] hover:bg-[#fbf8f3] px-8 rounded-xl font-bold"
              >
                Découvrir nos modules
              </Button>
            </Link>
            <Link href="/contact">
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-white text-white hover:bg-white/15 px-8 rounded-xl"
              >
                Nous contacter
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
