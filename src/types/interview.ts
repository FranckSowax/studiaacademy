export type Sender = 'user' | 'ai'

export interface Message {
  id: string
  content: string
  sender: Sender
  timestamp: string
}

export interface InterviewConfig {
  jobTitle: string
  experienceLevel: 'junior' | 'mid' | 'senior' | 'lead'
  industry?: string
  interviewType: 'behavioral' | 'technical' | 'mixed'
}

export interface InterviewSession {
  id: string
  config: InterviewConfig
  messages: Message[]
  status: 'active' | 'completed'
  startedAt: string
}
