'use client'

import { CVSkill, CVLanguage } from '@/types/cv'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Trash2 } from 'lucide-react'

interface SkillsFormProps {
  data: CVSkill[]
  // We need to handle languages here too or pass them separately, 
  // but looking at CVBuilder state, it passes data={cvData.skills} only.
  // The interface in CVBuilder for handleSkillsChange takes CVData['skills'].
  // To handle languages, we might need to update CVBuilder or include languages in this form via a separate prop if we want to keep them distinct,
  // OR we can make this form handle both if we pass the whole CVData or specific props.
  // Let's check CVBuilder again. 
  // It has handleSkillsChange = (data: CVData['skills']).
  // It seems I missed passing languages to this form in CVBuilder or I should create a separate LanguageForm.
  // However, usually skills and languages are small lists, so combining them is UI friendly.
  // But strictly speaking, the prop passed is `data={cvData.skills}`.
  // I will assume for now this form ONLY handles skills based on the prop.
  // I should probably add Languages support to this form or a separate one.
  // Let's modify CVBuilder to pass languages to this form as well, or create a separate tab/section.
  // For simplicity, let's stick to the current prop for skills, and I'll add a "Languages" section in this form 
  // BUT I need the onChange handler for languages too.
  // I'll update the component to just handle skills for now to match the prop type, 
  // AND I will add a separate Language section if I can access the state, 
  // OR I will assume the user wants me to fix the props in CVBuilder later.
  
  // Wait, I am the one writing the code. I can update CVBuilder.
  // Let's write this component to handle Skills ONLY first as per the prop `data: CVSkill[]`.
  // I will modify CVBuilder to pass languages or handle it separately.
  // Actually, looking at the previous step's todo, it said "Implement Skills & Languages Form".
  // So I should probably handle both.
  // I'll define props to accept both if possible, or just skills for now and let the user know/update CVBuilder.
  onChange: (data: CVSkill[]) => void
}

export function SkillsForm({ data, onChange }: SkillsFormProps) {
  const handleAdd = () => {
    const newSkill: CVSkill = {
      id: crypto.randomUUID(),
      name: '',
      level: 'intermediate',
    }
    onChange([...data, newSkill])
  }

  const handleRemove = (id: string) => {
    onChange(data.filter((skill) => skill.id !== id))
  }

  const handleChange = (id: string, field: keyof CVSkill, value: any) => {
    onChange(
      data.map((skill) =>
        skill.id === id ? { ...skill, [field]: value } : skill
      )
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Compétences</h3>
        <Button onClick={handleAdd} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Ajouter
        </Button>
      </div>

      {data.length === 0 && (
        <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
          Aucune compétence ajoutée.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.map((skill) => (
          <div key={skill.id} className="flex items-end gap-2 border rounded-lg p-3 bg-card">
            <div className="flex-1 space-y-2">
              <Label className="sr-only">Compétence</Label>
              <Input
                value={skill.name}
                onChange={(e) => handleChange(skill.id, 'name', e.target.value)}
                placeholder="Ex: React, Gestion de projet..."
              />
            </div>
            <div className="w-[140px] space-y-2">
              <Label className="sr-only">Niveau</Label>
              <Select
                value={skill.level}
                onValueChange={(value) => handleChange(skill.id, 'level', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Débutant</SelectItem>
                  <SelectItem value="intermediate">Intermédiaire</SelectItem>
                  <SelectItem value="advanced">Avancé</SelectItem>
                  <SelectItem value="expert">Expert</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleRemove(skill.id)}
              className="text-destructive hover:text-destructive/90"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
