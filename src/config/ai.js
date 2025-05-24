import { scrapeAndUpdateDb } from './scraper.js';
import { HuggingFaceInferenceEmbeddings } from '@langchain/community/embeddings/hf';
import { HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";
import { Index } from '@upstash/vector';

// const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY
// const HUGGING_FACE_API_KEY = import.meta.env.VITE_HUGGING_FACE_API_KEY
// const UPSTASH_VECTOR_REST_TOKEN = import.meta.env.VITE_UPSTASH_VECTOR_REST_TOKEN
// const UPSTASH_VECTOR_REST_READONLY_TOKEN = import.meta.env.VITE_UPSTASH_VECTOR_REST_READONLY_TOKEN
// const UPSTASH_VECTOR_REST_URL = import.meta.env.VITE_UPSTASH_VECTOR_REST_URL
// const SYSTEM_PROMPT = import.meta.env.VITE_SYSTEM_PROMPT

const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000;
let contents = [];
contents.push(new SystemMessage({content: SYSTEM_PROMPT}))

async function queryWithRefresh(prompt) {
  // 1. Embed the user query
  const embedder = new HuggingFaceInferenceEmbeddings({
    apiKey: HUGGING_FACE_API_KEY,
    model: 'sentence-transformers/e5-base-v2',
  });

  const index = new Index({
    url: UPSTASH_VECTOR_REST_URL,
    token: UPSTASH_VECTOR_REST_TOKEN,
  });

  const vectorQuery = await embedder.embedQuery(prompt);

  // 2. Query Upstash Vector
  var results = await index.query({
    indexName: 'profile-vector-storage',
    vector: vectorQuery,
    topK: 3,
    includeMetadata: true,
  });

  const matches = results.matches || [];
  const now = Date.now();
  const isStale = matches.length === 0 || matches.some(match => {
    const ts = match.metadata?.timestamp;
    return !ts || now - new Date(ts).getTime() > TWO_WEEKS_MS;
  });

  if (isStale) {
    console.log('⚠️ Some data is stale. Refreshing vector DB...');

    // 3. Empty the vector index
    await vector.delete({
      url: UPSTASH_VECTOR_REST_URL,
      token: UPSTASH_VECTOR_REST_TOKEN,
      indexName: 'profile-vector-storage',
    });

    // 4. Refresh the DB
    await scrapeAndUpdateDb();
    results = await index.query({
      indexName: 'profile-vector-storage',
      vector: vectorQuery,
      topK: 3,
      includeMetadata: true,
    });
  }

  // 5. Use results if they are fresh
  return {
    refreshed: false,
    results: results.matches.map(m => ({
      text: m.metadata.text,
      timestamp: m.metadata.timestamp,
    })),
  };
}

export default async function runChat(prompt){
  const { results, refreshed } = await queryWithRefresh(prompt);
  const contextText = results.map(r => r.text).join("\n\n");

  const tools = [{ googleSearch: {} },];
  const config = {
      temperature: 0.9,
      tools,
      responseMimeType: 'text/plain',};

  const ai = new ChatGoogleGenerativeAI({apiKey: GEMINI_API_KEY, model: 'gemini-2.0-flash', ...config,});
  contents.push(new HumanMessage({content: `Context:\n${contextText}\n\nPrompt: ${prompt}`},))

  const response = await ai.invoke(contents);

  var fullResponse = ""
  for await (const chunk of response) {
      fullResponse += chunk.text
  }
  contents.push(new AIMessage({content: fullResponse}))
  return fullResponse;
}
