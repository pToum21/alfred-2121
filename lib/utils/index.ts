import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { createOpenAI } from '@ai-sdk/openai'
import { google } from '@ai-sdk/google'
import { anthropic } from '@ai-sdk/anthropic'
import { CoreMessage } from 'ai'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getModel() {
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY

  if (!anthropicApiKey) {
    throw new Error('Missing API key for Anthropic')
  }

  return anthropic('claude-3-7-sonnet-20250219')
}

export function transformToolMessages(messages: CoreMessage[]): CoreMessage[] {
  return messages.map(message =>
    message.role === 'tool'
      ? {
          ...message,
          role: 'assistant',
          content: JSON.stringify(message.content),
          type: 'tool'
        }
      : message
  ) as CoreMessage[]
}