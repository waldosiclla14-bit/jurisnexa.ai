#!/usr/bin/env node
const https = require('https');
const fs = require('fs');
const path = require('path');

const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvZGJvdW5jb3Zvc2Ridm1ndW94Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Njk4NzY4NSwiZXhwIjoyMTAyNTYzNjg1fQ.983hpIeySJKymq01B8iPo23Qwr9Ras8kVOsE2lEXxwc';
const BASE = 'https://iodbouncovosdbvmguox.supabase.co/rest/v1';
const LEYES = path.join(__dirname, '..', 'data', 'leyes', 'cl');

const TARGETS = [
  { title: 'Código Civil', file: 'CL-172986.md', maxArts: 2838 },
  { title: 'Código Penal', file: 'CL-17344.md', maxArts: 500 },
];

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

async function seedLaw(title, fileId) {
  const filePath = path.join(LEYES, fileId);
  if (!fs.existsSync(filePath)) { console.log(`File not found: ${fileId}`); return; }

  const docs = await supa('legal_documents', 'GET', null,
    `?select=id&title=like.*${encodeURIComponent(title)}*&country_id=eq.34a8d0e4-d995-4483-933a-90e53a530ae0&limit=1`);
  const doc = Array.isArray(docs) ? docs[0] : null;
  if (!doc) { console.log(`Doc not found: ${title}`); return; }

  const existing = await supa('legal_articles', 'GET', null,
    `?select=id&document_id=eq.${doc.id}`);
  console.log(`${title}: ${existing.length} existing articles`);

  const content = fs.readFileSync(filePath, 'utf-8');
  const articles = extractArticles(content);
  console.log(`  Found ${articles.length} in file`);

  let inserted = 0;
  for (let i = 0; i < articles.length; i++) {
    const art = articles[i];
    const chunks = chunk(art.content);
    for (const ch of chunks) {
      const res = await supa('legal_articles', 'POST', {
        document_id: doc.id,
        article_number: String(art.n),
        title: art.title.slice(0, 299),
        content: ch,
        effective_date: null,
        status: 'vigente',
      });
      if (res && !res.code) inserted++;
    }
    if ((i + 1) % 100 === 0) console.log(`  ${i + 1}/${articles.length}, ${inserted} ins`);
    if ((i + 1) % 20 === 0) await sleep(100);
  }
  console.log(`  Done: ${inserted} inserted`);
}

async function main() {
  for (const t of TARGETS) {
    const filePath = path.join(LEYES, t.file);
    if (fs.existsSync(filePath)) {
      await seedLaw(t.title, t.file);
    } else {
      console.log(`Not found: ${t.file}`);
    }
  }

  const total = await supa('legal_articles', 'GET', null, '?select=id');
  console.log(`\nTotal articles: ${total.length}`);
}

main().catch(console.error);
