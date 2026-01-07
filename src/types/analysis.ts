export interface AnalysisScore {
  category: string
  score: number
  maxScore: number
  feedback: string
}

export interface AnalysisSuggestion {
  type: 'critical' | 'improvement' | 'strength'
  title: string
  description: string
}

export interface AnalysisResult {
  id: string
  fileName: string
  overallScore: number
  scores: AnalysisScore[]
  suggestions: AnalysisSuggestion[]
  analyzedAt: string
  summary: string
}
