import { GoogleGenerativeAI, TaskType } from '@google/generative-ai';

let genAI: GoogleGenerativeAI | null = null;

function getGenAI(): GoogleGenerativeAI {
  if (genAI) return genAI;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY no está configurada para generar embeddings');
  }
  genAI = new GoogleGenerativeAI(apiKey);
  return genAI;
}

const EMBEDDING_MODEL = 'gemini-embedding-001';
const EMBEDDING_DIMENSIONS = 3072;

export async function generateEmbedding(text: string): Promise<number[]> {
  const ai = getGenAI();
  const model = ai.getGenerativeModel({ model: EMBEDDING_MODEL });

  const cleanText = text.replace(/\n/g, ' ').trim();

  const result = await model.embedContent(cleanText);
  return result.embedding.values;
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const ai = getGenAI();
  const model = ai.getGenerativeModel({ model: EMBEDDING_MODEL });

  const allEmbeddings: number[][] = [];

  // Process in batches of 20 (Gemini limit for batch embedding)
  const batchSize = 20;

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);

    const requests = batch.map(text => ({
      content: { role: 'user' as const, parts: [{ text: text.replace(/\n/g, ' ').trim() }] },
      taskType: TaskType.RETRIEVAL_DOCUMENT,
    }));

    const result = await model.batchEmbedContents({ requests });
    allEmbeddings.push(...result.embeddings.map(e => e.values));
  }

  return allEmbeddings;
}

export function chunkText(text: string, maxChunkSize = 1000, overlap = 200): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + maxChunkSize, text.length);
    let chunk = text.slice(start, end);

    // Try to break at sentence boundary
    if (end < text.length) {
      const lastPeriod = chunk.lastIndexOf('.');
      const lastNewline = chunk.lastIndexOf('\n');
      const breakPoint = Math.max(lastPeriod, lastNewline);

      if (breakPoint > maxChunkSize * 0.5) {
        chunk = text.slice(start, start + breakPoint + 1);
        start = start + breakPoint + 1 - overlap;
      } else {
        start = end - overlap;
      }
    } else {
      start = end;
    }

    const trimmed = chunk.trim();
    if (trimmed.length > 50) {
      chunks.push(trimmed);
    }
  }

  return chunks;
}

export function chunkLegalDocument(text: string): { section: string; content: string }[] {
  const chunks: { section: string; content: string }[] = [];

  // Try to split by articles
  const articleRegex = /(?:Artículo|Art\.?|ARTÍCULO)\s+(\d+[\w.-]*)/g;
  const parts = text.split(articleRegex);

  if (parts.length > 2) {
    // Found articles
    for (let i = 1; i < parts.length; i += 2) {
      const articleNum = parts[i];
      const content = parts[i + 1]?.trim() || '';
      if (content.length > 20) {
        chunks.push({
          section: `Artículo ${articleNum}`,
          content: `Artículo ${articleNum}:\n${content}`,
        });
      }
    }
  } else {
    // No articles found, chunk by size
    const textChunks = chunkText(text);
    textChunks.forEach((chunk, i) => {
      chunks.push({
        section: `Fragmento ${i + 1}`,
        content: chunk,
      });
    });
  }

  return chunks;
}

export function computeContentHash(text: string): string {
  // Simple hash for content deduplication
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}
