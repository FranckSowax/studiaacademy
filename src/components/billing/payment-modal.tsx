'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Input } from '@/components/ui/input'
import { CreditCard, Phone, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  amount: number
  description: string
  onSuccess: () => void
}

type PaymentMethod = 'airtel' | 'moov' | 'stripe'

export function PaymentModal({ isOpen, onClose, amount, description, onSuccess }: PaymentModalProps) {
  const [method, setMethod] = useState<PaymentMethod>('airtel')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handlePayment = async () => {
    setIsLoading(true)
    
    // Simulate payment processing
    setTimeout(() => {
      setIsLoading(false)
      toast.success(`Paiement de ${amount.toLocaleString()} XAF effectué avec succès !`)
      onSuccess()
      onClose()
    }, 2000)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Confirmer le paiement</DialogTitle>
          <DialogDescription>
            {description}
            <br />
            <span className="font-bold text-foreground mt-2 block text-lg">
              Total: {amount.toLocaleString()} XAF
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <RadioGroup defaultValue="airtel" value={method} onValueChange={(v) => setMethod(v as PaymentMethod)} className="grid grid-cols-1 gap-4">
            <Label
              htmlFor="airtel"
              className={`flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary cursor-pointer ${method === 'airtel' ? 'border-primary' : ''}`}
            >
              <RadioGroupItem value="airtel" id="airtel" className="sr-only" />
              <div className="flex w-full items-center justify-between">
                <div className="flex items-center gap-2">
                    <Phone className="h-5 w-5 text-red-600" />
                    <span className="font-semibold">Airtel Money</span>
                </div>
              </div>
            </Label>

            <Label
              htmlFor="moov"
              className={`flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary cursor-pointer ${method === 'moov' ? 'border-primary' : ''}`}
            >
              <RadioGroupItem value="moov" id="moov" className="sr-only" />
               <div className="flex w-full items-center justify-between">
                <div className="flex items-center gap-2">
                    <Phone className="h-5 w-5 text-blue-600" />
                    <span className="font-semibold">Moov Money</span>
                </div>
              </div>
            </Label>

            <Label
              htmlFor="stripe"
              className={`flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary cursor-pointer ${method === 'stripe' ? 'border-primary' : ''}`}
            >
              <RadioGroupItem value="stripe" id="stripe" className="sr-only" />
              <div className="flex w-full items-center justify-between">
                <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    <span className="font-semibold">Carte Bancaire</span>
                </div>
              </div>
            </Label>
          </RadioGroup>

          {(method === 'airtel' || method === 'moov') && (
            <div className="grid gap-2">
              <Label htmlFor="phone">Numéro de téléphone</Label>
              <Input
                id="phone"
                placeholder="07 00 00 00"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                type="tel"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Annuler
          </Button>
          <Button onClick={handlePayment} disabled={isLoading || ((method === 'airtel' || method === 'moov') && !phoneNumber)}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Payer {amount.toLocaleString()} XAF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
