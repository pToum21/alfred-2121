// /lib/actions/rating.ts

import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || 'https://us1-smashing-jaybird-42392.upstash.io',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || 'AaWYASQgZWMzZjQ2ZGQtMmY1NC00NTM0LTllMWItZDM3OTM5MTk4NDFhZGI4MWNhZDQzZjA2NDZiMmE3YTI5OGQyZmM5YjYyOGI=',
});
export async function rateResponse(
    messageId: string,
    rating: 'up' | 'down',
    messageContent: string,
    messageRole: 'user' | 'assistant',
    reason?: string
  ) {
    try {
      await redis.hset(`message:${messageId}`, {
        rating,
        content: messageContent,
        role: messageRole,
        reason: reason || '',
        ratingConfirmed: 'true',
      });
      console.log(`Message ${messageId} rated as ${rating}`);
    } catch (error) {
      console.error('Error rating message:', error);
      throw error;
    }
  }

export async function getResponseRatings(responseId: string) {
    try {
      const ratings = await redis.hgetall<{ up: string; down: string }>(
        `response:${responseId}`
      );
      return {
        up: ratings ? parseInt(ratings.up || '0', 10) : 0,
        down: ratings ? parseInt(ratings.down || '0', 10) : 0,
      };
    } catch (error) {
      console.error('Error getting response ratings:', error);
      throw error;
    }
  }