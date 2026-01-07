'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { QuizResult } from '@/types/quiz'
import Link from 'next/link'
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts'
import { Download } from 'lucide-react'

interface QuizResultsProps {
  result: QuizResult
}

export function QuizResults({ result }: QuizResultsProps) {
  const data = Object.entries(result.categoryScores).map(([subject, score]) => ({
    subject,
    score,
    fullMark: 100,
  }))

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card>
        <CardHeader className="text-center">
            <CardTitle className="text-2xl">Résultats de l'évaluation</CardTitle>
            <CardDescription>Voici une analyse détaillée de vos compétences.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
            <div className="w-full h-[300px] md:h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    <Radar
                        name="Compétences"
                        dataKey="score"
                        stroke="#2563eb"
                        fill="#3b82f6"
                        fillOpacity={0.6}
                    />
                    </RadarChart>
                </ResponsiveContainer>
            </div>
            <div className="text-center mt-6">
                <p className="text-4xl font-bold text-primary">{result.score}%</p>
                <p className="text-muted-foreground">Score Global</p>
            </div>
        </CardContent>
        <CardFooter className="flex justify-center gap-4">
            <Button variant="outline" asChild>
                <Link href="/dashboard">Retour au tableau de bord</Link>
            </Button>
            <Button>
                <Download className="mr-2 h-4 w-4" />
                Télécharger le certificat
            </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
