'use client'

import { useState } from 'react'
import { Course, CourseModule } from '@/types/course'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { CheckCircle, PlayCircle, FileText, HelpCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CourseViewProps {
  course: Course
}

export function CourseView({ course }: CourseViewProps) {
  // Flatten modules to easily find next/prev
  const allModules = course.chapters.flatMap(c => c.modules)
  
  const [currentModuleId, setCurrentModuleId] = useState<string>(allModules[0]?.id)
  const [completedModules, setCompletedModules] = useState<string[]>([])

  const currentModule = allModules.find(m => m.id === currentModuleId)
  const currentModuleIndex = allModules.findIndex(m => m.id === currentModuleId)

  const handleModuleClick = (moduleId: string) => {
    setCurrentModuleId(moduleId)
  }

  const handleNext = () => {
    if (currentModuleIndex < allModules.length - 1) {
      const nextModule = allModules[currentModuleIndex + 1]
      handleModuleComplete(currentModuleId)
      setCurrentModuleId(nextModule.id)
    } else {
      handleModuleComplete(currentModuleId)
      // Course finished logic
    }
  }

  const handlePrevious = () => {
    if (currentModuleIndex > 0) {
      setCurrentModuleId(allModules[currentModuleIndex - 1].id)
    }
  }

  const handleModuleComplete = (moduleId: string) => {
    if (!completedModules.includes(moduleId)) {
      setCompletedModules(prev => [...prev, moduleId])
    }
  }

  const getModuleIcon = (type: CourseModule['type']) => {
    switch (type) {
      case 'video': return <PlayCircle className="h-4 w-4" />
      case 'quiz': return <HelpCircle className="h-4 w-4" />
      case 'text': return <FileText className="h-4 w-4" />
    }
  }

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-8rem)] gap-6">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col bg-background border rounded-lg overflow-hidden shadow-sm">
        <div className="flex-1 p-6 overflow-y-auto">
          {currentModule ? (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">{currentModule.title}</h2>
              
              {currentModule.type === 'video' && currentModule.videoUrl && (
                <div className="aspect-video bg-black rounded-lg overflow-hidden">
                  <iframe 
                    src={currentModule.videoUrl} 
                    className="w-full h-full" 
                    allowFullScreen 
                    title={currentModule.title}
                  />
                </div>
              )}

              {currentModule.type === 'text' && currentModule.content && (
                <div className="prose dark:prose-invert max-w-none">
                  {/* Simple rendering for now, ideally use a markdown renderer */}
                  <div dangerouslySetInnerHTML={{ __html: currentModule.content.replace(/\n/g, '<br/>') }} />
                </div>
              )}

              {currentModule.type === 'quiz' && (
                <div className="flex flex-col items-center justify-center p-12 bg-muted/20 rounded-lg border-2 border-dashed">
                  <HelpCircle className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Quiz : {currentModule.title}</h3>
                  <p className="text-muted-foreground mb-6">Testez vos connaissances sur ce chapitre.</p>
                  <Button onClick={() => handleModuleComplete(currentModule.id)}>
                    Démarrer le Quiz
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p>Sélectionnez un module pour commencer.</p>
            </div>
          )}
        </div>

        {/* Navigation Footer */}
        <div className="p-4 border-t bg-muted/10 flex justify-between items-center">
          <Button 
            variant="outline" 
            onClick={handlePrevious} 
            disabled={currentModuleIndex === 0}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Précédent
          </Button>
          <div className="text-sm text-muted-foreground hidden md:block">
            {currentModuleIndex + 1} / {allModules.length}
          </div>
          <Button onClick={handleNext}>
            {currentModuleIndex === allModules.length - 1 ? 'Terminer' : 'Suivant'}
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Sidebar Course Outline */}
      <div className="w-full lg:w-80 border rounded-lg bg-background flex flex-col h-full overflow-hidden">
        <div className="p-4 border-b bg-muted/10">
          <h3 className="font-semibold text-lg line-clamp-1">{course.title}</h3>
          <div className="text-xs text-muted-foreground mt-1">
            {Math.round((completedModules.length / allModules.length) * 100)}% complété
          </div>
          <div className="h-1 w-full bg-muted mt-2 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300" 
              style={{ width: `${(completedModules.length / allModules.length) * 100}%` }}
            />
          </div>
        </div>
        <ScrollArea className="flex-1">
          <Accordion type="multiple" defaultValue={course.chapters.map(c => c.id)} className="w-full">
            {course.chapters.map((chapter) => (
              <AccordionItem key={chapter.id} value={chapter.id}>
                <AccordionTrigger className="px-4 py-2 hover:no-underline hover:bg-muted/50">
                  <span className="text-sm font-medium text-left">{chapter.title}</span>
                </AccordionTrigger>
                <AccordionContent className="pt-0 pb-0">
                  <div className="flex flex-col">
                    {chapter.modules.map((module) => (
                      <button
                        key={module.id}
                        onClick={() => handleModuleClick(module.id)}
                        className={cn(
                          "flex items-center gap-3 px-6 py-3 text-sm transition-colors border-l-2",
                          currentModuleId === module.id 
                            ? "bg-primary/5 border-primary text-primary" 
                            : "hover:bg-muted/50 border-transparent text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <div className={cn(
                          "shrink-0",
                          completedModules.includes(module.id) ? "text-green-500" : "text-muted-foreground"
                        )}>
                          {completedModules.includes(module.id) ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : (
                            getModuleIcon(module.type)
                          )}
                        </div>
                        <div className="flex-1 text-left line-clamp-1">
                          {module.title}
                        </div>
                        <div className="text-xs opacity-70 shrink-0">
                          {module.duration}
                        </div>
                      </button>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </ScrollArea>
      </div>
    </div>
  )
}
