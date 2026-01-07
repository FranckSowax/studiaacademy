'use client'

import { useState } from 'react'
import { AnalysisResult } from '@/types/analysis'
import { AnalysisUpload } from './analysis-upload'
import { AnalysisResults } from './analysis-results'
import { mockAnalysisResult } from '@/lib/data/mock-analysis'
import { toast } from 'sonner'

export function CVAnalysis() {
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const handleUpload = async (file: File) => {
    setIsAnalyzing(true)
    
    // Simulate API call / Analysis process
    try {
        await new Promise(resolve => setTimeout(resolve, 3000))
        
        // In a real app, we would send the file to an API endpoint here
        // const formData = new FormData()
        // formData.append('file', file)
        // const response = await fetch('/api/analyze-cv', { method: 'POST', body: formData })
        // const data = await response.json()
        
        // For prototype, use mock data but update filename/date
        const mockResult = {
            ...mockAnalysisResult,
            fileName: file.name,
            analyzedAt: new Date().toISOString()
        }
        
        setResult(mockResult)
        toast.success('Analyse terminée avec succès !')
    } catch (error) {
        console.error('Analysis error:', error)
        toast.error("Une erreur est survenue lors de l'analyse.")
    } finally {
        setIsAnalyzing(false)
    }
  }

  return (
    <div className="container mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Analyse de CV par IA</h1>
        <p className="text-muted-foreground">
            Téléchargez votre CV pour obtenir une évaluation détaillée et des conseils personnalisés.
        </p>
      </div>

      {!result ? (
        <AnalysisUpload onUpload={handleUpload} isAnalyzing={isAnalyzing} />
      ) : (
        <AnalysisResults result={result} />
      )}
    </div>
  )
}
