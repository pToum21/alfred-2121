// components/chat-panel.tsx

'use client'

import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import type { AI, UIState } from '@/app/actions'
import { useUIState, useActions, useAIState } from 'ai/rsc'
import { UserMessage } from './user-message'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from './ui/card'
import { Button } from './ui/button'
import { ChevronRight, Plus, Send } from 'lucide-react'
import EmptyScreen from './empty-screen'
import { nanoid } from 'ai'
import { useAppState } from '@/lib/utils/app-state'
import { getNewChatUrl, isChatPage } from '@/lib/services/chat-navigation'

interface ChatPanelProps {
  messages: UIState
  query?: string
  hideEmptyScreen?: boolean
}

export function ChatPanel({ messages, query, hideEmptyScreen = false }: ChatPanelProps) {
  const [input, setInput] = useState('')
  const [showEmptyScreen, setShowEmptyScreen] = useState(!hideEmptyScreen)
  const [, setMessages] = useUIState<typeof AI>()
  const [aiMessage] = useAIState<typeof AI>()
  const { isGenerating, setIsGenerating, resetChatState } = useAppState()
  const { submit } = useActions()
  const router = useRouter()
  const pathname = usePathname()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const processedQueryRef = useRef<string>('')

  const handleQuerySubmit = useCallback(async (query: string, formData?: FormData) => {
    // Skip if we've already processed this exact query
    if (processedQueryRef.current === query) {
      console.log('Skipping duplicate query:', query)
      return
    }
    
    // Mark this query as processed
    processedQueryRef.current = query
    
    setInput(query)
    setIsGenerating(true)
    setShowEmptyScreen(false)

    setMessages(currentMessages => [
      ...currentMessages,
      {
        id: nanoid(),
        component: <UserMessage message={query} />
      }
    ])

    const data = formData || new FormData()
    if (!formData) {
      data.append('input', query)
    }
    const responseMessage = await submit(data)
    setMessages(currentMessages => [...currentMessages, responseMessage])
  }, [setIsGenerating, setMessages, submit])

  // Create a wrapper function that adapts handleQuerySubmit to match submitServerAction signature
  const handleServerMessage = useCallback(async (message: string): Promise<{ success: boolean }> => {
    await handleQuerySubmit(message);
    return { success: true };
  }, [handleQuerySubmit]);

  const handleSubmit = async (e?: React.FormEvent<HTMLFormElement>) => {
    if (e) {
      e.preventDefault()
    }
    if (input.trim()) {
      await handleQuerySubmit(input)
      setInput('')
    }
  }

  const handleNewChat = () => {
    setIsGenerating(false)
    setMessages([])
    setInput('')
    setShowEmptyScreen(true)
    
    resetChatState()
    
    // Use the navigation service to get the correct URL
    // This ensures we go directly to home page instead of /search
    router.push(getNewChatUrl())
  }

  useEffect(() => {
    if (query && query.trim().length > 0) {
      // Immediately hide the empty screen when we have a query
      setShowEmptyScreen(false);
      
      // Don't check for URL parameters - just process the query directly
      console.log(`[ChatPanel] Processing query directly: ${query}`);
      
      // Only process if we haven't already processed this exact query
      if (processedQueryRef.current !== query) {
        // Process immediately without delay to prevent flashing
        handleQuerySubmit(query);
        // Mark as processed
        processedQueryRef.current = query;
      }
    }
  }, [query, handleQuerySubmit]);

  useEffect(() => {
    const lastMessage = aiMessage.messages.slice(-1)[0]
    if (lastMessage?.type === 'followup') {
      setIsGenerating(false)
    }
  }, [aiMessage, setIsGenerating])

  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  const showNewChatButton = isChatPage(pathname)

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <>
      {/* Only render the EmptyScreen if not hidden and there are no messages */}
      {!hideEmptyScreen && messages.length === 0 ? (
        <div className="min-h-screen transparent-bg">
          <div className="max-w-4xl mx-auto px-4 py-8 transparent-bg">
            <h1 className="mb-8 text-4xl text-muted-foreground text-center">Know Better.</h1>
            
            {showEmptyScreen && (
              <EmptyScreen
                submitServerAction={handleServerMessage}
              />
            )}
          </div>
        </div>
      ) : null}
      
      {/* Always visible input form */}
      <div className="fixed bottom-6 left-0 right-0 px-4 z-40">
        <div className="max-w-3xl mx-auto">
          <Card className="dark-card shadow-lg border-0">
            <CardContent className="p-2 md:p-3">
              <div className="flex items-center gap-2">
                {/* New Chat button integrated in the input panel */}
                {showNewChatButton && (
                  <Button
                    onClick={handleNewChat}
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 flex-shrink-0 rounded-full dark-surface-3 hover:bg-[#2c7359]/30 border-0"
                    title="New Chat"
                  >
                    <Plus className="h-3.5 w-3.5 text-gray-300" />
                  </Button>
                )}
                
                {/* Chat input with submit button */}
                <form onSubmit={handleSubmit} className="flex-1 flex items-center gap-2">
                  <div className="relative flex-1">
                    <Textarea
                      ref={textareaRef}
                      placeholder="Ask ALFReD..."
                      value={input}
                      onChange={(e) => {
                        setInput(e.target.value);
                        // Auto-resize logic
                        e.target.style.height = 'inherit';
                        e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                      }}
                      onKeyDown={handleKeyDown}
                      className="pl-3 pr-2 py-2 min-h-[40px] h-auto max-h-[120px] border-0 rounded-md dark-surface-2 focus-visible:ring-1 focus-visible:ring-[#2c7359]/50 focus:outline-none resize-none overflow-y-auto transition-all duration-200 placeholder:text-gray-400 text-sm text-gray-200"
                      disabled={isGenerating}
                    />
                  </div>
                  <Button 
                    type="submit" 
                    size="icon"
                    disabled={input.trim().length === 0 || isGenerating}
                    className="h-8 w-8 rounded-full bg-[#2c7359] hover:bg-[#2c7359]/90 flex-shrink-0 shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}