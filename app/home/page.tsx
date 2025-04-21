import { notFound, redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import { Suspense } from 'react'
import { Metadata } from 'next'
import { nanoid } from 'ai'
import EmptyScreen from '@/components/empty-screen'
import { Bulletin } from '@/components/bulletin'
import { submitMessage } from '@/app/actions'
import dynamic from 'next/dynamic'

// Dynamically import the AI component with no SSR to avoid build-time execution
const DynamicAI = dynamic(
  () => import('@/app/actions').then((mod) => mod.AI),
  { ssr: false }
)

export const metadata: Metadata = {
  title: 'Home - Impact Capitol'
}

export default async function HomePage() {
  const cookieStore = cookies()
  const token = cookieStore.get('token')

  if (!token) {
    console.log('[HomePage] No token found, redirecting to login')
    redirect('/login')
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET)
    const { payload } = await jwtVerify(token.value, secret)
    const userId = payload.sub as string

    if (!userId) {
      console.log('[HomePage] No userId in token payload, redirecting to login')
      redirect('/login')
    }

    // Create a temporary chat ID for the home page
    const id = nanoid()
    
    const initialState = {
      chatId: id,
      messages: [],
      isNewChat: true,
      isError: false
    }

    return (
      <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
        <DynamicAI initialAIState={initialState}>
          <div className="relative min-h-screen pb-24">
            <div className="relative z-10 container mx-auto px-4 py-2">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-3">
                  <EmptyScreen submitServerAction={submitMessage} />
                </div>
                <div className="hidden lg:block lg:col-span-1 sticky top-20">
                  <Bulletin />
                </div>
              </div>
            </div>
          </div>
        </DynamicAI>
      </Suspense>
    )
  } catch (error) {
    console.error('[HomePage] Error:', error)
    redirect('/login')
  }
}