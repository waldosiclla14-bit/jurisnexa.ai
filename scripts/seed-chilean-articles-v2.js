#!/usr/bin/env node
const https = require('https');
const fs = require('fs');
const path = require('path');

const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvZGJvdW5jb3Zvc2Ridm1ndW94Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Njk4NzY4NSwiZXhwIjoyMTAyNTYzNjg1fQ.983hpIeySJKymq01B8iPo23Qwr9Ras8kVOsE2lEXxwc';
const BASE = 'https://iodbouncovosdbvmguox.supabase.co/rest/v1';
const LEYES = path.join(__dirname, '..', 'data', 'leyes', 'cl');

function supa(table, method, body, params = '') {
  return new Promise((resolve, reject) => {
    const url = new URL(`${BASE}/${table}${params}`);
    const headers = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };
    if (method === 'POST') headers['Prefer'] = 'return=minimal';
    const req = https.request(url, { method, headers }, res => {
      let data = ''; res.on('data', c => data += c);
      res.on('end', () => resolve(res.statusCode));
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
  const targets = [
    { title: 'Constitución', file: 'CL-242302.md' },
    { title: 'Código Civil', file: 'CL-172986.md' },
  ];

  for (const t of targets) {
    const filePath = path.join(LEYES, t.file);
    if (!fs.existsSync(filePath)) { console.log(`Not found: ${t.file}`); continue; }

    const docs = await new Promise((resolve) => {
      const url = new URL(`${BASE}/legal_documents?select=id,title&title=like.*${encodeURIComponent(t.title)}*&country_id=eq.34a8d0e4-d995-4483-933a-90e53a530ae0&limit=1`);
      https.get(url, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } }, res => {
        let d = ''; res.on('data', c => d += c);
        res.on('end', () => { try { resolve(JSON.parse(d)); } catch { resolve([]); } });
      }).on('error', () => resolve([]));
    });

    const doc = Array.isArray(docs) ? docs[0] : null;
    if (!doc) { console.log(`Doc not found: ${t.title}`); continue; }

    // Check existing count
    const existing = await new Promise((resolve) => {
      const url = new URL(`${BASE}/legal_articles?select=id&document_id=eq.${doc.id}`);
      https.get(url, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } }, res => {
        let d = ''; res.on('data', c => d += c);
        res.on('end', () => { try { resolve(JSON.parse(d)); } catch { resolve([]); } });
      }).on('error', () => resolve([]));
    });

    if (existing.length >= 100) {
      console.log(`${t.title}: already has ${existing.length} articles, skipping`);
      continue;
    }

    console.log(`${t.title}: ${existing.length} existing, seeding...`);

    const content = fs.readFileSync(filePath, 'utf-8');
    const articles = extractArticles(content);
    console.log(`  ${articles.length} articles in file`);

    let inserted = 0;
    let errCount = 0;
    for (let i = 0; i < articles.length; i++) {
      const art = articles[i];
      const chunks = chunk(art.content);
      for (const ch of chunks) {
        const status = await supa('legal_articles', 'POST', {
          document_id: doc.id,
          article_number: String(art.n),
          title: art.title.slice(0, 299),
          content: ch,
          effective_date: null,
          status: 'vigente',
        });
        if (status >= 200 && status < 300) inserted++;
        else errCount++;
      }
      if ((i + 1) % 50 === 0) console.log(`  ${i + 1}/${articles.length} → ${inserted} ins`);
      if ((i + 1) % 20 === 0) await sleep(100);
    }
    console.log(`  Done: ${inserted} inserted, ${errCount} errors`);
  }

  // Final count
  const countRes = await new Promise((resolve) => {
    const url = new URL(`${BASE}/legal_articles?select=id`);
    https.get(url, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } }, res => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch { resolve([]); } });
    }).on('error', () => resolve([]));
  });
  console.log(`\nTotal articles in DB: ${countRes.length}`);
}

main().catch(console.error);
