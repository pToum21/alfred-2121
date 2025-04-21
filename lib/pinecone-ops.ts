//lib/pinecone-ops.ts

import { getIndex } from './pinecone-client';

export async function upsertToPinecone(userId: string, vectors: any[]) {
  console.log(`Upserting vectors for user: ${userId}`);
  const index = await getIndex();

  try {
    const vectorsWithMetadata = vectors.map(vector => ({
      ...vector,
      metadata: { ...vector.metadata, userId }
    }));

    await index.upsert(vectorsWithMetadata);
    console.log(`Successfully upserted vectors for user: ${userId}`);
  } catch (error) {
    console.error(`Error upserting vectors for user ${userId}:`, error);
    throw error;
  }
}

export async function queryPinecone(userId: string, vector: number[], topK: number = 5) {
  console.log(`Querying vectors for user: ${userId}`);
  const index = await getIndex();

  try {
    const queryResponse = await index.query({
      topK,
      vector,
      includeValues: true,
      includeMetadata: true,
      filter: { userId: userId }
    });
    console.log(`Successfully queried vectors for user: ${userId}`);
    return queryResponse.matches;
  } catch (error) {
    console.error(`Error querying vectors for user ${userId}:`, error);
    throw error;
  }
}

export async function describeIndexStats() {
  console.log('Describing index stats');
  const index = await getIndex();

  try {
    const stats = await index.describeIndexStats();
    console.log('Successfully retrieved index stats');
    return stats;
  } catch (error) {
    console.error('Error describing index stats:', error);
    throw error;
  }
}