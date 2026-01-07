'use client'

import { useState } from 'react'
import { InterviewConfig, Message } from '@/types/interview'
import { InterviewConfigForm } from './interview-config-form'
import { ChatInterface } from './chat-interface'
import { mockInterviewMessages } from '@/lib/data/mock-interview'
import { toast } from 'sonner'

export function InterviewSimulator() {
  const [config, setConfig] = useState<InterviewConfig | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [isTyping, setIsTyping] = useState(false)

  const handleStart = (newConfig: InterviewConfig) => {
    setConfig(newConfig)
    // Initialize with a welcome message based on config
    const initialMessage: Message = {
      id: crypto.randomUUID(),
      content: `Bonjour ! Je suis votre recruteur virtuel. Nous allons commencer un entretien ${newConfig.interviewType === 'behavioral' ? 'comportemental' : newConfig.interviewType === 'technical' ? 'technique' : 'mixte'} pour le poste de ${newConfig.jobTitle}. Êtes-vous prêt ?`,
      sender: 'ai',
      timestamp: new Date().toISOString(),
    }
    setMessages([initialMessage])
    toast.success('Simulation commencée')
  }

  const handleSendMessage = async (content: string) => {
    // Add user message
    const userMessage: Message = {
      id: crypto.randomUUID(),
      content,
      sender: 'user',
      timestamp: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMessage])
    setIsTyping(true)

    // Simulate AI response delay
    setTimeout(() => {
      const aiMessage: Message = {
        id: crypto.randomUUID(),
        content: "C'est noté. Pouvez-vous me donner un exemple concret d'une situation où vous avez dû faire preuve de leadership ?",
        sender: 'ai',
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, aiMessage])
      setIsTyping(false)
    }, 2000)
  }

  if (!config) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px]">
        <InterviewConfigForm onStart={handleStart} />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex justify-between items-center px-4 py-2 bg-muted/20 rounded-lg">
        <div>
          <h2 className="font-semibold">{config.jobTitle}</h2>
          <p className="text-sm text-muted-foreground capitalize">{config.interviewType} • {config.experienceLevel}</p>
        </div>
        {/* Can add controls here like "End Interview" */}
      </div>
      <ChatInterface 
        messages={messages} 
        onSendMessage={handleSendMessage} 
        isTyping={isTyping}
      />
    </div>
  )
}
