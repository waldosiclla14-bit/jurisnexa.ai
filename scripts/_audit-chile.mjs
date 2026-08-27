#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envContent = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) envVars[m[1].trim()] = m[2].trim();
});

const URL_BASE = envVars.SUPABASE_URL || '';
const KEY = envVars.SUPABASE_SERVICE_KEY || envVars.SUPABASE_ANON_KEY || '';

async function supa(table, params = '') {
  const res = await fetch(`${URL_BASE}/rest/v1/${table}${params}`, {
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`${table} ${res.status}: ${await res.text()}`);
  return res.json();
}

async function supaCount(table, params = '') {
  const res = await fetch(`${URL_BASE}/rest/v1/${table}?select=id${params}`, {
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, Prefer: 'count=exact', Range: '0-0' },
  });
  const total = res.headers.get('content-range');
  return total ? total.split('/')[1] : '?';
}

const chile = await supa('countries', '?select=id&code=eq.CHILE');
const chileId = chile[0]?.id;
if (!chileId) { console.error('Chile not found'); process.exit(1); }

console.log('=== CONTEO GENERAL ===');
for (const t of ['legal_documents', 'document_chunks', 'legal_articles', 'countries', 'legal_areas']) {
  const fixed = t === 'countries' ? '' : `&country_id=eq.${chileId}`;
  const c = await supaCount(t, t === 'countries' ? '' : `&country_id=eq.${chileId}`);
  console.log(`  ${t}: ${c}`);
}

const legalAreas = await supa('legal_areas', '?select=id,slug&order=slug');
console.log(`\n=== ÁREAS LEGALES (${legalAreas.length}) ===`);
for (const a of legalAreas) console.log(`  ${a.slug}`);

console.log('\n=== CHUNKS CHILE POR ÁREA ===');
const areaIds = {};
legalAreas.forEach(a => areaIds[a.slug] = a.id);
for (const [slug, id] of Object.entries(areaIds)) {
  const c = await supaCount('document_chunks', `&country_id=eq.${chileId}&legal_area_id=eq.${id}`);
  console.log(`  ${slug}: ${c}`);
}
const nullAreas = await supaCount('document_chunks', `&country_id=eq.${chileId}&legal_area_id=is.null`);
console.log(`  (sin área): ${nullAreas}`);

console.log('\n=== DOCS CHILE POR ÁREA ===');
for (const [slug, id] of Object.entries(areaIds)) {
  const c = await supaCount('legal_documents', `&country_id=eq.${chileId}&legal_area_id=eq.${id}`);
  console.log(`  ${slug}: ${c}`);
}
const nullDocs = await supaCount('legal_documents', `&country_id=eq.${chileId}&legal_area_id=is.null`);
console.log(`  (sin área): ${nullDocs}`);

const peru = await supa('countries', '?select=id&code=eq.PERU');
console.log(`\nPeru id: ${peru[0]?.id}`);
const nPeruDocs = await supaCount('legal_documents', `&country_id=eq.${peru[0].id}`);
const nPeruChunks = await supaCount('document_chunks', `&country_id=eq.${peru[0].id}`);
console.log(`  Perú docs: ${nPeruDocs}, chunks: ${nPeruChunks}`);