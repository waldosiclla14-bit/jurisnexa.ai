import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs';
import * as path from 'path';

const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars: Record<string, string> = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) envVars[match[1].trim()] = match[2].trim();
});

const supabase = createClient(
  envVars.SUPABASE_URL || '',
  envVars.SUPABASE_SERVICE_KEY || envVars.SUPABASE_ANON_KEY || ''
);

const genAI = new GoogleGenerativeAI(envVars.GEMINI_API_KEY || '');
const embeddingModel = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });

let requestCount = 0;

async function generateEmbedding(text: string): Promise<number[]> {
  const cleanText = text.replace(/\n/g, ' ').trim().substring(0, 2000);
  const result = await embeddingModel.embedContent(cleanText);
  requestCount++;
  return result.embedding.values;
}

function computeHash(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash) + text.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

async function main() {
  console.log('Gemini gemini-embedding-001 (3072 dim) - Generando embeddings...');

  // 1. Get existing embedded article IDs
  const { data: existingChunks } = await supabase
    .from('document_chunks')
    .select('article_id');
  const embeddedArticleIds = new Set((existingChunks || []).filter(c => c.article_id).map(c => c.article_id));
  console.log(`Artículos ya embebidos: ${embeddedArticleIds.size}`);

  // 2. Process articles: fetch in batches, join with documents for country_id
  const BATCH_SIZE = 50;
  let offset = 0;
  let totalArticles = 0;
  let totalChunks = 0;

  while (true) {
    const { data: articles, error } = await supabase
      .from('legal_articles')
      .select('id, document_id, article_number, content')
      .range(offset, offset + BATCH_SIZE - 1);

    if (error) { console.error('Error fetching articles:', error); break; }
    if (!articles || articles.length === 0) break;

    // Filter out already-embedded articles
    const newArticles = articles.filter(a => !embeddedArticleIds.has(a.id));

    // Get document info for country_id
    const docIds = [...new Set(newArticles.map(a => a.document_id))];
    const { data: docs } = await supabase
      .from('legal_documents')
      .select('id, country_id, legal_area_id')
      .in('id', docIds);

    const docMap = new Map((docs || []).map(d => [d.id, d]));

    for (const article of newArticles) {
      if (!article.content || article.content.length < 10) continue;
      const doc = docMap.get(article.document_id);
      if (!doc) continue;

      try {
        const embedding = await generateEmbedding(article.content);
        const hash = computeHash(article.content);

        await supabase.from('document_chunks').insert({
          document_id: article.document_id,
          article_id: article.id,
          country_id: doc.country_id,
          legal_area_id: doc.legal_area_id || null,
          chunk_text: article.content,
          chunk_index: 0,
          embedding,
          content_hash: hash,
        });

        totalArticles++;
        totalChunks++;
        if (totalArticles % 10 === 0) {
          console.log(`  Artículos: ${totalArticles} | Chunks: ${totalChunks} | API calls: ${requestCount}`);
        }

        // Rate limit: ~10 req/min for Gemini free tier
        await new Promise(r => setTimeout(r, 700));
      } catch (err: any) {
        console.error(`  Error art. ${article.article_number}:`, err.message || err);
        if (err.message?.includes('429') || err.message?.includes('RESOURCE_EXHAUSTED')) {
          console.log('  Rate limited, waiting 60s...');
          await new Promise(r => setTimeout(r, 60000));
        }
      }
    }

    offset += BATCH_SIZE;
    if (articles.length < BATCH_SIZE) break;
  }

  // 3. Process documents with long content (chunk them) — skip docs that already have chunks
  const { data: existingDocIds } = await supabase
    .from('document_chunks')
    .select('document_id')
    .not('document_id', 'is', null);
  const docsWithChunks = new Set((existingDocIds || []).map(c => c.document_id));

  const { data: docs } = await supabase
    .from('legal_documents')
    .select('id, title, content, country_id, legal_area_id')
    .not('content', 'is', null)
    .limit(30);

  if (docs) {
    const newDocs = docs.filter(d => !docsWithChunks.has(d.id));
    console.log(`\nProcesando ${newDocs.length} documentos con contenido largo (skipped ${docs.length - newDocs.length})...`);
    for (const doc of newDocs) {
      if (!doc.content || doc.content.length < 100) continue;

      const paragraphs = doc.content.split(/\n\s*\n/);
      const chunks: string[] = [];
      let current = '';

      for (const para of paragraphs) {
        if ((current + para).length > 800 && current.length > 50) {
          chunks.push(current.trim());
          current = para;
        } else {
          current += '\n\n' + para;
        }
      }
      if (current.trim().length > 50) chunks.push(current.trim());

      for (let i = 0; i < chunks.length; i++) {
        try {
          const embedding = await generateEmbedding(chunks[i]);
          await supabase.from('document_chunks').insert({
            document_id: doc.id,
            country_id: doc.country_id,
            legal_area_id: doc.legal_area_id || null,
            chunk_text: chunks[i],
            chunk_index: i,
            embedding,
            content_hash: computeHash(chunks[i]),
          });
          totalChunks++;
          await new Promise(r => setTimeout(r, 700));
        } catch (err: any) {
          if (err.message?.includes('429') || err.message?.includes('RESOURCE_EXHAUSTED')) {
            console.log('  Rate limited, waiting 60s...');
            await new Promise(r => setTimeout(r, 60000));
          }
        }
      }
      console.log(`  Doc: ${doc.title.substring(0, 50)} (${chunks.length} chunks)`);
    }
  }

  // 4. Final count
  const { count: finalCount } = await supabase
    .from('document_chunks')
    .select('*', { count: 'exact', head: true });

  console.log(`\n✅ Completado! Total chunks: ${finalCount || 0}`);
  console.log(`   Artículos procesados: ${totalArticles}`);
  console.log(`   API calls Gemini: ${requestCount}`);
}

main().catch(console.error);
