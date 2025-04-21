import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})

export type ChoiceState = {
  pending: boolean;
  choice?: boolean;
  timestamp: number;
};

export async function handleChoice(chatId: string, choice: boolean) {
  const key = `economic_choice:${chatId}`;
  await redis.set(key, {
    pending: false,
    choice,
    timestamp: Date.now()
  }, { ex: 300 }); // Expire after 5 minutes
}

export async function waitForChoice(chatId: string, timeoutMs = 30000): Promise<boolean> {
  const key = `economic_choice:${chatId}`;
  const startTime = Date.now();

  // Set initial state
  await redis.set(key, {
    pending: true,
    timestamp: startTime
  }, { ex: 300 }); // Expire after 5 minutes

  // Poll for the choice
  while (Date.now() - startTime < timeoutMs) {
    const state = await redis.get<ChoiceState>(key);
    if (state && !state.pending) {
      return state.choice || false;
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Timeout - default to false
  return false;
} 