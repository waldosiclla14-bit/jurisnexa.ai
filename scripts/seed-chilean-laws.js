#!/usr/bin/env node
const https = require('https');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://iodbouncovosdbvmguox.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvZGJvdW5jb3Zvc2Ridm1ndW94Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Njk4NzY4NSwiZXhwIjoyMTAyNTYzNjg1fQ.983hpIeySJKymq01B8iPo23Qwr9Ras8kVOsE2lEXxwc';
const LEYES_DIR = path.join(__dirname, '..', 'data', 'leyes', 'cl');

const KEY_LAWS = new Set([
  'CL-242302', 'CL-207436', 'CL-172986', 'CL-6374',
  'CL-19496', 'CL-17344', 'CL-18248', 'CL-19628',
  'CL-20285', 'CL-21486',
]);

function supabaseQuery(table, method = 'GET', body = null, params = '') {
  return new Promise((resolve, reject) => {
    const url = new URL(`${SUPABASE_URL}/rest/v1/${table}${params}`);
    const headers = {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
    };
    if (method === 'POST') headers['Prefer'] = 'return=representation';
    const req = https.request(url, { method, headers }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch { resolve(data); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  const meta = {};
  for (const line of match[1].split('\n')) {
    const m = line.match(/^(\w+):\s*"?([^"]*)"?\s*$/);
    if (m) meta[m[1]] = m[2];
  }
  return meta;
}

function extractArticles(content) {
  const articles = [];
  const lines = content.split('\n');
  let current = null;
  for (const line of lines) {
    if (line.match(/^#####\s+(Artículo|Art\.?)\s+\d+/i)) {
      if (current && current.content.trim()) articles.push(current);
      const artMatch = line.match(/(\d+)/);
      current = { article_number: parseInt(artMatch[1]), title: line.replace(/^#+\s*/, '').trim(), content: '' };
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

function getArea(title) {
  const t = (title || '').toLowerCase();
  if (t.includes('trabajo')) return 'laboral';
  if (t.includes('código civil') || t.includes('codigo civil')) return 'civil';
  if (t.includes('penal')) return 'penal';
  if (t.includes('constitución') || t.includes('constitucion')) return 'constitucional';
  if (t.includes('comercial')) return 'comercial';
  if (t.includes('tributar')) return 'tributario';
  if (t.includes('miner')) return 'minero';
  if (t.includes('ambiental') || t.includes('medio ambiente')) return 'ambiental';
  if (t.includes('familia')) return 'familia';
  if (t.includes('procesal')) return 'procesal';
  if (t.includes('transito') || t.includes('tránsito')) return 'transito';
  if (t.includes('consumidor')) return 'consumidor';
  return 'civil';
}

async function main() {
  if (!fs.existsSync(LEYES_DIR)) { console.error('Dir not found'); process.exit(1); }

  const files = fs.readdirSync(LEYES_DIR).filter(f => f.endsWith('.md'));
  console.log(`Found ${files.length} Chilean law files`);

  // Get Chile ID
  const countries = await supabaseQuery('countries', 'GET', null, '?select=id&code=eq.CHILE');
  const countryId = countries[0]?.id;
  if (!countryId) { console.error('Chile not found'); process.exit(1); }

  // Get legal areas
  const areaRows = await supabaseQuery('legal_areas', 'GET', null, '?select=id,slug');
  const areaMap = {};
  (Array.isArray(areaRows) ? areaRows : []).forEach(a => { areaMap[a.slug] = a.id; });

  // Get existing doc numbers
  const existingRows = await supabaseQuery('legal_documents', 'GET', null, `?select=document_number&country_id=eq.${countryId}`);
  const existingSet = new Set((Array.isArray(existingRows) ? existingRows : []).map(d => d.document_number));

  let docs = 0, arts = 0, skipped = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const content = fs.readFileSync(path.join(LEYES_DIR, file), 'utf-8');
    const meta = parseFrontmatter(content);
    if (!meta || !meta.identifier) { skipped++; continue; }

    if (existingSet.has(meta.identifier)) {
      skipped++;
      // Still extract articles for key laws if missing
      if (KEY_LAWS.has(meta.identifier)) {
        const docRows = await supabaseQuery('legal_documents', 'GET', null,
          `?select=id&document_number=eq.${meta.identifier}&country_id=eq.${countryId}`);
        const docRow = Array.isArray(docRows) ? docRows[0] : null;
        if (docRow) {
          const countRows = await supabaseQuery('legal_articles', 'GET', null,
            `?select=id&document_id=eq.${docRow.id}&limit=1`);
          if (Array.isArray(countRows) && countRows.length > 0) continue;
          const articles = extractArticles(content);
          for (const art of articles) {
            const chunks = chunkContent(art.content);
            for (const chunk of chunks) {
              await supabaseQuery('legal_articles', 'POST', {
                document_id: docRow.id,
                article_number: art.article_number,
                title: art.title.slice(0, 299),
                content: chunk,
                effective_date: meta.publication_date || null,
                status: 'vigente',
              });
              arts++;
            }
          }
          console.log(`  Retroactive: ${meta.identifier} → ${articles.length} articles`);
        }
      }
      continue;
    }

    const areaSlug = getArea(meta.title);
    const areaId = areaMap[areaSlug] || areaMap['civil'];

    const docRows = await supabaseQuery('legal_documents', 'POST', {
      title: (meta.title || file).slice(0, 499),
      document_number: meta.identifier,
      country_id: countryId,
      legal_area_id: areaId,
      document_type: meta.rank || 'ley',
      status: meta.status === 'in_force' ? 'VIGENTE' : 'DESCONOCIDA',
      source_url: meta.source || '',
      publication_date: meta.publication_date || null,
    });

    const docRow = Array.isArray(docRows) ? docRows[0] : docRows;
    if (!docRow || !docRow.id) { skipped++; continue; }
    docs++;
    existingSet.add(meta.identifier);

    if (KEY_LAWS.has(meta.identifier)) {
      const articles = extractArticles(content);
      console.log(`  ${meta.identifier}: ${articles.length} articles`);
      for (const art of articles) {
        const chunks = chunkContent(art.content);
        for (const chunk of chunks) {
          await supabaseQuery('legal_articles', 'POST', {
            document_id: docRow.id,
            article_number: art.article_number,
            title: art.title.slice(0, 299),
            content: chunk,
            effective_date: meta.publication_date || null,
            status: 'vigente',
          });
          arts++;
        }
      }
    }

    if ((i + 1) % 1000 === 0) console.log(`Progress: ${i + 1}/${files.length}, ${docs} docs, ${arts} arts, ${skipped} skipped`);
  }

  console.log(`\nDone! ${docs} documents, ${arts} articles, ${skipped} skipped`);
}

main().catch(console.error);
