'use client'

import { CVProfile } from '@/types/cv'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface PersonalFormProps {
  data: CVProfile
  onChange: (data: CVProfile) => void
}

export function PersonalForm({ data, onChange }: PersonalFormProps) {
  const handleChange = (field: keyof CVProfile, value: string) => {
    onChange({ ...data, [field]: value })
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="fullName">Nom complet</Label>
          <Input
            id="fullName"
            value={data.fullName}
            onChange={(e) => handleChange('fullName', e.target.value)}
            placeholder="Jean Dupont"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="jobTitle">Titre du poste</Label>
          <Input
            id="jobTitle"
            value={data.jobTitle}
            onChange={(e) => handleChange('jobTitle', e.target.value)}
            placeholder="Développeur Web"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={data.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="jean.dupont@exemple.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Téléphone</Label>
          <Input
            id="phone"
            type="tel"
            value={data.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            placeholder="+241 00 00 00 00"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Adresse</Label>
        <Input
          id="address"
          value={data.address}
          onChange={(e) => handleChange('address', e.target.value)}
          placeholder="Libreville, Gabon"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="summary">Résumé professionnel</Label>
        <Textarea
          id="summary"
          value={data.summary}
          onChange={(e) => handleChange('summary', e.target.value)}
          placeholder="Brève description de votre profil et de vos objectifs..."
          className="min-h-[100px]"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="linkedin">LinkedIn (optionnel)</Label>
          <Input
            id="linkedin"
            value={data.linkedin || ''}
            onChange={(e) => handleChange('linkedin', e.target.value)}
            placeholder="linkedin.com/in/jeandupont"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="website">Site Web (optionnel)</Label>
          <Input
            id="website"
            value={data.website || ''}
            onChange={(e) => handleChange('website', e.target.value)}
            placeholder="jeandupont.com"
          />
        </div>
      </div>
    </div>
  )
}
