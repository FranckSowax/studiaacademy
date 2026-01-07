import { SettingsForm } from '@/components/dashboard/settings-form'

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Paramètres</h2>
        <p className="text-muted-foreground">Gérez vos préférences de compte et de notifications.</p>
      </div>
      <SettingsForm />
    </div>
  )
}
