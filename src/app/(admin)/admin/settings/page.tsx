'use client'

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useState } from 'react'

export default function AdminSettingsPage() {
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [registrationsOpen, setRegistrationsOpen] = useState(true)
  const [isLoading, setIsLoading] = useState(false)

  const handleSave = () => {
    setIsLoading(true)
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      toast.success('Paramètres globaux mis à jour')
    }, 1000)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Paramètres Globaux</h2>
          <p className="text-muted-foreground">Configuration générale de la plateforme.</p>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Général</CardTitle>
            <CardDescription>
              Informations de base sur la plateforme.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="siteName">Nom du site</Label>
              <Input id="siteName" defaultValue="Studia Academy" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="supportEmail">Email de support</Label>
              <Input id="supportEmail" defaultValue="support@studia.ga" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fonctionnalités & Accès</CardTitle>
            <CardDescription>
              Contrôlez l'accès à la plateforme et les fonctionnalités principales.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="maintenance" className="flex flex-col space-y-1">
                <span>Mode Maintenance</span>
                <span className="font-normal text-xs text-muted-foreground">
                  Si activé, le site ne sera accessible qu'aux administrateurs.
                </span>
              </Label>
              <Switch
                id="maintenance"
                checked={maintenanceMode}
                onCheckedChange={setMaintenanceMode}
              />
            </div>
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="registrations" className="flex flex-col space-y-1">
                <span>Inscriptions</span>
                <span className="font-normal text-xs text-muted-foreground">
                  Autoriser les nouveaux utilisateurs à s'inscrire.
                </span>
              </Label>
              <Switch
                id="registrations"
                checked={registrationsOpen}
                onCheckedChange={setRegistrationsOpen}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? 'Enregistrement...' : 'Sauvegarder les modifications'}
          </Button>
        </div>
      </div>
    </div>
  )
}
