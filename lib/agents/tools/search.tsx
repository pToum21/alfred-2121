import { createStreamableValue } from 'ai/rsc';
import { z } from 'zod';
import { SearchSection } from '@/components/search-section';
import fetch, { Response as NodeFetchResponse } from "node-fetch";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import PQueue from 'p-queue';
import { getOpenAIClient } from '@/lib/openai';
import { getSearchIndex } from '@/lib/pinecone-client';
import { WebSearchResult, PineconeSearchResult, SearchResults, GoogleSearchResponse } from '@/lib/types';

const MAX_CHARACTERS = 4000;
const SEARCH_TIMEOUT = 5000;
const CONCURRENCY_LIMIT = 10;
const GOOGLE_RESULTS_COUNT = 8;
const PINECONE_RESULTS_COUNT = 10;

const cleanText = (text: string): string => {
  return text
    .trim()
    .replace(/(\n){2,}/g, "\n")
    .replace(/\s{2,}/g, " ")
    .replace(/\t/g, "")
    .replace(/\n+(\s*\n)*/g, "\n")
    .substring(0, MAX_CHARACTERS)
    .trim();
};

// Convert YYYY-MM-DD or YYYY-MM-DD..YYYY-MM-DD to Google's dateRestrict format
function convertToGoogleDateRestrict(freshness: string): string {
  if (!freshness) return '';

  // Handle relative terms first
  switch (freshness.toLowerCase()) {
    case 'day':
      return 'd1';
    case 'week':
      return 'w1';
    case 'month':
      return 'm1';
    case 'year':
      return 'y1';
  }

  // Handle date range format (YYYY-MM-DD..YYYY-MM-DD)
  if (freshness.includes('..')) {
    const [startDate] = freshness.split('..');
    const start = new Date(startDate);
    const now = new Date();
    const diffDays = Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    // Convert to the most appropriate unit
    if (diffDays <= 7) {
      return `d${diffDays}`;
    } else if (diffDays <= 31) {
      return `w${Math.ceil(diffDays / 7)}`;
    } else if (diffDays <= 365) {
      return `m${Math.ceil(diffDays / 30)}`;
    } else {
      return `y${Math.ceil(diffDays / 365)}`;
    }
  }
  
  // Handle exact date format (YYYY-MM-DD)
  if (freshness.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const date = new Date(freshness);
    const now = new Date();
    const diffDays = Math.ceil((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    // Convert to the most appropriate unit
    if (diffDays <= 7) {
      return `d${diffDays}`;
    } else if (diffDays <= 31) {
      return `w${Math.ceil(diffDays / 7)}`;
    } else if (diffDays <= 365) {
      return `m${Math.ceil(diffDays / 30)}`;
    } else {
      return `y${Math.ceil(diffDays / 365)}`;
    }
  }
  
  return '';
}

// Convert YYYY-MM-DD to YYYYMMDD for Pinecone
function convertToPineconeDateFormat(freshness: string): number | null {
  try {
    const now = new Date();
    let resultDate: Date;

    // Handle relative terms first
    switch (freshness.toLowerCase()) {
      case 'day':
        resultDate = new Date(now);
        resultDate.setDate(now.getDate() - 1);
        break;
      case 'week':
        resultDate = new Date(now);
        resultDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        resultDate = new Date(now);
        resultDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        resultDate = new Date(now);
        resultDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        // Handle date range format (YYYY-MM-DD..YYYY-MM-DD)
        if (freshness.includes('..')) {
          const [startDate] = freshness.split('..');
          return parseInt(startDate.replace(/-/g, ''), 10);
        }
        
        // Handle exact date format (YYYY-MM-DD)
        if (freshness.match(/^\d{4}-\d{2}-\d{2}$/)) {
          return parseInt(freshness.replace(/-/g, ''), 10);
        }
        
        return null;
    }
    
    // Format the date as YYYYMMDD
    const year = resultDate.getFullYear();
    const month = String(resultDate.getMonth() + 1).padStart(2, '0');
    const day = String(resultDate.getDate()).padStart(2, '0');
    return parseInt(`${year}${month}${day}`, 10);
    
  } catch (error) {
    console.error('Error converting date format:', error);
    return null;
  }
}

// Clean domain for site search
function cleanDomain(urlFilter?: string): string {
  if (!urlFilter) return '';
  return urlFilter
    .replace(/^https?:\/\//, '')  // Remove protocol
    .replace(/^www\./, '')        // Remove www
    .replace(/\/$/, '');          // Remove trailing slash
}

const searchSchema = z.object({
  query: z.string().describe('The query to search for'),
  max_results: z.preprocess(
    (val) => {
      if (typeof val === 'number') return val;
      if (typeof val === 'string') {
        const num = parseInt(val, 10);
        return isNaN(num) ? 20 : num;
      }
      return 20;
    },
    z.number().default(20)
  ).describe('The maximum number of results to return'),
  freshness: z.string().optional()
    .describe('Optional date filter (e.g., "Day", "Week", "Month", "Year", or "YYYY-MM-DD" or "YYYY-MM-DD..YYYY-MM-DD")'),
  urlFilter: z.string().optional()
    .describe('Optional URL filter to restrict results to a specific domain'),
  sort: z.enum(['relevance', 'date']).optional()
    .describe('Sort order for results')
});

export const searchTool = ({ uiStream, fullResponse }: { uiStream: any, fullResponse: string }) => ({
  description: 'Search the web for information. Returns exactly 10 Google results and 15 Pinecone results.',
  parameters: searchSchema,
  execute: async ({ query, freshness, urlFilter, sort }: { 
    query: string; 
    max_results?: number | string; 
    freshness?: string;
    urlFilter?: string;
    sort?: 'relevance' | 'date';
  }) => {
    const streamResults = createStreamableValue<string>();
    
    try {
      // Show search skeleton immediately
      uiStream.append(<SearchSection result={streamResults.value} />);
      
      // Start search
      console.log('🔎 Starting search with:', { query, freshness, urlFilter, sort });
      const index = await getSearchIndex();
      
      // Update stream with initial state
      streamResults.update(JSON.stringify({ 
        webResults: [], 
        pineconeResults: [], 
        images: [], 
        query,
        status: 'searching' 
      }));

      const searchResults = await performSearch(query, index, freshness, urlFilter, sort);

      // Complete the stream with the full results
      streamResults.done(JSON.stringify(searchResults));
      
      console.log('✅ Search completed successfully');
      
      // Return results as a tool response
      return {
        role: 'tool',
        content: searchResults
      };

    } catch (error) {
      console.error('❌ Error in search execution:', error);
      
      const emptyResults: SearchResults = { 
        webResults: [], 
        pineconeResults: [], 
        images: [], 
        query,
        error: error instanceof Error ? error.message : 'Search failed'
      };
      
      // Always complete the stream, even on error
      if (!streamResults.done) {
        streamResults.done(JSON.stringify(emptyResults));
      }
      
      // Return empty results as tool response
      return {
        role: 'tool',
        content: emptyResults
      };
    }
  }
});

async function performSearch(
  query: string, 
  index: any, 
  freshness?: string, 
  urlFilter?: string,
  sort?: 'relevance' | 'date'
): Promise<SearchResults> {
  try {
    // Run Google and Pinecone searches concurrently
    const [googleResults, pineconeResults] = await Promise.all([
      performGoogleSearch(query, GOOGLE_RESULTS_COUNT, freshness, urlFilter, sort),
      performPineconeSearch(query, PINECONE_RESULTS_COUNT, index, freshness, urlFilter)
    ]);

    return {
      webResults: googleResults,
      pineconeResults,
      images: [],
      query: query
    };
  } catch (error) {
    console.error('Error in performSearch:', error);
    return {
      webResults: [],
      pineconeResults: [],
      images: [],
      query: query
    };
  }
}

async function performGoogleSearch(
  query: string, 
  maxResults: number, 
  freshness?: string, 
  urlFilter?: string,
  sort?: 'relevance' | 'date'
): Promise<WebSearchResult[]> {
  // If urlFilter is provided, add site: operator to query
  const searchQuery = urlFilter 
    ? `site:${cleanDomain(urlFilter)} ${query}`
    : query;
  
  console.log(`\n🔎 Starting Google search for: "${searchQuery}" (sort: ${sort || 'relevance'})`);
  
  const dateRestrict = freshness ? convertToGoogleDateRestrict(freshness) : '';
  console.log(`📅 Using dateRestrict: ${dateRestrict}`);

  const params = new URLSearchParams({
    key: process.env.GOOGLE_CSE_API_KEY || '',
    cx: '1507bcd4ebda74442',
    q: searchQuery,
    num: maxResults.toString(),
  });

  // Only add dateRestrict if it's not empty
  if (dateRestrict) {
    params.append('dateRestrict', dateRestrict);
  }

  // Add sort parameter if specified
  if (sort === 'date') {
    params.append('sort', 'date');
  }

  try {
    const googleResponse = await fetch(
      "https://www.googleapis.com/customsearch/v1?" + params.toString()
    ) as unknown as NodeFetchResponse;

    if (!googleResponse.ok) {
      const errorBody = await googleResponse.text();
      console.error('❌ Google Custom Search API error response:', errorBody);
      throw new Error(`Google Custom Search API error: ${errorBody}`);
    }

    const googleJson = await googleResponse.json() as GoogleSearchResponse;

    if (!googleJson.items) {
      console.log('ℹ️ No web pages found in Google Custom Search response');
      return [];
    }

    console.log(`📥 Received ${googleJson.items.length} results from Google`);

    const filteredGoogleResults = googleJson.items
      .filter(result => result.link && !result.link.toLowerCase().includes(".pdf"))
      .slice(0, maxResults);

    console.log(`🔄 Processing ${filteredGoogleResults.length} search results...`);

    // Since we're not fetching full content anymore, we can process results more efficiently
    const googleSearchPromises = filteredGoogleResults.map((result, index) => 
      Promise.resolve().then(async () => {
        const parsedResult = await fetchGoogleResult(result);
        if (parsedResult) {
          console.log(`✅ [${index + 1}/${filteredGoogleResults.length}] Processed: ${result.title?.substring(0, 40)}...`);
        } else {
          console.log(`❌ [${index + 1}/${filteredGoogleResults.length}] Failed to process: ${result.title?.substring(0, 40)}...`);
        }
        return parsedResult;
      })
    );

    const results = await Promise.all(googleSearchPromises);
    const validResults = results.filter((result): result is WebSearchResult => result !== undefined);

    console.log(`
✨ Search complete:
📊 Total results: ${filteredGoogleResults.length}
✅ Successfully processed: ${validResults.length}
❌ Failed: ${filteredGoogleResults.length - validResults.length}
⚡ Response time: Fast (snippet-only mode)
`);
    return validResults;
  } catch (error) {
    console.error('❌ Error in performGoogleSearch:', error);
    return [];
  }
}

async function fetchGoogleResult(result: NonNullable<GoogleSearchResponse['items']>[0]): Promise<WebSearchResult | undefined> {
  if (!result.link || !result.title) {
    return undefined;
  }

  try {
    // Skip the actual content fetching and readability parsing
    // Just use the snippet provided by Google API
    console.log(`📄 Using snippet directly from Google API for: ${result.link.substring(0, 50)}...`);

    // Prepare the content from the snippet
    const snippet = result.snippet || 'No snippet available';
    
    // Get the published date from all available sources
    let datePublished = '';
    
    // Try to get date from Google's direct response fields
    if (result.pagemap?.metatags?.[0]) {
      const metatags = result.pagemap.metatags[0];
      
      // Try all possible date fields in order of preference
      datePublished = metatags['article:published_time'] || 
                     metatags['datePublished'] ||
                     metatags['publication_date'] ||
                     metatags['publish_date'] ||
                     metatags['date'] || 
                     metatags['dc.date'] ||
                     metatags['dc.date.issued'] ||
                     metatags['dc.date.created'] ||
                     metatags['article:published'] ||
                     metatags['article:created'] ||
                     metatags['created_time'] ||
                     metatags['og:published_time'] ||
                     metatags['article:modified_time'] ||
                     metatags['modified_time'] ||
                     metatags['lastmod'] ||
                     '';
    }

    // If no date in metatags, try other pagemap fields
    if (!datePublished && result.pagemap) {
      const newsArticle = result.pagemap.newsarticle?.[0];
      const article = result.pagemap.article?.[0];
      const webpage = result.pagemap.webpage?.[0];
      
      // Try all possible date fields from each type
      const newsDate = newsArticle?.datepublished || 
                      newsArticle?.publishdate || 
                      newsArticle?.datecreated || 
                      newsArticle?.datemodified;
                      
      const articleDate = article?.datepublished || 
                         article?.publishdate || 
                         article?.datecreated || 
                         article?.datemodified;
                         
      const webpageDate = webpage?.datepublished || 
                         webpage?.publishdate || 
                         webpage?.datecreated || 
                         webpage?.datemodified;
      
      datePublished = newsDate || articleDate || webpageDate || '';
    }

    // If still no date, check if there's a date in the snippet or title
    if (!datePublished) {
      // Look for common date patterns in the snippet
      const datePatterns = [
        // ISO format: 2024-01-30
        /\b\d{4}[-/]\d{1,2}[-/]\d{1,2}\b/,
        // Month DD, YYYY: January 30, 2024
        /\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2},?\s+\d{4}\b/i,
        // DD Month YYYY: 30 January 2024
        /\b\d{1,2}\s+(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{4}\b/i
      ];
      
      for (const pattern of datePatterns) {
        const match = result.snippet?.match(pattern);
        if (match) {
          const parsedDate = new Date(match[0]);
          if (!isNaN(parsedDate.getTime())) {
            datePublished = parsedDate.toISOString();
            break;
          }
        }
      }
    }

    // If still no date, use current date
    if (!datePublished) {
      datePublished = new Date().toISOString();
    }

    // Try to parse and validate the date
    try {
      const parsedDate = new Date(datePublished);
      if (isNaN(parsedDate.getTime())) {
        datePublished = new Date().toISOString();
      } else {
        // Ensure the date is not in the future
        const now = new Date();
        if (parsedDate > now) {
          datePublished = now.toISOString();
        }
      }
    } catch (e) {
      datePublished = new Date().toISOString();
    }

    return {
      name: result.title,
      url: result.link,
      snippet: result.snippet || '',
      fullContent: snippet, // Use the snippet as full content
      source: 'google',
      datePublished: datePublished,
    };
  } catch (error) {
    console.log(`💥 Error processing result: ${result.link.substring(0, 50)}... - ${error instanceof Error ? error.message : 'Unknown error'}`);
    return undefined;
  }
}

async function performPineconeSearch(query: string, topK: number, index: any, freshness?: string, urlFilter?: string): Promise<PineconeSearchResult[]> {
  console.log(`\n🔍 Starting Pinecone search for: "${query}"`);
  try {
    const embedding = await generateQueryVector(query);
    console.log('📊 Generated query vector');

    let filter: any = {};
    let baseUrl: string | undefined;
    
    // Build filter conditions array
    const conditions = [];
    
    if (freshness) {
      const dateString = convertToPineconeDateFormat(freshness);
      if (dateString) {
        conditions.push({
          publicationDate: { $gte: dateString }
        });
        console.log(`📅 Applied freshness filter: ${freshness}, dateString: ${dateString}`);
      }
    }

    // Add URL filter if provided using proper Pinecone metadata filter syntax
    if (urlFilter) {
      // For debugging, let's check what URLs actually exist in the index
      try {
        const sampleQuery = await index.query({
          vector: embedding,
          topK: 5,
          includeValues: true,
          includeMetadata: true
        });
        console.log('🔍 Sample URLs in index:', sampleQuery.matches?.map((m: { metadata?: { url?: string } }) => m.metadata?.url));
      } catch (e) {
        console.error('❌ Error fetching sample URLs:', e);
      }

      // Normalize the base domain
      baseUrl = cleanDomain(urlFilter);
      
      // For Pinecone, we'll use client-side filtering since we need partial matches
      // This is because Pinecone's metadata filtering doesn't support partial string matches
      conditions.push({
        url: { $exists: true }  // Just ensure URL field exists, we'll filter client-side
      });
      console.log(`🔗 Will apply client-side URL filtering for: ${baseUrl}`);
    }

    // Combine conditions with $and if we have multiple
    if (conditions.length > 1) {
      filter = { $and: conditions };
    } else if (conditions.length === 1) {
      filter = conditions[0];
    }

    console.log(`🔄 Querying Pinecone with filter:`, JSON.stringify(filter, null, 2));
    const pineconeQueryResponse = await index.query({
      vector: embedding,
      topK: topK * 2, // Request more results to account for deduplication
      includeValues: true,
      includeMetadata: true,
      filter: filter
    });

    console.log('📦 Raw Pinecone response:', JSON.stringify(pineconeQueryResponse, null, 2));

    if (!pineconeQueryResponse.matches) {
      console.log('ℹ️ No matches found in Pinecone');
      return [];
    }

    console.log(`📊 Found ${pineconeQueryResponse.matches.length} initial matches`);

    // Map to keep track of the highest-scoring result for each URL
    const urlMap = new Map<string, any>();
    
    // Process each match to deduplicate by URL
    pineconeQueryResponse.matches.forEach((match: any) => {
      // Skip if missing URL or matches our exclusion criteria
      if (!match.metadata?.url) {
        console.log('❌ Match missing URL:', match);
        return;
      }
      
      // Check if the URL contains our base domain (if filtering)
      const matchUrl = match.metadata.url.toLowerCase();
      if (baseUrl && !matchUrl.includes(baseUrl.toLowerCase())) {
        console.log(`❌ URL filter mismatch: ${matchUrl} vs ${baseUrl}`);
        return;
      }
      
      // Skip results from our own domain
      if (matchUrl.includes('impactcapitoldc.com')) {
        console.log(`❌ Filtered out impactcapitoldc.com URL: ${matchUrl}`);
        return;
      }
      
      // Either add the match or update if it has a higher score
      if (!urlMap.has(matchUrl) || match.score > urlMap.get(matchUrl).score) {
        urlMap.set(matchUrl, match);
      }
    });
    
    console.log(`📑 Found ${urlMap.size} unique URLs after deduplication`);

    // Convert our map to an array of results
    const results = Array.from(urlMap.values()).map((match: any) => ({
      title: match.metadata.title || 'No Title',
      url: match.metadata.url,
      date: match.metadata.publicationDate,
      fullContent: match.metadata.content,
      context: match.metadata.context,
      documentSummary: match.metadata.documentSummary,
      qualityScore: match.metadata.qualityScore,
      searchTerms: match.metadata.searchTerms,
      totalChunks: match.metadata.totalChunks,
      chunkIndex: match.metadata.chunkIndex,
      isPDF: match.metadata.isPDF,
      score: match.score,
      source: 'pinecone' as const
    }))
    .sort((a, b) => b.score - a.score) // Sort by score in descending order
    .slice(0, topK); // Limit to original topK

    console.log(`✨ Pinecone search complete. Found ${results.length} deduplicated results\n`);
    console.log('📝 First result URL:', results[0]?.url);
    return results;
  } catch (error) {
    console.error('❌ Error in Pinecone search:', error);
    // Log the full error details
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return [];
  }
}

async function generateQueryVector(query: string) {
  const openai = getOpenAIClient();
  if (!openai) {
    throw new Error('OpenAI client not available');
  }

  const embedding = await openai.embeddings.create({
    model: "text-embedding-3-large",
    input: query,
  });

  return embedding.data[0].embedding;
}