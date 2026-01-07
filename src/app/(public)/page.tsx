import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Search, BarChart, PenTool, GraduationCap, Bot, Building2, Users, ArrowRight } from 'lucide-react'

export default function Home() {
  const categories = [
    {
      title: 'Évaluer',
      description: 'Testez vos compétences et obtenez une certification.',
      icon: BarChart,
      href: '/services/assess',
      color: 'text-blue-600',
    },
    {
      title: 'Créer',
      description: 'Générez des CVs et lettres de motivation professionnels.',
      icon: PenTool,
      href: '/services/create',
      color: 'text-orange-600',
    },
    {
      title: 'Apprendre',
      description: 'Suivez des micro-cours et progressez rapidement.',
      icon: GraduationCap,
      href: '/services?category=learn',
      color: 'text-green-600',
    },
    {
      title: 'Outils IA',
      description: 'Utilisez la puissance de l\'IA pour votre carrière.',
      icon: Bot,
      href: '/services?category=ai-tools',
      color: 'text-purple-600',
    },
    {
      title: 'Entreprises',
      description: 'Solutions pour le recrutement et la formation.',
      icon: Building2,
      href: '/services/business',
      color: 'text-slate-600',
    },
    {
      title: 'Communauté',
      description: 'Échangez avec d\'autres professionnels et experts.',
      icon: Users,
      href: '/community',
      color: 'text-indigo-600',
    },
  ]

  const stats = [
    { label: 'Services Actifs', value: '15+' },
    { label: 'Utilisateurs', value: '2k+' },
    { label: 'Certifications', value: '500+' },
  ]

  return (
    <div className="flex flex-col min-h-[calc(100vh-3.5rem)]">
      {/* Hero Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-background">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                Votre carrière, propulsée par l'IA
              </h1>
              <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                Studia Academy vous accompagne avec des outils intelligents pour évaluer, créer et apprendre.
                Rejoignez la nouvelle génération de professionnels.
              </p>
            </div>
            <div className="w-full max-w-sm space-y-2">
              <form className="flex space-x-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder="Rechercher un service..."
                    type="search"
                  />
                </div>
                <Button type="submit">Rechercher</Button>
              </form>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 mt-4">
              <Button asChild size="lg">
                <Link href="/signup">Commencer gratuitement</Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/services">Voir tous les services</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="w-full py-12 bg-muted/50">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 text-center">
            {stats.map((stat, index) => (
              <div key={index} className="flex flex-col items-center space-y-2">
                <h3 className="text-3xl font-bold">{stat.value}</h3>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-background">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Explorez nos services</h2>
              <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                Une suite complète d'outils pour chaque étape de votre développement professionnel.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category, index) => (
              <Card key={index} className="transition-all hover:shadow-lg hover:-translate-y-1">
                <CardHeader>
                  <div className={`mb-2 inline-block rounded-lg bg-muted p-3 ${category.color} bg-opacity-10`}>
                    <category.icon className={`h-6 w-6 ${category.color}`} />
                  </div>
                  <CardTitle>{category.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-4">{category.description}</CardDescription>
                  <Button variant="ghost" className="w-full justify-between" asChild>
                    <Link href={category.href}>
                      Découvrir <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-primary text-primary-foreground">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Prêt à transformer votre carrière ?
              </h2>
              <p className="mx-auto max-w-[600px] text-primary-foreground/80 md:text-xl">
                Rejoignez des milliers d'utilisateurs qui font confiance à Studia Academy pour leur évolution professionnelle.
              </p>
            </div>
            <Button size="lg" variant="secondary" asChild>
              <Link href="/signup">Créer un compte gratuit</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
