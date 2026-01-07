import { ProfileForm } from '@/components/dashboard/profile-form'

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Mon Profil</h2>
        <p className="text-muted-foreground">Gérez vos informations personnelles et votre sécurité.</p>
      </div>
      <ProfileForm />
    </div>
  )
}
