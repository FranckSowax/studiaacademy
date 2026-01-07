'use client'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check } from 'lucide-react'
import { CreditPack, creditPacks } from '@/lib/data/credit-packs'

interface TopUpModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectPack: (pack: CreditPack) => void
}

export function TopUpModal({ isOpen, onClose, onSelectPack }: TopUpModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Recharger votre compte</DialogTitle>
          <DialogDescription>
            Choisissez un pack de crédits adapté à vos besoins.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-3 py-4">
          {creditPacks.map((pack) => (
            <Card key={pack.id} className={`flex flex-col relative ${pack.popular ? 'border-primary shadow-md' : ''}`}>
              {pack.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge variant="default" className="bg-primary text-primary-foreground">
                    Populaire
                  </Badge>
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-xl text-center">{pack.name}</CardTitle>
                <CardDescription className="text-center font-bold text-2xl text-foreground">
                  {pack.price.toLocaleString()} XAF
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 text-center space-y-4">
                <div className="text-3xl font-bold text-primary">
                  {pack.credits.toLocaleString()}
                  <span className="text-sm font-normal text-muted-foreground ml-1">crédits</span>
                </div>
                <p className="text-sm text-muted-foreground">{pack.description}</p>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  variant={pack.popular ? 'default' : 'outline'}
                  onClick={() => onSelectPack(pack)}
                >
                  Choisir
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
