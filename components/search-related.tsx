'use client'

import React, { useEffect, useState } from 'react'
import { useActions, useStreamableValue, useUIState, StreamableValue } from 'ai/rsc'
import { AI } from '@/app/actions'
import { UserMessage } from './user-message'
import { PartialRelated } from '@/lib/schema/related'
import { Section } from './section'
import { TrendingUp, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SearchRelatedProps {
  relatedQueries: StreamableValue<PartialRelated>
}

export const SearchRelated: React.FC<SearchRelatedProps> = ({ relatedQueries }) => {
  const { submit } = useActions()
  const [, setMessages] = useUIState<typeof AI>()
  const [data, error, pending] = useStreamableValue(relatedQueries)
  const [related, setRelated] = useState<PartialRelated>()
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  useEffect(() => {
    if (!data) return
    setRelated(data)
  }, [data])

  const handleSubmit = async (query: string) => {
    const formData = new FormData()
    formData.append('related_query', query)

    const userMessage = {
      id: Date.now(),
      component: <UserMessage message={query} />
    }

    const responseMessage = await submit(formData)
    setMessages(currentMessages => [
      ...currentMessages,
      userMessage,
      responseMessage
    ])
  }

  if (error) return null

  return (
    <Section title="Related" separator={true}>
      <div className="space-y-2">
        {pending ? (
          // Loading state
          <div className="space-y-2">
            {[...Array(4)].map((_, index) => (
              <div 
                key={index} 
                className="h-8 bg-muted/40 rounded-md animate-pulse"
              />
            ))}
          </div>
        ) : related && Array.isArray(related.items) ? (
          related.items
            .filter(item => item?.query !== '')
            .slice(0, 4)
            .map((item, index) => (
              <button
                key={index}
                className="w-full group"
                onClick={() => handleSubmit(item?.query || '')}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <div className={cn(
                  "flex items-center gap-3 p-2 rounded-md transition-all duration-200",
                  "hover:bg-primary/5 hover:pl-4"
                )}>
                  <div className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0",
                    "bg-primary/10 text-primary transition-all duration-200",
                    hoveredIndex === index && "bg-primary text-primary-foreground"
                  )}>
                    <TrendingUp className="h-3 w-3" />
                  </div>
                  
                  <span className="text-sm text-muted-foreground/90 group-hover:text-foreground transition-colors duration-200 text-left flex-1">
                    {item?.query}
                  </span>
                  
                  <ArrowRight className={cn(
                    "h-4 w-4 transition-all duration-200 transform",
                    hoveredIndex === index ? "opacity-100 translate-x-0 text-primary" : "opacity-0 -translate-x-2 text-muted-foreground/50"
                  )} />
                </div>
              </button>
            ))
        ) : (
          <div className="text-sm text-muted-foreground/70">
            No follow-up questions available
          </div>
        )}
      </div>
    </Section>
  )
}

export default SearchRelated