import { retrieveSchema } from '@/lib/schema/retrieve'
import { ToolProps } from '.'
import { Card } from '@/components/ui/card'
import { RetrieveSkeleton } from '@/components/retrieve-skeleton'
import { SearchResults as SearchResultsType, WebSearchResult, PineconeSearchResult } from '@/lib/types'
import RetrieveSection from '@/components/retrieve-section'

// Helper function to ensure a minimum analysis time for better UX
const calculateAnalysisTime = (startTime: number, minTime: number = 0.5): number => {
  const actualTime = (performance.now() - startTime) / 1000;
  return Math.max(actualTime, minTime);
};

export const retrieveTool = ({ uiStream, fullResponse }: ToolProps) => ({
  description: 'Retrieve content from the web',
  parameters: retrieveSchema,
  execute: async ({ url }: { url: string }) => {
    let hasError = false
    const startTime = performance.now()
    uiStream.append(<RetrieveSkeleton url={url} />)

    // Initialize with empty results to ensure we always return a valid object
    let results: SearchResultsType = {
      webResults: [],
      pineconeResults: [],
      query: url,
      images: [],
      status: 'complete'
    }

    try {
      // Use Exa AI contents API instead of Jina
      console.log('Retrieving content from Exa API for:', url)
      
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second client-side timeout
      
      const response = await fetch('https://api.exa.ai/contents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.EXA_API_KEY}`
        },
        signal: controller.signal,
        body: JSON.stringify({
          urls: [url],
          text: true,               // Get full text content
          summary: false,           // Don't need summary
          highlights: false,        // Don't need highlights
          livecrawl: 'fallback',    // Use livecrawl as fallback when cache is empty
          livecrawlTimeout: 10000   // 10 seconds timeout for live crawling (maximum allowed by Exa)
        })
      }).finally(() => {
        clearTimeout(timeoutId);
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Exa API error: ${response.status}`, errorText);
        
        // Create a user-friendly error message based on the error type
        let userFriendlyError = "Sorry, we couldn't retrieve the content from this website.";
        
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.tag === "NO_CONTENT_FOUND") {
            userFriendlyError = "Sorry, we couldn't access the content from this website. It may be protected or require a subscription.";
          } else if (errorJson.tag === "INVALID_REQUEST_BODY") {
            userFriendlyError = "There was an issue with the URL format. Please check that it's a valid web address.";
          } else if (errorJson.tag === "RATE_LIMITED") {
            userFriendlyError = "We've reached our limit for content retrieval. Please try again in a moment.";
          }
          // Log the actual error for debugging
          console.debug(`Original error: ${errorJson.error}`);
        } catch (e) {
          // If error parsing fails, use default message
          console.debug(`Error parsing error response: ${e}`);
        }
        
        throw new Error(userFriendlyError);
      }

      const json = await response.json();
      console.log('Exa API response received:', {
        requestId: json.requestId,
        resultsCount: json.results?.length
      });

      if (!json.results || json.results.length === 0) {
        hasError = true
        results.status = 'error'
        results.error = `Failed to retrieve content from "${url}". No content returned.`
      } else {
        const result = json.results[0];
        
        // Check if we have actual text content
        if (!result.text || result.text.trim() === '') {
          console.log('Empty content received for:', url);
          throw new Error(`Sorry, we couldn't find any readable text content on this page.`);
        }
        
        // Use the complete text without truncation
        const content = result.text;
        
        // For the snippet, just use the first ~200 chars of content for display purposes
        const snippet = content.substring(0, 200) + (content.length > 200 ? '...' : '');
        
        const webResult: WebSearchResult = {
          name: result.title || url,
          url: result.url || url,
          snippet: snippet,              // Only used for display in the UI, not truncating full content
          fullContent: content,          // Store the complete content without truncation
          source: 'google',              // Keep for compatibility
          datePublished: result.publishedDate || new Date().toISOString()
        }

        results = {
          webResults: [webResult],
          pineconeResults: [],
          query: url,
          images: [],
          status: 'complete'
        }
        
        // Log successful response processing
        console.log('Processed Exa results:', {
          title: webResult.name,
          contentLength: content.length,
          url: webResult.url
        });
      }
    } catch (error) {
      hasError = true
      
      // Handle abortion errors specially
      const errorMessage = error instanceof DOMException && error.name === 'AbortError'
        ? `Sorry, it's taking too long to retrieve content from this website. Please try again later.`
        : `${error}`;
      
      console.error('Retrieve API error:', error)
      
      // Don't add raw error to fullResponse, keep the assistant response clean
      fullResponse += `\nWe encountered an issue retrieving content from "${url}".`
      results.status = 'error'
      results.error = errorMessage // Use our friendly error message
      
      const analysisTime = calculateAnalysisTime(startTime);
      console.log(`Retrieve error analysis time: ${analysisTime}s`)
      uiStream.update(
        <RetrieveSection data={results} analysisTime={analysisTime} />
      )
      return results
    }

    if (hasError) {
      fullResponse += `\nWe couldn't retrieve the content you requested.`
      const analysisTime = calculateAnalysisTime(startTime);
      console.log(`Retrieve error analysis time: ${analysisTime}s`)
      uiStream.update(
        <RetrieveSection data={results} analysisTime={analysisTime} />
      )
      return results
    }

    if (results.webResults.length > 0) {
      const analysisTime = calculateAnalysisTime(startTime);
      console.log(`Retrieve success analysis time: ${analysisTime}s`)
      
      // Ensure that webResults[0] exists and has a fullContent property before logging
      const firstResult = results.webResults[0];
      if (firstResult && firstResult.fullContent) {
        const previewText = firstResult.fullContent.substring(0, 500) + '...';
        console.log(`# ${firstResult.name}\n\n${previewText}\n\n[Read more](${firstResult.url})`);
      }
      
      uiStream.update(<RetrieveSection data={results} analysisTime={analysisTime} />)
    }

    return results
  }
})