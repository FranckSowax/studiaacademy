import { notFound } from 'next/navigation'
import { mockServices } from '@/lib/data/mock-services'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Check, ArrowRight, Star } from 'lucide-react'
import Link from 'next/link'
import { Metadata } from 'next'

interface ServicePageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: ServicePageProps): Promise<Metadata> {
  const { slug } = await params
  const service = mockServices.find((s) => s.slug === slug)

  if (!service) {
    return {
      title: 'Service Non Trouvé',
    }
  }

  return {
    title: `${service.name} | Studia Academy`,
    description: service.shortDescription || service.description,
  }
}

export async function generateStaticParams() {
  return mockServices.map((service) => ({
    slug: service.slug,
  }))
}

export default async function ServicePage({ params }: ServicePageProps) {
  const { slug } = await params
  const service = mockServices.find((s) => s.slug === slug)

  if (!service) {
    notFound()
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-muted/30 py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-2">
                 <Badge variant="outline" className="capitalize text-base px-3 py-1">
                    {service.category}
                 </Badge>
                 {service.price === 0 && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800 text-base px-3 py-1">
                      Gratuit
                    </Badge>
                  )}
              </div>
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
                {service.name}
              </h1>
              <p className="text-xl text-muted-foreground max-w-[700px]">
                {service.description}
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                <Button size="lg" asChild>
                  <Link href={`${service.href}/start`}>
                    Commencer maintenant <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                {service.price > 0 && (
                     <p className="flex items-center text-lg font-medium">
                        À partir de {service.price.toLocaleString()} XAF
                     </p>
                )}
              </div>
            </div>
            {/* Placeholder for Hero Image/Illustration */}
            <div className="flex-1 flex justify-center">
               <div className="w-full max-w-md aspect-video bg-muted rounded-xl flex items-center justify-center border shadow-sm">
                  <p className="text-muted-foreground">Illustration du service</p>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      {service.benefits && service.benefits.length > 0 && (
        <section className="py-12 md:py-24 bg-background">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Pourquoi choisir ce service ?</h2>
            </div>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {service.benefits.map((benefit, index) => (
                <Card key={index} className="border-none shadow-none bg-muted/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <Check className="h-6 w-6 text-primary" />
                      {benefit.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{benefit.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      {service.features && service.features.length > 0 && (
        <section className="py-12 md:py-24 bg-muted/30">
          <div className="container px-4 md:px-6">
             <div className="grid gap-12 lg:grid-cols-2 items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl mb-6">Fonctionnalités Clés</h2>
                    <ul className="space-y-4">
                        {service.features.map((feature, index) => (
                            <li key={index} className="flex items-start gap-3">
                                <div className="mt-1 bg-primary/10 p-1 rounded-full">
                                    <Check className="h-4 w-4 text-primary" />
                                </div>
                                <span className="text-lg">{feature}</span>
                            </li>
                        ))}
                    </ul>
                </div>
                 <div className="flex justify-center">
                    {/* Placeholder for Feature Screenshot */}
                    <div className="w-full max-w-md aspect-square bg-white rounded-xl flex items-center justify-center border shadow-sm">
                         <p className="text-muted-foreground">Aperçu de l'interface</p>
                    </div>
                </div>
             </div>
          </div>
        </section>
      )}

      {/* FAQ Section */}
      {service.faqs && service.faqs.length > 0 && (
        <section className="py-12 md:py-24 bg-background">
          <div className="container px-4 md:px-6 max-w-3xl">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl mb-8 text-center">Questions Fréquentes</h2>
            <Accordion type="single" collapsible className="w-full">
              {service.faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                  <AccordionContent>{faq.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-12 md:py-24 bg-primary text-primary-foreground">
        <div className="container px-4 md:px-6 text-center">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl mb-4">Prêt à vous lancer ?</h2>
          <p className="text-xl mb-8 opacity-90">
             Commencez dès aujourd'hui et boostez votre carrière avec Studia Academy.
          </p>
          <Button size="lg" variant="secondary" asChild>
             <Link href={`${service.href}/start`}>
               Accéder au service
             </Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
