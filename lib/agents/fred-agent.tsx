// lib/agents/fred-agent.tsx

import { CoreMessage, generateId } from 'ai'
import { z } from 'zod'
import OpenAI from 'openai'
import Logger from '@/lib/utils/logging';
import { SignJWT, jwtVerify } from 'jose';
import { generateEconomicApiToken } from '@/lib/utils/auth';

// Define types for the yielded objects
type InitialStep = {
  needsEconomicData: boolean;
  data: {
    step_id: string;
    step_type: string;
    content: { 
      input: string;
      title?: string;
    };
    state: string;
  };
  apiStream?: boolean;
};

type WaitingStep = {
  needsEconomicData: boolean;
  waitingForChoice: boolean;
  data?: never;
  apiStream?: never;
};

type StreamStep = {
  needsEconomicData: boolean;
  data: any; // Using any for now since stream data structure varies
  apiStream: boolean;
};

type FredAgentStep = InitialStep | WaitingStep | StreamStep;

// Create a function to get the OpenAI client that handles build time gracefully
function getOpenAIClient() {
  // During build time, return a mock client
  if (process.env.NODE_ENV === 'production' && !process.env.OPENAI_API_KEY) {
    console.warn('OPENAI_API_KEY is not configured during build, using mock client');
    return {
      chat: {
        completions: {
          create: async () => ({
            choices: [{
              message: {
                content: 'false'
              }
            }]
          })
        }
      }
    } as unknown as OpenAI;
  }
  
  // Regular client for runtime
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
    baseURL: process.env.OPENAI_API_BASE,
  });
}

const openai = getOpenAIClient();

// Function to decode JWT token for debugging
async function decodeToken(token: string) {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch (error) {
    Logger.error('decodeToken', 'Error decoding token:', error);
    return null;
  }
}

// Function to generate a JWT token
async function generateToken() {
  // Add debug logging for environment variables
  Logger.debug('generateToken', 'Environment check:', {
    hasEconomicSecret: !!process.env.ECONOMIC_API_JWT_SECRET,
    apiUrl: process.env.NEXT_PUBLIC_API_URL,
    secretPrefix: process.env.ECONOMIC_API_JWT_SECRET?.substring(0, 10) + '...[REDACTED]'
  });

  if (!process.env.ECONOMIC_API_JWT_SECRET) {
    throw new Error('ECONOMIC_API_JWT_SECRET is not defined');
  }

  try {
    const now = Math.floor(Date.now() / 1000); // UTC timestamp in seconds
    
    const payload = {
      sub: 'test-user-123',
      exp: now + (60 * 60), // 1 hour from now
      iat: now
    };
    
    Logger.debug('generateToken', 'Token payload:', payload);
    
    // Convert JWT_SECRET to proper format for jose
    const secret = new TextEncoder().encode(process.env.ECONOMIC_API_JWT_SECRET);
    
    const jwt = await new SignJWT(payload)
      .setProtectedHeader({ typ: 'JWT', alg: 'HS256' })
      .sign(secret);
    
    return jwt;
  } catch (error) {
    Logger.error('generateToken', 'Error generating token:', error);
    throw error;
  }
}

const fredDecisionSchema = z.object({
  needsEconomicData: z.boolean(),
  dataSource: z.enum(['FRED', 'BLS']).optional(),
  series: z.string().optional(),
});

