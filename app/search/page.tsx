import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import { createNewChatUrl, getNewChatUrl } from '@/lib/services/chat-navigation'
import Logger from '@/lib/utils/logging'

export const metadata = {
  title: 'Search - Impact Capitol'
}

export const maxDuration = 300;

/**
 * SearchPage - This page now only handles redirections
 * - With a query: Redirects to a new chat with the query
 * - Without a query: Redirects to home page
 * This simplifies the architecture and prevents intermediate page flashes
 */
export default async function SearchPage({
  searchParams
}: {
  searchParams: { q?: string }
}) {
  // Check authentication
  const cookieStore = cookies()
  const token = cookieStore.get('token')

  if (!token) {
    Logger.debug('[SearchPage] No token found, redirecting to login')
    redirect('/login')
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET)
    await jwtVerify(token.value, secret)
  } catch (error) {
    Logger.debug('[SearchPage] Invalid token, redirecting to login')
    redirect('/login')
  }

  // Get query parameter
  const query = searchParams.q ? searchParams.q.trim() : ''
  
  // With query: Create a new chat with the query, skip intermediate renders
  if (query) {
    Logger.debug('[SearchPage] Redirecting directly to new chat with query', { query })
    return redirect(createNewChatUrl(query))
  }
  
  // Without query: Go to home page
  Logger.debug('[SearchPage] No query provided, redirecting to home')
  return redirect(getNewChatUrl())
}