import OpenAI from 'openai';
export const dynamic = 'force-dynamic';

let openaiClient: OpenAI | null = null;

export function getOpenAIClient() {
  // Only create client on server-side
  if (typeof window !== 'undefined') {
    throw new Error('OpenAI client can only be initialized on the server side');
  }

  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    openaiClient = new OpenAI({
      apiKey,
    });
  }

  return openaiClient;
}

// Add this alias for backward compatibility
export const getOpenAIInstance = getOpenAIClient;

// Helper function to check if OpenAI is available
export function isOpenAIAvailable() {
  // Only check on server-side
  if (typeof window !== 'undefined') {
    return false;
  }
  return !!process.env.OPENAI_API_KEY;
}