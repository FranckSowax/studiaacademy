'use client'

import { useState } from 'react'
import { Service } from '@/types/service'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Lock, CheckCircle } from 'lucide-react'
import { PaymentModal } from '@/components/billing/payment-modal'

interface ServiceGateProps {
  service: Service
  children: React.ReactNode
}

export function ServiceGate({ service, children }: ServiceGateProps) {
  // In a real app, this would be initialized from a prop checking DB purchase status
  const [isUnlocked, setIsUnlocked] = useState(service.price === 0)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)

  const handleUnlock = () => {
    setIsPaymentModalOpen(true)
  }

  const handlePaymentSuccess = () => {
    setIsUnlocked(true)
  }

  if (isUnlocked) {
    return <>{children}</>
  }

  return (
    <div className="container max-w-4xl mx-auto py-12 px-4">
      <Card className="w-full max-w-2xl mx-auto text-center border-dashed border-2">
        <CardHeader>
          <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-4">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Service Premium</CardTitle>
          <CardDescription className="text-lg mt-2">
            {service.name} est un service premium.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Débloquez l'accès complet à cet outil pour profiter de toutes ses fonctionnalités.
          </p>
          <div className="flex justify-center gap-8 text-left max-w-md mx-auto py-4">
            <ul className="space-y-2">
              {service.features?.slice(0, 3).map((feature, i) => (
                <li key={i} className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="text-3xl font-bold py-4">
            {service.price.toLocaleString()} XAF
          </div>
        </CardContent>
        <CardFooter className="justify-center pb-8">
          <Button size="lg" onClick={handleUnlock}>
            Débloquer maintenant
          </Button>
        </CardFooter>
      </Card>

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        amount={service.price}
        description={`Déblocage service: ${service.name}`}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  )
}
