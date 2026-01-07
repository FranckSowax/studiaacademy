'use client'

import { CVExperience } from '@/types/cv'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, Trash2 } from 'lucide-react'

interface ExperienceFormProps {
  data: CVExperience[]
  onChange: (data: CVExperience[]) => void
}

export function ExperienceForm({ data, onChange }: ExperienceFormProps) {
  const handleAdd = () => {
    const newExperience: CVExperience = {
      id: crypto.randomUUID(),
      jobTitle: '',
      company: '',
      location: '',
      startDate: '',
      current: false,
      description: '',
    }
    onChange([newExperience, ...data])
  }

  const handleRemove = (id: string) => {
    onChange(data.filter((exp) => exp.id !== id))
  }

  const handleChange = (id: string, field: keyof CVExperience, value: any) => {
    onChange(
      data.map((exp) =>
        exp.id === id ? { ...exp, [field]: value } : exp
      )
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Expériences Professionnelles</h3>
        <Button onClick={handleAdd} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Ajouter
        </Button>
      </div>

      {data.length === 0 && (
        <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
          Aucune expérience ajoutée pour le moment.
        </div>
      )}

      {data.map((exp) => (
        <div key={exp.id} className="border rounded-lg p-4 space-y-4 bg-card">
          <div className="flex justify-between items-start">
            <h4 className="font-medium text-primary">Poste {data.indexOf(exp) + 1}</h4>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleRemove(exp.id)}
              className="text-destructive hover:text-destructive/90"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Titre du poste</Label>
              <Input
                value={exp.jobTitle}
                onChange={(e) => handleChange(exp.id, 'jobTitle', e.target.value)}
                placeholder="Ex: Chef de Projet"
              />
            </div>
            <div className="space-y-2">
              <Label>Entreprise</Label>
              <Input
                value={exp.company}
                onChange={(e) => handleChange(exp.id, 'company', e.target.value)}
                placeholder="Ex: Studia Academy"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Lieu</Label>
              <Input
                value={exp.location}
                onChange={(e) => handleChange(exp.id, 'location', e.target.value)}
                placeholder="Ex: Libreville"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date de début</Label>
              <Input
                type="month"
                value={exp.startDate}
                onChange={(e) => handleChange(exp.id, 'startDate', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Date de fin</Label>
              <Input
                type="month"
                value={exp.endDate || ''}
                onChange={(e) => handleChange(exp.id, 'endDate', e.target.value)}
                disabled={exp.current}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id={`current-${exp.id}`}
              checked={exp.current}
              onCheckedChange={(checked) => handleChange(exp.id, 'current', checked)}
            />
            <Label htmlFor={`current-${exp.id}`}>Poste actuel</Label>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={exp.description}
              onChange={(e) => handleChange(exp.id, 'description', e.target.value)}
              placeholder="Décrivez vos missions et réalisations..."
              className="min-h-[100px]"
            />
          </div>
        </div>
      ))}
    </div>
  )
}
