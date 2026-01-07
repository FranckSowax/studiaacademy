'use client'

import { CVLanguage } from '@/types/cv'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Trash2 } from 'lucide-react'

interface LanguagesFormProps {
  data: CVLanguage[]
  onChange: (data: CVLanguage[]) => void
}

export function LanguagesForm({ data, onChange }: LanguagesFormProps) {
  const handleAdd = () => {
    const newLanguage: CVLanguage = {
      id: crypto.randomUUID(),
      name: '',
      proficiency: 'intermediate',
    }
    onChange([...data, newLanguage])
  }

  const handleRemove = (id: string) => {
    onChange(data.filter((lang) => lang.id !== id))
  }

  const handleChange = (id: string, field: keyof CVLanguage, value: any) => {
    onChange(
      data.map((lang) =>
        lang.id === id ? { ...lang, [field]: value } : lang
      )
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Langues</h3>
        <Button onClick={handleAdd} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Ajouter
        </Button>
      </div>

      {data.length === 0 && (
        <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
          Aucune langue ajoutée.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.map((lang) => (
          <div key={lang.id} className="flex items-end gap-2 border rounded-lg p-3 bg-card">
            <div className="flex-1 space-y-2">
              <Label className="sr-only">Langue</Label>
              <Input
                value={lang.name}
                onChange={(e) => handleChange(lang.id, 'name', e.target.value)}
                placeholder="Ex: Anglais, Espagnol..."
              />
            </div>
            <div className="w-[140px] space-y-2">
              <Label className="sr-only">Niveau</Label>
              <Select
                value={lang.proficiency}
                onValueChange={(value) => handleChange(lang.id, 'proficiency', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Basique</SelectItem>
                  <SelectItem value="intermediate">Intermédiaire</SelectItem>
                  <SelectItem value="fluent">Courant</SelectItem>
                  <SelectItem value="native">Langue maternelle</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleRemove(lang.id)}
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
