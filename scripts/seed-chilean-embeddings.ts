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

function computeHash(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash) + text.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

async function generateEmbedding(text: string): Promise<number[]> {
  const cleanText = text.replace(/\n/g, ' ').trim().substring(0, 2000);
  const result = await embeddingModel.embedContent(cleanText);
  requestCount++;
  return result.embedding.values;
}

function chunkText(text: string, maxLen = 1500): string[] {
  const paragraphs = text.split(/\n\s*\n/);
  const chunks: string[] = [];
  let current = '';
  for (const para of paragraphs) {
    if ((current + '\n\n' + para).length > maxLen && current.length > 50) {
      chunks.push(current.trim());
      current = para;
    } else {
      current += '\n\n' + para;
    }
  }
  if (current.trim().length > 50) chunks.push(current.trim());
  return chunks.length > 0 ? chunks : [text.substring(0, maxLen)];
}

const PRIORITY_KEYWORDS = [
  'CODIGO CIVIL', 'CODIGO PENAL', 'CODIGO DEL TRABAJO', 'CODIGO DE COMERCIO',
  'CODIGO DE PROCEDIMIENTO', 'CODIGO TRIBUTARIO', 'CODIGO SANITARIO',
  'CODIGO DEL AGUA', 'CODIGO MINERO', 'CODIGO DE AGUAS',
  'CONSTITUCION', 'LEY DE ARRENDAMIENTO', 'LEY DE QUIEBRAS',
  'LEY DE BANCOS', 'LEY GENERAL DE BANCOS', 'LEY DE IMPUESTO',
  'DFL', 'LEY ORGANICA', 'LEY DE PROCESO',
  'PROTECCION DE DATOS', 'HABEAS DATA', 'LEY DE CONSUMIDOR',
  'CODIGO DE BUENAS PRACTICAS', 'LEY DE INSOLVENCIA',
];

async function main() {
  console.log('=== Generating embeddings for Chilean priority docs ===');

  const { data: chile } = await supabase.from('countries').select('id').eq('code', 'CHILE').single();
  if (!chile) { console.error('Chile not found'); return; }

  // Get docs that already have chunks
  const { data: existingChunks } = await supabase
    .from('document_chunks')
    .select('document_id')
    .eq('country_id', chile.id);
  const docsWithChunks = new Set((existingChunks || []).map(c => c.document_id));
  console.log(`Docs with chunks: ${docsWithChunks.size}`);

  // Find priority docs without chunks
  const { data: allDocs } = await supabase
    .from('legal_documents')
    .select('id, title, summary')
    .eq('country_id', chile.id);

  const priorityDocs = (allDocs || []).filter(d => {
    if (docsWithChunks.has(d.id)) return false;
    const title = (d.title || '').toUpperCase();
    return PRIORITY_KEYWORDS.some(kw => title.includes(kw));
  });

  console.log(`Priority docs without chunks: ${priorityDocs.length}`);

  let totalChunks = 0;
  for (const doc of priorityDocs) {
    const summary = doc.summary || '';
    if (summary.length < 100) continue;

    const chunks = chunkText(summary);
    for (let i = 0; i < Math.min(chunks.length, 3); i++) {
      try {
        const embedding = await generateEmbedding(chunks[i]);
        await supabase.from('document_chunks').insert({
          document_id: doc.id,
          country_id: chile.id,
          chunk_text: chunks[i],
          chunk_index: i,
          embedding,
          content_hash: computeHash(chunks[i]),
          metadata: JSON.stringify({ source: 'legalize-cl', title: doc.title }),
        });
        totalChunks++;
        await new Promise(r => setTimeout(r, 700));
      } catch (err: any) {
        if (err.message?.includes('429') || err.message?.includes('RESOURCE_EXHAUSTED')) {
          console.log('Rate limited, waiting 60s...');
          await new Promise(r => setTimeout(r, 60000));
        } else {
          console.error(`Error: ${err.message}`);
        }
      }
    }
    if (totalChunks % 20 === 0) console.log(`Chunks: ${totalChunks} | API calls: ${requestCount}`);
  }

  console.log(`\nDone! New chunks: ${totalChunks} | Total API calls: ${requestCount}`);
}

main().catch(console.error);
