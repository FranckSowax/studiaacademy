'use client'

import { useState } from 'react'
import { InterviewConfig } from '@/types/interview'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'

interface InterviewConfigFormProps {
  onStart: (config: InterviewConfig) => void
}

export function InterviewConfigForm({ onStart }: InterviewConfigFormProps) {
  const [jobTitle, setJobTitle] = useState('')
  const [experienceLevel, setExperienceLevel] = useState<InterviewConfig['experienceLevel']>('mid')
  const [interviewType, setInterviewType] = useState<InterviewConfig['interviewType']>('mixed')
  const [industry, setIndustry] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onStart({
      jobTitle,
      experienceLevel,
      interviewType,
      industry,
    })
  }

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>Configuration de l'entretien</CardTitle>
        <CardDescription>
          Personnalisez votre simulation pour qu'elle corresponde au poste que vous visez.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="jobTitle">Intitulé du poste</Label>
            <Input
              id="jobTitle"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="Ex: Chef de Projet Marketing"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="industry">Secteur d'activité (Optionnel)</Label>
            <Input
              id="industry"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="Ex: Banque, Tech, Retail..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="experienceLevel">Niveau d'expérience</Label>
              <Select
                value={experienceLevel}
                onValueChange={(v: any) => setExperienceLevel(v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="junior">Junior (0-2 ans)</SelectItem>
                  <SelectItem value="mid">Intermédiaire (2-5 ans)</SelectItem>
                  <SelectItem value="senior">Senior (5-8 ans)</SelectItem>
                  <SelectItem value="lead">Lead / Manager (+8 ans)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="interviewType">Type d'entretien</Label>
              <Select
                value={interviewType}
                onValueChange={(v: any) => setInterviewType(v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="behavioral">Comportemental</SelectItem>
                  <SelectItem value="technical">Technique</SelectItem>
                  <SelectItem value="mixed">Mixte</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={!jobTitle}>
            Commencer la simulation
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
