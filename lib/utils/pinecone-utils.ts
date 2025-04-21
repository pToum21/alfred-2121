import { Pinecone } from "@pinecone-database/pinecone";
import OpenAI from 'openai';

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

const index = pinecone.Index(process.env.PINECONE_INDEX_NAME!);

export interface FREDSeries {
  id: string;
  score: number | undefined;
  title: string;
  frequency: string;
  seasonal_adjustment: string;
  units: string;
  observation_start: string;
  observation_end: string;
  last_updated: string;
  notes: string;
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function createEmbeddings(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-large",
    input: text,
  });
  return response.data[0].embedding;
}

export async function queryPineconeIndex(query: string): Promise<FREDSeries[]> {
  try {
    const queryEmbedding = await createEmbeddings(query);
    
    const queryResponse = await index.query({
      vector: queryEmbedding,
      topK: 15,
      includeMetadata: true,
    });

    return queryResponse.matches.map(match => {
      const metadata = match.metadata as Partial<FREDSeries>;
      return {
        id: match.id,
        score: match.score,
        title: metadata.title || '',
        frequency: metadata.frequency || '',
        seasonal_adjustment: metadata.seasonal_adjustment || '',
        units: metadata.units || '',
        observation_start: metadata.observation_start || '',
        observation_end: metadata.observation_end || '',
        last_updated: metadata.last_updated || '',
        notes: metadata.notes || ''
      };
    });
  } catch (error) {
    return [];
  }
}