'use client';

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { ChatPanel } from './chat-panel'
import { ChatMessages } from './chat-messages'
import { useUIState, useAIState } from 'ai/rsc'
import Logger from '@/lib/utils/logging'

type ChatProps = {
  id?: string
  query?: string
}

export function Chat({ id, query }: ChatProps) {
  const path = usePathname()
  const router = useRouter()
  const [messages] = useUIState()
  const [aiState, setAIState] = useAIState()
  // Add state to prevent flashing of EmptyScreen during query processing
  const [isInitialQueryProcessing, setIsInitialQueryProcessing] = useState(!!query)

  useEffect(() => {
    // If we have a query, mark that we're in initial processing state
    if (query && query.trim().length > 0) {
      setIsInitialQueryProcessing(true)
    }

    // Only update URL when we're certain the chat exists and has been saved
    if (
      id && 
      id.length > 5 && // Ensure ID is a valid nanoid (typically longer than 5 chars)
      aiState.chatId === id && // Ensure the chat ID in state matches the prop
      messages.length >= 1 // Ensure we have at least one message
    ) {
      // Use a consistent logging format for traceability
      Logger.debug('[Chat] Updating URL to chat page', { id })
      
      // We've processed messages, so we're no longer in initial query processing
      setIsInitialQueryProcessing(false)
      
      // Use replaceState instead of direct manipulation
      // This avoids adding a new entry in the browser history
      window.history.replaceState({}, '', `/search/${id}`)
    }
  }, [id, path, messages, query, aiState.chatId])

  return (
    <div className="px-8 sm:px-12 pt-2 pb-24 max-w-3xl mx-auto flex flex-col space-y-3 md:space-y-4">
      <ChatMessages messages={messages} />
      <ChatPanel 
        messages={messages} 
        query={query} 
        hideEmptyScreen={isInitialQueryProcessing} 
      />
    </div>
  )
}