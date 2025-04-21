import { z } from 'zod'

export const queryPastChatsSchema = z.object({
  query: z.string().describe('The query to search for in past chats and search results'),
  topK: z.number().min(1).max(100).default(5).describe('The number of results to return'),
  startDate: z.string().describe('Start date in YYYYMMDD format'),
  endDate: z.string().optional().describe('End date in YYYYMMDD format (optional)'),
  type: z.enum(['chat', 'search', 'all']).default('all').describe('Type of vectors to query: chat, search, or all'),
  additionalFilters: z.record(z.any()).optional().describe('Additional metadata filters'),
})