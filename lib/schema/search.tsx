// /Users/lukeremy/alfred-ent/lib/schema/search.tsx

import { DeepPartial } from 'ai'
import { z } from 'zod'

export const searchSchema = z.object({
  query: z.string().describe('The query to search for'),
  max_results: z.number().describe('The maximum number of results to return'),
  freshness: z.string().optional()
    .describe('Date filter in format YYYY-MM-DD, YYYY-MM-DD..YYYY-MM-DD, or keywords "Day", "Week", "Month", "Year". Examples: "2024-01-30", "2024-01-01..2024-01-31", "Week"'),
  urlFilter: z.string().optional()
    .describe('Filter results to only include those from a specific domain. Examples: "wsj.com", "bloomberg.com", "reuters.com"'),
  sort: z.enum(['relevance', 'date']).optional()
    .describe('Sort order for results: "relevance" (default) or "date"')
})

export type PartialInquiry = DeepPartial<typeof searchSchema>

