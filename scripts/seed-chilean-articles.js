#!/usr/bin/env node
const https = require('https');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://iodbouncovosdbvmguox.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvZGJvdW5jb3Zvc2Ridm1ndW94Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Njk4NzY4NSwiZXhwIjoyMTAyNTYzNjg1fQ.983hpIeySJKymq01B8iPo23Qwr9Ras8kVOsE2lEXxwc';
const LEYES_DIR = path.join(__dirname, '..', 'data', 'leyes', 'cl');

// Match by title substring → local file ID
const TITLE_FILE_MAP = {
  'Código del Trabajo': 'CL-207436',
  'Constitución Política de Chile': 'CL-242302',
  'Código Civil de Chile': 'CL-172986',
  'Código Penal de Chile': 'CL-17344',
  'Código de Comercio': 'CL-185829',
  'Código de Procedimiento Civil': 'CL-173362',
  'Código Orgánico de Tribunales': 'CL-208939',
  'Ley de Divorcio': 'CL-19880',
  'Ley de Arbitraje': 'CL-18695',
};

function supa(table, method, body, params = '') {
  return new Promise((resolve, reject) => {
    const url = new URL(`${SUPABASE_URL}/rest/v1/${table}${params}`);
    const headers = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' };
    if (method === 'POST') headers['Prefer'] = 'return=representation';
    const req = https.request(url, { method, headers }, res => {
      let data = ''; res.on('data', c => data += c);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch { resolve(data); } });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function extractArticles(content) {
  const articles = [];
  const lines = content.split('\n');
  let current = null;
  for (const line of lines) {
    if (line.match(/^#####\s+(Artículo|Art\.?)\s+\d+/i)) {
      if (current && current.content.trim()) articles.push(current);
      const m = line.match(/(\d+)/);
      current = { article_number: parseInt(m[1]), title: line.replace(/^#+\s*/, '').trim(), content: '' };
    } else if (current) {
      current.content += line + '\n';
    }
  }
  if (current && current.content.trim()) articles.push(current);
  return articles;
}

function chunkContent(text, maxLen = 1500) {
  const chunks = [];
  let rem = text.trim();
  while (rem.length > 0) {
    if (rem.length <= maxLen) { chunks.push(rem); break; }
    let idx = rem.lastIndexOf('\n\n', maxLen);
    if (idx < maxLen * 0.3) idx = rem.lastIndexOf('. ', maxLen);
    if (idx < maxLen * 0.3) idx = maxLen;
    chunks.push(rem.slice(0, idx).trim());
    rem = rem.slice(idx).trim();
  }
  return chunks;
}

async function main() {
  // Get Chile docs
  const allDocs = await supa('legal_documents', 'GET', null,
    '?select=id,document_number,title&country_id=eq.34a8d0e4-d995-4483-933a-90e53a530ae0');

  for (const doc of allDocs) {
    let fileId = null;
    for (const [titleKey, fid] of Object.entries(TITLE_FILE_MAP)) {
      if (doc.title && doc.title.includes(titleKey)) { fileId = fid; break; }
    }
    if (!fileId) { console.log(`Skip: ${doc.title?.slice(0,50)} (no file mapping)`); continue; }

    // Check existing articles
    const existing = await supa('legal_articles', 'GET', null,
      `?select=id&document_id=eq.${doc.id}&limit=1`);
    if (existing.length > 0) { console.log(`Skip: ${doc.document_number} (already has articles)`); continue; }

    const filePath = path.join(LEYES_DIR, `${fileId}.md`);
    if (!fs.existsSync(filePath)) { console.log(`Skip: ${fileId}.md not found`); continue; }

    const content = fs.readFileSync(filePath, 'utf-8');
    const articles = extractArticles(content);
    console.log(`  ${doc.document_number}: ${articles.length} articles to insert`);

    let inserted = 0;
    for (const art of articles) {
      const chunks = chunkContent(art.content);
      for (const chunk of chunks) {
        const result = await supa('legal_articles', 'POST', {
          document_id: doc.id,
          article_number: String(art.article_number),
          title: art.title.slice(0, 299),
          content: chunk,
          effective_date: null,
          status: 'vigente',
        });
        if (result && result.id) inserted++;
        else if (result && result.code) console.error('Insert err:', result.message?.slice(0,120));
      }
    }
    console.log(`  → Inserted ${inserted} article chunks`);
  }

  // Final count
  const total = await supa('legal_articles', 'GET', null, '?select=id');
  console.log(`\nTotal articles in DB: ${total.length}`);
}

main().catch(console.error);
