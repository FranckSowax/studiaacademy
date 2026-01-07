'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export function SettingsForm() {
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [whatsappNotifications, setWhatsappNotifications] = useState(false)
  const [marketingEmails, setMarketingEmails] = useState(true)
  const [isLoading, setIsLoading] = useState(false)

  const handleSave = () => {
    setIsLoading(true)
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      toast.success('Préférences mises à jour')
    }, 1000)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>
            Gérez la façon dont vous souhaitez recevoir nos communications.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="email-notifications" className="flex flex-col space-y-1">
              <span>Notifications par Email</span>
              <span className="font-normal text-xs text-muted-foreground">
                Recevez des emails pour vos résultats de tests et mises à jour importantes.
              </span>
            </Label>
            <Switch
              id="email-notifications"
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
            />
          </div>
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="whatsapp-notifications" className="flex flex-col space-y-1">
              <span>Notifications WhatsApp</span>
              <span className="font-normal text-xs text-muted-foreground">
                Recevez des rappels et des conseils rapides directement sur WhatsApp.
              </span>
            </Label>
            <Switch
              id="whatsapp-notifications"
              checked={whatsappNotifications}
              onCheckedChange={setWhatsappNotifications}
            />
          </div>
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="marketing-emails" className="flex flex-col space-y-1">
              <span>Communications Marketing</span>
              <span className="font-normal text-xs text-muted-foreground">
                Recevez des offres spéciales et des actualités sur nos nouveaux services.
              </span>
            </Label>
            <Switch
              id="marketing-emails"
              checked={marketingEmails}
              onCheckedChange={setMarketingEmails}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? 'Enregistrement...' : 'Enregistrer les préférences'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
