// lib/agents/tools/user-search.tsx

import { WebSearchResult } from '@/lib/types';
import axios from 'axios';

export async function userSearch({ query }: { query: string }): Promise<WebSearchResult[]> {
  console.log('userSearch function called with query:', query);
  const apiKey = process.env.NEXT_PUBLIC_BING_API_KEY;
  
  if (!apiKey) {
    console.error('BING_API_KEY is not set in the environment variables');
    throw new Error('BING_API_KEY is not set in the environment variables');
  }

  const params = new URLSearchParams({
    q: query,
    count: '20', // Request 20 results
    responseFilter: 'Webpages',
    mkt: 'en-US'
  });

  try {
    console.log('Sending request to Bing API');
    const response = await axios.get(`https://api.bing.microsoft.com/v7.0/search?${params.toString()}`, {
      headers: {
        "Ocp-Apim-Subscription-Key": apiKey,
      },
    });

    console.log('Received response from Bing API');
    const results = response.data.webPages?.value || [];
    return results.map((result: any) => ({
      title: result.name,
      url: result.url,
      snippet: result.snippet,
      datePublished: result.datePublished // Include the date
    }));
  } catch (error) {
    console.error('Error in user search:', error);
    throw error;
  }
}