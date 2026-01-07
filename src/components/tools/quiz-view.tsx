'use client'

import { useState, useEffect } from 'react'
import { Quiz, QuizResult } from '@/types/quiz'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { ChevronRight, ChevronLeft, Clock, CheckCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { QuizResults } from './quiz-results'
import { toast } from 'sonner'

interface QuizViewProps {
  quiz: Quiz
}

export function QuizView({ quiz }: QuizViewProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [timeLeft, setTimeLeft] = useState(quiz.durationMinutes * 60)
  const [isCompleted, setIsCompleted] = useState(false)
  const [result, setResult] = useState<QuizResult | null>(null)

  const currentQuestion = quiz.questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100

  useEffect(() => {
    if (isCompleted) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          handleSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isCompleted])

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const handleAnswer = (value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: value,
    }))
  }

  const handleNext = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1)
    } else {
      handleSubmit()
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1)
    }
  }

  const handleSubmit = () => {
    setIsCompleted(true)
    
    // Calculate Score
    let correctCount = 0
    const categoryScores: Record<string, { total: number; correct: number }> = {}

    quiz.questions.forEach((q) => {
      const userAnswer = answers[q.id]
      const correctOption = q.options.find((opt) => opt.isCorrect)
      const isCorrect = userAnswer === correctOption?.id
      
      if (isCorrect) correctCount++

      // Category tracking
      if (!categoryScores[q.category]) {
        categoryScores[q.category] = { total: 0, correct: 0 }
      }
      categoryScores[q.category].total++
      if (isCorrect) categoryScores[q.category].correct++
    })

    const finalCategoryScores: Record<string, number> = {}
    Object.entries(categoryScores).forEach(([cat, stats]) => {
      finalCategoryScores[cat] = Math.round((stats.correct / stats.total) * 100)
    })

    const totalScore = Math.round((correctCount / quiz.questions.length) * 100)

    setResult({
      quizId: quiz.id,
      score: totalScore,
      totalQuestions: quiz.questions.length,
      categoryScores: finalCategoryScores,
      completedAt: new Date().toISOString(),
    })
    
    toast.success("Évaluation terminée !")
  }

  if (isCompleted && result) {
    return <QuizResults result={result} />
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold">{quiz.title}</h2>
          <p className="text-muted-foreground text-sm">Question {currentQuestionIndex + 1} sur {quiz.questions.length}</p>
        </div>
        <div className={`flex items-center gap-2 font-mono text-lg font-medium px-4 py-2 rounded-md ${timeLeft < 60 ? 'bg-red-100 text-red-600' : 'bg-secondary'}`}>
          <Clock className="h-5 w-5" />
          {formatTime(timeLeft)}
        </div>
      </div>

      <Progress value={progress} className="mb-8" />

      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestionIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          <Card>
            <CardHeader>
              <div className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                {currentQuestion.category}
              </div>
              <CardTitle className="text-xl md:text-2xl">
                {currentQuestion.text}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={answers[currentQuestion.id] || ''}
                onValueChange={handleAnswer}
                className="space-y-3"
              >
                {currentQuestion.options.map((option) => (
                  <div key={option.id} className={`flex items-center space-x-2 border rounded-lg p-4 cursor-pointer transition-colors ${answers[currentQuestion.id] === option.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}>
                    <RadioGroupItem value={option.id} id={`option-${option.id}`} />
                    <Label htmlFor={`option-${option.id}`} className="flex-1 cursor-pointer font-normal text-base">
                      {option.text}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
            <CardFooter className="flex justify-between pt-6">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Précédent
              </Button>
              <Button
                onClick={handleNext}
                disabled={!answers[currentQuestion.id]}
              >
                {currentQuestionIndex === quiz.questions.length - 1 ? (
                  <>Terminer <CheckCircle className="ml-2 h-4 w-4" /></>
                ) : (
                  <>Suivant <ChevronRight className="ml-2 h-4 w-4" /></>
                )}
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
