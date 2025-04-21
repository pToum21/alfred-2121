import { notFound } from 'next/navigation'
import { Chat } from '@/components/chat'
import { Suspense } from 'react'
import { Metadata } from 'next'
import { getSharedChat } from '@/lib/actions/chat'

export interface SharePageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: SharePageProps): Promise<Metadata> {
  try {
    const chat = await getSharedChat(params.id)
    
    if (!chat?.sharePath) {
      return {
        title: 'Shared Search'
      }
    }

    return {
      title: chat?.title?.toString().slice(0, 50) || 'Shared Search'
    }
  } catch (error) {
    return {
      title: 'Shared Search'
    }
  }
}

export default async function SharePage({ params }: SharePageProps) {
  const chat = await getSharedChat(params.id)

  if (!chat || !chat.sharePath) {
    notFound()
  }

  // Dynamically import AI
  const { AI } = await import('@/app/actions')

  const initialState = {
    chatId: chat.id,
    messages: chat.messages || [],
    isSharePage: true
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AI initialAIState={initialState}>
        <Chat id={params.id} />
      </AI>
    </Suspense>
  )
}