#!/usr/bin/env node
const https = require('https');
const fs = require('fs');
const path = require('path');

const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvZGJvdW5jb3Zvc2Ridm1ndW94Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Njk4NzY4NSwiZXhwIjoyMTAyNTYzNjg1fQ.983hpIeySJKymq01B8iPo23Qwr9Ras8kVOsE2lEXxwc';
const BASE = 'https://iodbouncovosdbvmguox.supabase.co/rest/v1';

function supa(table, method, body, params = '') {
  return new Promise((resolve, reject) => {
    const url = new URL(`${BASE}/${table}${params}`);
    const headers = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };
    if (method === 'POST') headers['Prefer'] = 'return=minimal';
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
      current = { n: parseInt(m[1]), title: line.replace(/^#+\s*/, '').trim(), content: '' };
    } else if (current) {
      current.content += line + '\n';
    }
  }
  if (current && current.content.trim()) articles.push(current);
  return articles;
}

function chunk(text, maxLen = 1500) {
  const chunks = [];
  let rem = text.trim();
  while (rem.length > 0) {
    if (rem.length <= maxLen) { chunks.push(rem); break; }
    let idx = rem.lastIndexOf('\n\n', maxLen);
    if (idx < maxLen * 0.3) idx = maxLen;
    chunks.push(rem.slice(0, idx).trim());
    rem = rem.slice(idx).trim();
  }
  return chunks;
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  const docId = '12c034dd-0000-0000-0000-000000000000';

  // Get actual document_id for Código del Trabajo
  const docs = await supa('legal_documents', 'GET', null,
    '?select=id&title=like.*Código del Trabajo*&country_id=eq.34a8d0e4-d995-4483-933a-90e53a530ae0&limit=1');
  const docRow = Array.isArray(docs) ? docs[0] : null;
  if (!docRow) { console.error('Código del Trabajo not found'); return; }
  const realDocId = docRow.id;
  console.log('Doc ID:', realDocId);

  // Check existing count
  const existing = await supa('legal_articles', 'GET', null,
    `?select=id&document_id=eq.${realDocId}`);
  console.log('Existing articles:', existing.length);
  if (existing.length > 100) { console.log('Already has enough articles'); return; }

  const filePath = path.join(__dirname, '..', 'data', 'leyes', 'cl', 'CL-207436.md');
  const content = fs.readFileSync(filePath, 'utf-8');
  const articles = extractArticles(content);
  console.log(`Found ${articles.length} articles to insert`);

  let inserted = 0;
  let errors = 0;
  for (let i = 0; i < articles.length; i++) {
    const art = articles[i];
    const chunks = chunk(art.content);
    for (const ch of chunks) {
      const res = await supa('legal_articles', 'POST', {
        document_id: realDocId,
        article_number: String(art.n),
        title: art.title.slice(0, 299),
        content: ch,
        effective_date: null,
        status: 'vigente',
      });
      if (res && res.code) { errors++; if (errors <= 3) console.error('Err:', res.message?.slice(0,100)); }
      else inserted++;
    }
    if ((i + 1) % 50 === 0) console.log(`  ${i + 1}/${articles.length} done, ${inserted} ins, ${errors} err`);
    if ((i + 1) % 10 === 0) await sleep(200); // rate limit
  }

  console.log(`\nDone! ${inserted} inserted, ${errors} errors`);
}

main().catch(console.error);
