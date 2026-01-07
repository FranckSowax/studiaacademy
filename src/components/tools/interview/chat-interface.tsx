'use client'

import { useRef, useEffect, useState } from 'react'
import { Message } from '@/types/interview'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Send, Mic, User as UserIcon, Bot } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChatInterfaceProps {
  messages: Message[]
  onSendMessage: (message: string) => void
  isTyping?: boolean
}

export function ChatInterface({ messages, onSendMessage, isTyping }: ChatInterfaceProps) {
  const [input, setInput] = useRef<HTMLInputElement>(null).current ? [null, null] : [undefined, undefined] // Hack to avoid useState re-render if not needed, but actually I need state for input value
  // Let's use standard useState
  const [inputValue, setInputValue] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  // Need to import useState
  
  const handleSend = () => {
    if (!inputValue.trim()) return
    onSendMessage(inputValue)
    setInputValue('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isTyping])

  return (
    <div className="flex flex-col h-[600px] border rounded-lg bg-background shadow-sm">
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex w-full gap-2 max-w-[80%]",
                message.sender === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
              )}
            >
              <Avatar className="h-8 w-8">
                {message.sender === 'ai' ? (
                  <AvatarFallback className="bg-primary text-primary-foreground"><Bot className="h-4 w-4" /></AvatarFallback>
                ) : (
                  <AvatarFallback className="bg-muted"><UserIcon className="h-4 w-4" /></AvatarFallback>
                )}
              </Avatar>
              <div
                className={cn(
                  "rounded-lg px-4 py-2 text-sm",
                  message.sender === 'user'
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                )}
              >
                {message.content}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex w-full gap-2 max-w-[80%] mr-auto">
               <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground"><Bot className="h-4 w-4" /></AvatarFallback>
               </Avatar>
               <div className="bg-muted rounded-lg px-4 py-2 text-sm flex items-center gap-1">
                 <span className="animate-bounce">.</span>
                 <span className="animate-bounce delay-100">.</span>
                 <span className="animate-bounce delay-200">.</span>
               </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>
      <div className="p-4 border-t bg-muted/10 flex gap-2">
        <Button variant="ghost" size="icon" className="shrink-0">
          <Mic className="h-5 w-5 text-muted-foreground" />
        </Button>
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Tapez votre réponse..."
          className="flex-1"
        />
        <Button onClick={handleSend} size="icon" disabled={!inputValue.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
