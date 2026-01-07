'use client'

import { useState } from 'react'
import { CVData, initialCVData } from '@/types/cv'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { PersonalForm } from './personal-form'
import { ExperienceForm } from './experience-form'
import { EducationForm } from './education-form'
import { SkillsForm } from './skills-form'
import { LanguagesForm } from './languages-form'
import { CVPreview } from './cv-preview'
import { Eye, Save, Download } from 'lucide-react'
import { toast } from 'sonner'

export function CVBuilder() {
  const [cvData, setCvData] = useState<CVData>(initialCVData)
  const [activeTab, setActiveTab] = useState('personal')
  const [showPreview, setShowPreview] = useState(false)

  const handlePersonalChange = (data: CVData['profile']) => {
    setCvData((prev) => ({ ...prev, profile: data }))
  }

  const handleExperienceChange = (data: CVData['experience']) => {
    setCvData((prev) => ({ ...prev, experience: data }))
  }
  
  const handleEducationChange = (data: CVData['education']) => {
      setCvData((prev) => ({ ...prev, education: data }))
  }

  const handleSkillsChange = (data: CVData['skills']) => {
      setCvData((prev) => ({ ...prev, skills: data }))
  }

  const handleLanguagesChange = (data: CVData['languages']) => {
      setCvData((prev) => ({ ...prev, languages: data }))
  }

  const handleSave = () => {
    // Save to local storage or backend
    console.log('Saving CV:', cvData)
    toast.success('CV sauvegardé avec succès !')
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)]">
      {/* Form Section */}
      <div className={`flex-1 flex flex-col ${showPreview ? 'hidden lg:flex' : 'flex'}`}>
        <div className="mb-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold">Éditeur de CV</h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)} className="lg:hidden">
              <Eye className="mr-2 h-4 w-4" />
              {showPreview ? 'Éditer' : 'Aperçu'}
            </Button>
            <Button variant="outline" size="sm" onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" />
              Sauvegarder
            </Button>
          </div>
        </div>

        <Card className="flex-1 overflow-hidden flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <div className="border-b px-4 bg-muted/30">
              <TabsList className="w-full justify-start h-12 bg-transparent p-0 overflow-x-auto no-scrollbar">
                <TabsTrigger value="personal" className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-t-lg rounded-b-none border-b-2 border-transparent data-[state=active]:border-primary px-4 py-3 shrink-0">Infos Personnelles</TabsTrigger>
                <TabsTrigger value="experience" className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-t-lg rounded-b-none border-b-2 border-transparent data-[state=active]:border-primary px-4 py-3 shrink-0">Expérience</TabsTrigger>
                <TabsTrigger value="education" className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-t-lg rounded-b-none border-b-2 border-transparent data-[state=active]:border-primary px-4 py-3 shrink-0">Formation</TabsTrigger>
                <TabsTrigger value="skills" className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-t-lg rounded-b-none border-b-2 border-transparent data-[state=active]:border-primary px-4 py-3 shrink-0">Compétences</TabsTrigger>
                <TabsTrigger value="languages" className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-t-lg rounded-b-none border-b-2 border-transparent data-[state=active]:border-primary px-4 py-3 shrink-0">Langues</TabsTrigger>
              </TabsList>
            </div>
            
            <CardContent className="flex-1 overflow-y-auto p-6">
              <TabsContent value="personal" className="m-0 h-full">
                <PersonalForm data={cvData.profile} onChange={handlePersonalChange} />
              </TabsContent>
              <TabsContent value="experience" className="m-0 h-full">
                <ExperienceForm data={cvData.experience} onChange={handleExperienceChange} />
              </TabsContent>
              <TabsContent value="education" className="m-0 h-full">
                 <EducationForm data={cvData.education} onChange={handleEducationChange} />
              </TabsContent>
              <TabsContent value="skills" className="m-0 h-full">
                 <SkillsForm data={cvData.skills} onChange={handleSkillsChange} />
              </TabsContent>
              <TabsContent value="languages" className="m-0 h-full">
                 <LanguagesForm data={cvData.languages} onChange={handleLanguagesChange} />
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>

      {/* Preview Section */}
      <div className={`flex-1 lg:flex flex-col ${showPreview ? 'flex' : 'hidden'}`}>
        <div className="mb-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold">Aperçu en direct</h2>
          <Button size="sm">
            <Download className="mr-2 h-4 w-4" />
            Télécharger PDF
          </Button>
        </div>
        <Card className="flex-1 overflow-hidden bg-slate-100 dark:bg-slate-900 border-none shadow-inner">
          <CardContent className="h-full p-4 overflow-y-auto flex justify-center">
            <CVPreview data={cvData} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
