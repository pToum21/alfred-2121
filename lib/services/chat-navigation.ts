import { nanoid } from 'ai';
import Logger from '@/lib/utils/logging';

/**
 * ChatNavigationService
 * 
 * Centralizes all navigation logic related to chat interactions
 * including creating new chats, handling questions, and managing redirects.
 */

/**
 * Creates a URL for a new chat with the given query
 * This can be used client-side to directly navigate to a new chat
 */
export function createNewChatUrl(query: string): string {
  // Generate a new chat ID
  const id = nanoid();
  
  // Encode the query for URL safety
  const encodedQuery = encodeURIComponent(query);
  
  // Return the URL with query parameter
  return `/search/${id}?q=${encodedQuery}&new=true`;
}

/**
 * Get URL for starting a new chat (without query)
 * Always directs to home page instead of intermediate /search page
 */
export function getNewChatUrl(): string {
  return '/home';
}

/**
 * Determines if the current page needs to process a new chat query
 * Used by the search/[id]/page.tsx to check if it should immediately process a query
 */
export function shouldProcessQuery(searchParams: { [key: string]: string | string[] | undefined }): boolean {
  const isNewChat = searchParams.new === 'true';
  const hasQuery = typeof searchParams.q === 'string' && searchParams.q.trim().length > 0;
  
  return isNewChat && hasQuery;
}

/**
 * Extracts the query from search parameters
 */
export function extractQuery(searchParams: { [key: string]: string | string[] | undefined }): string {
  if (typeof searchParams.q === 'string') {
    return searchParams.q.trim();
  }
  return '';
}

/**
 * Handles redirecting from home to a new chat with a query
 * Can be used in server components
 */
export function getRedirectUrlForQuery(query: string): string {
  Logger.debug('[ChatNavigationService] Creating redirect URL for query', { query });
  return createNewChatUrl(query);
}

/**
 * Creates the appropriate initial state for a chat
 */
export function createInitialState(chatId: string, messages: any[] = []) {
  return {
    chatId,
    messages,
    isNewChat: true,
    isError: false
  };
}

/**
 * Helper to determine if we're viewing a chat page
 * Useful for layout decisions
 * 
 * Note: We no longer consider /search as a chat page to prevent flashing
 */
export function isChatPage(pathname: string): boolean {
  return pathname.startsWith('/search/');
} 