export async function* fredAgent(
  messages: CoreMessage[], 
  userId: string
): AsyncGenerator<FredAgentStep> {
  console.warn('🔍 [FRED-AGENT] Function called with userId:', userId);
  
  try {
    // Log environment variables immediately
    console.warn('🔍 [FRED-AGENT] Environment:', {
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,
      hasEconomicSecret: !!process.env.ECONOMIC_API_JWT_SECRET,
      apiUrl: process.env.NEXT_PUBLIC_API_URL,
      isVercel: !!process.env.VERCEL,
      messageCount: messages?.length
    });

    if (!messages?.length) {
      console.error('❌ [FRED-AGENT] No messages provided');
      throw new Error('No messages provided');
    }

    const lastMessage = messages[messages.length - 1];
    const userQuery = lastMessage.content as string | { text: string }[] | { content: string } | unknown;
    const queryString = typeof userQuery === 'string' 
      ? userQuery 
      : Array.isArray(userQuery) 
        ? userQuery.map(part => typeof part === 'object' && 'text' in part ? part.text : '').join(' ')
        : typeof userQuery === 'object' && userQuery !== null && 'content' in userQuery 
          ? (userQuery as { content: string }).content
          : JSON.stringify(userQuery);

    // Check if the query needs economic analysis
    try {
      const parsedQuery = JSON.parse(queryString);
      const actualQuery = parsedQuery.input || parsedQuery.related_query || queryString;
      
      // Get current date
      const currentDate = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });

      const needsEconomicDataCheck = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{
          role: "system",
          content: `Today is ${currentDate}. You are an AI that determines if a query requires data analysis from an API that has economic and state leglislative/regulatory data. Return only true or false. Return true if the query explicitly or implicitly requires economic indicators, state regulations, financial data, market analysis, or economic trends. Examples that would return true: 'What's the current inflation rate?', 'How has GDP changed over the last year?', 'Discuss the latest SEC filings for JP Morgan', 'In Georgia, what are the time frames for MLOs to complete their annual continuing education requirements?','What's happening with interest rates?'. Examples that would return false: 'What's the weather like?', 'Who won the super bowl?', 'How do I make pasta?'`
        }, {
          role: "user",
          content: actualQuery
        }],
        temperature: 0,
        max_tokens: 10
      });

      const needsEconomicData = needsEconomicDataCheck.choices[0]?.message?.content?.toLowerCase().trim() === 'true';
      
      Logger.debug('fredAgent', 'Economic data check result', { 
        query: actualQuery,
        needsEconomicData 
      });

      if (!needsEconomicData) {
        return { needsEconomicData: false };
      }

      // Generate a title for the analysis if economic data is needed
      const titleCompletion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `Today is ${currentDate}. Create a brief, professional title (3-7 words) for this economic analysis request. The title should be clear and descriptive, focusing on the main economic indicators or data being analyzed. Do not use quotes. Examples:
            Query: "What's the current inflation rate in the US?"
            Title: US Inflation Rate Analysis
            
            Query: "How has unemployment changed since COVID?"
            Title: Post-COVID Labor Market Shifts
            
            Query: "Show me housing prices in California over the past 5 years"
            Title: California Home Prices: 2020-2025`
          },
          {
            role: "user",
            content: actualQuery
          }
        ],
        temperature: 0.2,
        max_tokens: 60
      });

      const analysisTitle = titleCompletion.choices[0]?.message?.content?.trim() || 'Economic Analysis';
      Logger.debug('fredAgent', 'Generated analysis title', { analysisTitle });

      // Only proceed with economic analysis if needed
      // Always yield the initial step to trigger the choice UI
      const initialStep: InitialStep = {
        needsEconomicData: true,
        data: {
          step_id: 'initial',
          step_type: 'user_query',
          content: { 
            input: queryString,
            title: analysisTitle
          },
          state: 'complete'
        }
      };
      yield initialStep;

      // Then yield waitingForChoice and wait for the next iteration
      console.warn('🔍 [FRED-AGENT] Yielding waitingForChoice');
      const waitStep: WaitingStep = {
        needsEconomicData: true,
        waitingForChoice: true
      };
      yield waitStep;

      try {
        // Generate token and proceed with API request
        const apiToken = await generateEconomicApiToken(userId);
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://agent-api.prod.app.impactcapitoldc.com';
        
        const response = await fetch(`${apiUrl}/api/v1/analyze/stream`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream',
            'Authorization': `Bearer ${apiToken}`,
            'X-Request-ID': generateId(),
          },
          body: JSON.stringify({
            query: queryString,
            stream: true,
            userId
          })
        });

        if (!response.ok) {
          throw new Error(`API request failed: ${await response.text()}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            buffer += decoder.decode(value);
            const lines = buffer.split('\n');
            
            for (let i = 0; i < lines.length - 1; i++) {
              const line = lines[i].trim();
              if (line.startsWith('data: ')) {
                const data = JSON.parse(line.slice(6));
                if (data.type === 'complete') break;
                
                const streamStep: StreamStep = {
                  needsEconomicData: true,
                  data: data,
                  apiStream: true
                };
                yield streamStep;
              }
            }
            
            buffer = lines[lines.length - 1];
          }
        }
      } catch (error) {
        console.error('[FRED-AGENT] Error in API request:', error);
        throw error;
      }

      return { needsEconomicData: true };
    } catch (error) {
      Logger.error('fredAgent', 'Error checking economic data need', { error });
      return { needsEconomicData: false };
    }
  } catch (error) {
    console.error('❌ [FRED-AGENT] Top-level error:', error);
    return { 
      needsEconomicData: false, 
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    };
  }
}