'use client';

import React, { useEffect, useState } from 'react'
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent
} from '@radix-ui/react-collapsible'
import { Button } from './ui/button'
import { ChevronDown } from 'lucide-react'
import { StreamableValue, useStreamableValue } from 'ai/rsc'
import { cn } from '@/lib/utils'
import { Separator } from './ui/separator'

interface CollapsibleMessageProps {
  message: {
    id: string
    isCollapsed?: StreamableValue<boolean>
    component: React.ReactNode
  }
  isLastMessage?: boolean
}

export const CollapsibleMessage: React.FC<CollapsibleMessageProps> = ({
  message,
  isLastMessage = false
}) => {
  const [mounted, setMounted] = useState(false);
  const [data] = useStreamableValue(message.isCollapsed)
  const isCollapsed = data ?? false
  const [open, setOpen] = useState(isLastMessage)

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setOpen(isLastMessage)
  }, [isCollapsed, isLastMessage])

  // if not collapsed or not mounted, return the component
  if (!isCollapsed || !mounted) {
    return message.component
  }

  return (
    <Collapsible
      open={open}
      onOpenChange={value => {
        setOpen(value)
      }}
    >
      <CollapsibleTrigger asChild>
        <div
          role="button"
          tabIndex={0}
          className={cn(
            'w-full flex justify-end cursor-pointer',
            !isCollapsed ? 'hidden' : ''
          )}
        >
          <div
            className={cn('-mt-3 rounded-full inline-flex items-center justify-center h-10 w-10 hover:bg-accent')}
          >
            <ChevronDown
              size={14}
              className={cn(
                open ? 'rotate-180' : 'rotate-0',
                'h-4 w-4 transition-all'
              )}
            />
            <span className="sr-only">collapse</span>
          </div>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>{message.component}</CollapsibleContent>
      {!open && <Separator className="my-2 bg-muted" />}
    </Collapsible>
  )
}
