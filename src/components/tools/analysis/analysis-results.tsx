'use client'

import { AnalysisResult } from '@/types/analysis'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, AlertTriangle, Info, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface AnalysisResultsProps {
  result: AnalysisResult
}

export function AnalysisResults({ result }: AnalysisResultsProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-100'
    if (score >= 50) return 'bg-yellow-100'
    return 'bg-red-100'
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Overall Score */}
      <Card className="border-2 border-primary/10">
        <CardHeader className="text-center pb-2">
          <CardTitle>Score Global</CardTitle>
          <CardDescription>Analyse du fichier {result.fileName}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4">
          <div className={`relative flex items-center justify-center w-32 h-32 rounded-full border-8 ${getScoreColor(result.overallScore).replace('text', 'border')} bg-background`}>
            <span className={`text-4xl font-bold ${getScoreColor(result.overallScore)}`}>
              {result.overallScore}
            </span>
          </div>
          <p className="text-center text-muted-foreground max-w-lg">
            {result.summary}
          </p>
        </CardContent>
      </Card>

      {/* Detailed Scores */}
      <div className="grid gap-4 md:grid-cols-2">
        {result.scores.map((item, index) => (
          <Card key={index}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center mb-1">
                <CardTitle className="text-base">{item.category}</CardTitle>
                <span className={`font-bold ${getScoreColor((item.score / item.maxScore) * 100)}`}>
                  {item.score}/{item.maxScore}
                </span>
              </div>
              <Progress value={(item.score / item.maxScore) * 100} className="h-2" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{item.feedback}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Suggestions */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Recommandations</h3>
        {result.suggestions.map((suggestion, index) => (
          <Card key={index} className="border-l-4 border-l-primary">
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="shrink-0 mt-1">
                  {suggestion.type === 'critical' && <AlertTriangle className="h-5 w-5 text-red-500" />}
                  {suggestion.type === 'improvement' && <Info className="h-5 w-5 text-blue-500" />}
                  {suggestion.type === 'strength' && <CheckCircle className="h-5 w-5 text-green-500" />}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{suggestion.title}</h4>
                    <Badge variant="outline" className={`capitalize ${
                      suggestion.type === 'critical' ? 'border-red-200 bg-red-50 text-red-700' :
                      suggestion.type === 'strength' ? 'border-green-200 bg-green-50 text-green-700' :
                      'border-blue-200 bg-blue-50 text-blue-700'
                    }`}>
                      {suggestion.type === 'critical' ? 'Critique' : 
                       suggestion.type === 'strength' ? 'Point Fort' : 'Amélioration'}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground">{suggestion.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-center pt-4">
        <Button size="lg" asChild>
          <Link href="/services/create">
            Améliorer mon CV avec le Générateur <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  )
}
