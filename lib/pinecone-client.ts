import { Pinecone } from "@pinecone-database/pinecone";
import util from 'util';

let pinecone: Pinecone | null = null;

export async function getPineconeClient() {
  console.log('getPineconeClient: Attempting to get Pinecone client...');
  if (!pinecone) {
    console.log('getPineconeClient: Pinecone client not initialized. Creating new client...');
    try {
      pinecone = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY!,
      });
      console.log('getPineconeClient: Pinecone client successfully created.');
    } catch (error) {
      console.error('getPineconeClient: Error creating Pinecone client:', error);
      throw error;
    }
  } else {
    console.log('getPineconeClient: Returning existing Pinecone client.');
  }
  return pinecone;
}

export async function getIndex() {
  console.log('getIndex: Getting Pinecone index...');
  const pinecone = await getPineconeClient();
  try {
    const index = pinecone.Index(process.env.PINECONE_INDEX_NAME!);
    console.log(`getIndex: Successfully got index: ${process.env.PINECONE_INDEX_NAME}`);
    return index;
  } catch (error) {
    console.error(`getIndex: Error getting index ${process.env.PINECONE_INDEX_NAME}:`, error);
    throw error;
  }
}

export async function getSearchIndex() {
  console.log('getSearchIndex: Getting Pinecone search index...');
  const pinecone = await getPineconeClient();
  try {
    const index = pinecone.Index(process.env.PINECONE_SEARCH_INDEX_NAME!);
    console.log(`getSearchIndex: Successfully got search index: ${process.env.PINECONE_SEARCH_INDEX_NAME}`);
    return index;
  } catch (error) {
    console.error(`getSearchIndex: Error getting search index ${process.env.PINECONE_SEARCH_INDEX_NAME}:`, error);
    throw error;
  }
}

export async function ensureNamespace(userId: string) {
  console.log(`ensureNamespace: Ensuring namespace for user ${userId}...`);
  try {
    const index = await getIndex();
    const stats = await index.describeIndexStats();
    console.log(`ensureNamespace: Index stats:`, util.inspect(stats, { depth: null, colors: true }));
    console.log(`ensureNamespace: Namespace for user ${userId} is ready. It will be created automatically when data is first inserted.`);
  } catch (error) {
    console.error(`ensureNamespace: Error ensuring namespace for user ${userId}:`, error);
    throw error;
  }
}

export async function upsertVector(
  userId: string,
  vector: number[],
  metadata: any,
  type: string,
  id: string
) {
  console.log(`upsertVector: Upserting vector for user ${userId} with id ${id}...`);
  try {
    const index = await getIndex();
    await index.namespace(userId).upsert([{
      id: id,
      values: vector,
      metadata: { ...metadata, userId: userId, type }
    }]);
    console.log(`upsertVector: Successfully upserted vector ${id} for user ${userId} in namespace ${userId}.`);
    console.log(`upsertVector: Metadata:`, util.inspect(metadata, { depth: null, colors: true }));
  } catch (error) {
    console.error(`upsertVector: Error upserting vector for user ${userId}:`, error);
    throw error;
  }
}

export async function queryVector(userId: string, vector: number[], topK: number) {
  console.log(`queryVector: Querying vector for user ${userId}...`);
  try {
    const index = await getIndex();
    const queryResponse = await index.namespace(userId).query({
      vector,
      topK,
      includeMetadata: true
    });
    console.log(`queryVector: Query response for user ${userId}:`, util.inspect(queryResponse, { depth: null, colors: true }));
    return queryResponse;
  } catch (error) {
    console.error(`queryVector: Error querying vector for user ${userId}:`, error);
    throw error;
  }
}

export async function queryUserVectors(
  userId: string, 
  vector: number[], 
  topK: number, 
  filter: object, 
  type: 'chat' | 'work' | 'search'
) {
  console.log(`queryUserVectors: Querying vectors for user ${userId} with type ${type}`);
  console.log(`queryUserVectors: Filter:`, util.inspect(filter, { depth: null, colors: true }));
  try {
    const index = await getIndex();
    const fullFilter = { ...filter, type };
    console.log(`queryUserVectors: Full filter:`, util.inspect(fullFilter, { depth: null, colors: true }));
    const queryResponse = await index.namespace(userId).query({
      vector,
      topK,
      filter: fullFilter,
      includeMetadata: true,
    });
    console.log(`queryUserVectors: Successfully queried vectors for user: ${userId} in namespace ${userId}`);
    console.log('queryUserVectors: Query response:', util.inspect(queryResponse, { depth: null, colors: true }));
    console.log('queryUserVectors: Returned vectors:');
    if (queryResponse.matches && queryResponse.matches.length > 0) {
      queryResponse.matches.forEach((match, index) => {
        console.log(`  Vector ${index + 1}:`);
        console.log(`    ID: ${match.id}`);
        console.log(`    Score: ${match.score}`);
        console.log(`    Metadata: ${util.inspect(match.metadata, { depth: null, colors: true })}`);
      });
    } else {
      console.log('  No matches found.');
    }
    return queryResponse.matches;
  } catch (error) {
    console.error(`queryUserVectors: Error querying vectors for user ${userId}:`, error);
    throw error;
  }
}

export async function deleteNamespaceData(userId: string) {
  console.log(`deleteNamespaceData: Deleting all vectors for user ${userId}...`);
  try {
    const index = await getIndex();
    await index.namespace(userId).deleteAll();
    console.log(`deleteNamespaceData: Successfully deleted all vectors for user ${userId}.`);
  } catch (error) {
    console.error(`deleteNamespaceData: Error deleting vectors for user ${userId}:`, error);
    throw error;
  }
}

export async function querySearchVectors(
  vector: number[], 
  topK: number, 
  filter: object
) {
  console.log(`querySearchVectors: Querying search vectors`);
  console.log(`querySearchVectors: Input filter:`, JSON.stringify(filter, null, 2));
  console.log(`querySearchVectors: Top K:`, topK);
  console.log(`querySearchVectors: Vector (first 5 elements):`, vector.slice(0, 5));

  try {
    const index = await getSearchIndex();
    console.log(`querySearchVectors: Using search index: ${process.env.PINECONE_SEARCH_INDEX_NAME}`);

    const queryRequest = {
      vector,
      topK,
      filter,
      includeMetadata: true,
    };
    console.log(`querySearchVectors: Full query request:`, JSON.stringify(queryRequest, null, 2));

    const queryResponse = await index.query(queryRequest);

    console.log(`querySearchVectors: Query response:`, JSON.stringify(queryResponse, null, 2));
    console.log(`querySearchVectors: Number of matches:`, queryResponse.matches ? queryResponse.matches.length : 0);

    if (queryResponse.matches && queryResponse.matches.length > 0) {
      queryResponse.matches.forEach((match, index) => {
        console.log(`  Match ${index + 1}:`);
        console.log(`    ID: ${match.id}`);
        console.log(`    Score: ${match.score}`);
        console.log(`    Metadata:`, JSON.stringify(match.metadata, null, 2));
      });
    } else {
      console.log('  No matches found.');
    }

    return queryResponse.matches || [];
  } catch (error) {
    console.error(`querySearchVectors: Error querying vectors:`, error);
    throw error;
  }
}