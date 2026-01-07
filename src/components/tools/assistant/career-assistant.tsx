'use client'

import { useState } from 'react'
import { Message } from '@/types/interview'
import { ChatInterface } from '../interview/chat-interface'
import { toast } from 'sonner'

export function CareerAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Bonjour ! Je suis votre assistant carrière personnel. Comment puis-je vous aider aujourd\'hui ? (Recherche d\'emploi, réorientation, conseils CV...)',
      sender: 'ai',
      timestamp: new Date().toISOString(),
    }
  ])
  const [isTyping, setIsTyping] = useState(false)

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
        content: "Je comprends votre demande. En tant qu'assistant virtuel (prototype), je ne suis pas encore connecté à l'intelligence artificielle réelle, mais je suis là pour tester l'interface. Bientôt, je pourrai vous donner des conseils personnalisés !",
        sender: 'ai',
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, aiMessage])
      setIsTyping(false)
    }, 1500)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex justify-between items-center px-4 py-2 bg-muted/20 rounded-lg">
        <div>
          <h2 className="font-semibold">Assistant Carrière</h2>
          <p className="text-sm text-muted-foreground">Disponible 24/7 pour vous guider</p>
        </div>
      </div>
      <ChatInterface 
        messages={messages} 
        onSendMessage={handleSendMessage} 
        isTyping={isTyping}
      />
    </div>
  )
}
