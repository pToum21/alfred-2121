// app/search/[id]/page.tsx

import { notFound, redirect } from 'next/navigation'
import { Chat } from '@/components/chat'
import { getChat } from '@/lib/actions/chat'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import { Suspense } from 'react'
import { Metadata } from 'next'
import { nanoid } from 'ai'
import Logger from '@/lib/utils/logging'
import { shouldProcessQuery, extractQuery } from '@/lib/services/chat-navigation'

export const maxDuration = 300
export const revalidate = 0

export interface SearchPageProps {
  params: {
    id: string
  }
  searchParams: { [key: string]: string | string[] | undefined }
}

export async function generateMetadata({ params }: SearchPageProps): Promise<Metadata> {
  try {
    const chat = await getChat(params.id)
    return {
      title: chat?.title?.toString().slice(0, 50) || 'Search - Impact Capitol'
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
    return {
      title: 'Search - Impact Capitol'
    }
  }
}

export default async function SearchPage({ params, searchParams }: SearchPageProps) {
  const cookieStore = cookies()
  const token = cookieStore.get('token')

  if (!token) {
    Logger.debug('[SearchPage] No token found, redirecting to login')
    redirect('/login')
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET)
    const { payload } = await jwtVerify(token.value, secret)
    const userId = payload.sub as string

    if (!userId) {
      Logger.debug('[SearchPage] No userId in token payload, redirecting to login')
      redirect('/login')
    }

    // Check if we have a direct query from navigation service
    const isNewChatWithQuery = shouldProcessQuery(searchParams)
    const query = extractQuery(searchParams)

    // Check if the ID is valid (not "0" and reasonable length)
    if (!params.id || params.id === '0' || params.id.length < 5) {
      Logger.debug('[SearchPage] Invalid chat ID', { id: params.id });
      const newId = nanoid();
      return createNewChat(newId, query);
    }

    // For new chats with query, we don't need to fetch existing chat data
    if (isNewChatWithQuery) {
      Logger.debug('[SearchPage] Processing new chat with query', { 
        chatId: params.id,
        query
      });
      return createNewChat(params.id, query);
    }

    const chat = await getChat(params.id)

    if (!chat) {
      Logger.debug('[SearchPage] No chat found, creating a new chat', {
        requestedId: params.id
      });
      return createNewChat(params.id, query);
    }

    const chatUserId = parseInt(userId)
    const chatOwnerUserId = chat.userId ? parseInt(chat.userId.toString()) : null

    if (chatOwnerUserId && chatOwnerUserId !== chatUserId) {
      Logger.debug('[SearchPage] Chat userId mismatch', { 
        chatUserId: chatOwnerUserId, 
        requestUserId: chatUserId 
      });
      notFound()
    }

    // Dynamically import AI
    const { AI } = await import('@/app/actions')

    const initialState = {
      chatId: chat.id,
      messages: chat.messages || [],
      isNewChat: false,
      query: query || undefined
    }

    return (
      <Suspense fallback={<div>Loading...</div>}>
        <AI initialAIState={initialState}>
          <Chat id={params.id} query={query} />
        </AI>
      </Suspense>
    )
  } catch (error) {
    console.error('[SearchPage] Error:', error)
    redirect('/login')
  }
}

// Helper function to create a new chat
async function createNewChat(id: string, query?: string) {
  // Dynamically import AI
  const { AI } = await import('@/app/actions')

  const initialState = {
    chatId: id,
    messages: [],
    isNewChat: true,
    query: query || undefined
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AI initialAIState={initialState}>
        <Chat id={id} query={query} />
      </AI>
    </Suspense>
  )
}