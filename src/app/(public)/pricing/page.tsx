import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Check } from 'lucide-react'
import Link from 'next/link'

export default function PricingPage() {
  const plans = [
    {
      name: 'Gratuit',
      price: '0 XAF',
      description: 'Pour découvrir la plateforme',
      features: ['Accès aux services de base', '1 CV gratuit', 'Tests de compétences limités'],
      action: 'S\'inscrire',
      href: '/signup'
    },
    {
      name: 'Pro',
      price: '5000 XAF',
      period: '/mois',
      description: 'Pour les professionnels ambitieux',
      features: ['CVs illimités', 'Accès complet aux formations', 'Assistant IA carrière', 'Certifications reconnues'],
      action: 'Commencer l\'essai',
      href: '/signup?plan=pro',
      popular: true
    },
    {
      name: 'Entreprise',
      price: 'Sur devis',
      description: 'Pour les équipes et organisations',
      features: ['Gestion des employés', 'Tableau de bord RH', 'Parcours personnalisés', 'Support prioritaire'],
      action: 'Contacter',
      href: '/contact'
    }
  ]

  return (
    <div className="container py-12 md:py-24">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-4">Tarifs simples et transparents</h1>
        <p className="text-muted-foreground text-lg">Choisissez le plan qui correspond à vos besoins.</p>
      </div>
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
        {plans.map((plan) => (
          <Card key={plan.name} className={plan.popular ? 'border-primary shadow-lg relative' : ''}>
            {plan.popular && (
              <div className="absolute top-0 right-0 -mt-2 -mr-2 px-3 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full">
                Populaire
              </div>
            )}
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-6">
                {plan.price}
                {plan.period && <span className="text-sm font-normal text-muted-foreground">{plan.period}</span>}
              </div>
              <ul className="space-y-2">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center text-sm">
                    <Check className="mr-2 h-4 w-4 text-green-500" />
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button className="w-full" variant={plan.popular ? 'default' : 'outline'} asChild>
                <Link href={plan.href}>{plan.action}</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
