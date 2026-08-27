#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const LEYES_DIR = path.join(__dirname, '..', 'data', 'leyes', 'cl');
const OUTPUT = path.join(__dirname, '..', 'data', 'leyes-index.json');
const TYPE_LABELS = {
  constitucion: 'Constitución',
  ley_organica_constitucional: 'Ley Orgánica Constitucional',
  ley_quorum_calificado: 'Ley de Quórum Calificado',
  ley: 'Ley',
  decreto_con_fuerza_de_ley: 'DFL',
  decreto_ley: 'Decreto Ley',
  decreto_supremo: 'Decreto Supremo',
  decreto: 'Decreto',
  tratado: 'Tratado',
  resolucion: 'Resolución',
};

const files = fs.readdirSync(LEYES_DIR).filter(f => f.endsWith('.md'));
console.log(`Processing ${files.length} files...`);

const laws = [];

for (let i = 0; i < files.length; i++) {
  const file = files[i];
  try {
    const fd = fs.openSync(path.join(LEYES_DIR, file), 'r');
    const buf = Buffer.alloc(4096);
    fs.readSync(fd, buf, 0, 4096, 0);
    fs.closeSync(fd);
    const head = buf.toString('utf-8');

    const match = head.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!match) continue;

    const meta = {};
    for (const line of match[1].split(/\r?\n/)) {
      const m = line.match(/^(\w+):\s*"?([^"]*)"?\s*$/);
      if (m) meta[m[1]] = m[2];
    }

    if (!meta.identifier || !meta.title) continue;

    laws.push({
      identifier: meta.identifier,
      title: meta.title,
      rank: meta.rank || 'ley',
      rankLabel: TYPE_LABELS[meta.rank || 'ley'] || meta.rank || 'Otro',
      publication_date: meta.publication_date || '',
      status: meta.status || '',
      source: meta.source || '',
      department: (meta.department || '').slice(0, 120),
      official_number: meta.official_number || '',
    });
  } catch {
    // skip
  }

  if ((i + 1) % 5000 === 0) console.log(`  ${i + 1}/${files.length}`);
}

fs.writeFileSync(OUTPUT, JSON.stringify(laws));
console.log(`Done! ${laws.length} laws indexed → ${OUTPUT} (${(fs.statSync(OUTPUT).size / 1024 / 1024).toFixed(1)} MB)`);
