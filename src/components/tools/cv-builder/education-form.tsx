'use client'

import { CVEducation } from '@/types/cv'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, Trash2 } from 'lucide-react'

interface EducationFormProps {
  data: CVEducation[]
  onChange: (data: CVEducation[]) => void
}

export function EducationForm({ data, onChange }: EducationFormProps) {
  const handleAdd = () => {
    const newEducation: CVEducation = {
      id: crypto.randomUUID(),
      degree: '',
      school: '',
      location: '',
      startDate: '',
      current: false,
    }
    onChange([newEducation, ...data])
  }

  const handleRemove = (id: string) => {
    onChange(data.filter((edu) => edu.id !== id))
  }

  const handleChange = (id: string, field: keyof CVEducation, value: any) => {
    onChange(
      data.map((edu) =>
        edu.id === id ? { ...edu, [field]: value } : edu
      )
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Formation & Diplômes</h3>
        <Button onClick={handleAdd} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Ajouter
        </Button>
      </div>

      {data.length === 0 && (
        <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
          Aucune formation ajoutée pour le moment.
        </div>
      )}

      {data.map((edu) => (
        <div key={edu.id} className="border rounded-lg p-4 space-y-4 bg-card">
          <div className="flex justify-between items-start">
            <h4 className="font-medium text-primary">Formation {data.indexOf(edu) + 1}</h4>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleRemove(edu.id)}
              className="text-destructive hover:text-destructive/90"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Diplôme / Certificat</Label>
              <Input
                value={edu.degree}
                onChange={(e) => handleChange(edu.id, 'degree', e.target.value)}
                placeholder="Ex: Master en Informatique"
              />
            </div>
            <div className="space-y-2">
              <Label>École / Université</Label>
              <Input
                value={edu.school}
                onChange={(e) => handleChange(edu.id, 'school', e.target.value)}
                placeholder="Ex: Université Omar Bongo"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Lieu</Label>
              <Input
                value={edu.location}
                onChange={(e) => handleChange(edu.id, 'location', e.target.value)}
                placeholder="Ex: Libreville"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date de début</Label>
              <Input
                type="month"
                value={edu.startDate}
                onChange={(e) => handleChange(edu.id, 'startDate', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Date de fin</Label>
              <Input
                type="month"
                value={edu.endDate || ''}
                onChange={(e) => handleChange(edu.id, 'endDate', e.target.value)}
                disabled={edu.current}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id={`edu-current-${edu.id}`}
              checked={edu.current}
              onCheckedChange={(checked) => handleChange(edu.id, 'current', checked)}
            />
            <Label htmlFor={`edu-current-${edu.id}`}>En cours</Label>
          </div>
        </div>
      ))}
    </div>
  )
}
