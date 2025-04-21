"use client"

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, Loader2 } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { useRouter } from 'next/navigation'
import { createNewChatUrl } from '@/lib/services/chat-navigation'

export function AskAlfred() {
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    
    setIsLoading(true)
    
    try {
      // Create a new chat URL with the query and navigate to it
      const chatUrl = createNewChatUrl(query)
      router.push(chatUrl)
    } catch (error) {
      console.error('Error navigating to chat:', error)
      setIsLoading(false)
    }
  }

  return (
    <Card className="overflow-hidden border-0 bg-gradient-to-b from-[hsl(158_44.7%_95%)] to-white dark:from-[hsl(158_44.7%_15%)] dark:to-[hsl(158_44.7%_10%)]">
      <CardContent className="p-6">
        <div className="mx-auto max-w-2xl space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[hsl(158_44.7%_31.2%)] to-[hsl(158_44.7%_41.2%)] dark:from-[hsl(158_44.7%_60%)] dark:to-[hsl(158_44.7%_70%)]">
              Ask ALFReD
            </h2>
            <p className="text-sm text-muted-foreground">
              Your AI assistant for economic insights and analysis
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex w-full space-x-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask about market trends, economic indicators, or analysis..."
              className="flex-1 bg-white/50 dark:bg-white/5 border-[hsl(158_44.7%_85%)] dark:border-[hsl(158_44.7%_25%)]"
              disabled={isLoading}
            />
            <Button 
              type="submit" 
              disabled={isLoading || !query.trim()}
              className="bg-[hsl(158_44.7%_31.2%)] hover:bg-[hsl(158_44.7%_26.2%)] dark:bg-[hsl(158_44.7%_31.2%)] dark:hover:bg-[hsl(158_44.7%_26.2%)]"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
          
          {!isLoading && (
            <div className="text-center text-sm text-muted-foreground">
              Ask ALFReD about market trends, economic indicators, or request specific analysis.
            </div>
          )}
          
          {isLoading && (
            <div className="flex justify-center items-center space-x-2 text-[hsl(158_44.7%_31.2%)]">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Opening chat with ALFReD...</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 