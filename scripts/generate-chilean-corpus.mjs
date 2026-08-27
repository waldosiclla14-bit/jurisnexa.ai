#!/usr/bin/env node
/**
 * Genera el corpus chileno real en data/leyes/cl/ + data/leyes-index.json
 *
 * Fuentes:
 *  1. legalize-cl (solo normas sustantivas vigentes: ley, decreto_ley, DFL refundido, constitución)
 *  2. BCN Ley Chile XML (idNorma oficiales) para los códigos que faltan
 *
 * Uso:
 *  node scripts/generate-chilean-corpus.mjs
 *  env: LEGALIZE_CL_DIR (ruta del clon, default temp), OUT_DIR (default repo data)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '..');
const HOMEDIR = process.env.LEGALIZE_CL_DIR || 'C:/Users/LENOVO/AppData/Local/Temp/opencode/legalize-cl/cl';
const OUT = path.resolve(process.env.OUT_DIR || path.join(REPO, 'data', 'leyes', 'cl'));
const INDEX_OUT = path.resolve(process.env.INDEX_OUT || path.join(REPO, 'data', 'leyes-index.json'));

// idNorma y tipo de norma de los códigos vigentes que NO están en legalize-cl
// (códigos listados en leychile.cl/codigos — edición oficial Editorial Jurídica de Chile)
const CODES = [
  { idNorma: '1974',   title: 'CÓDIGO DE COMERCIO',              tipo: 'ley',   numero: 'S/N' },
  { idNorma: '1984',   title: 'CÓDIGO PENAL',                    tipo: 'ley',   numero: 'S/N' },
  { idNorma: '5595',   title: 'CÓDIGO SANITARIO',                tipo: 'decreto_con_fuerza_de_ley', numero: '725' },
  { idNorma: '5605',   title: 'CÓDIGO DE AGUAS',                 tipo: 'decreto_con_fuerza_de_ley', numero: '1122' },
  { idNorma: '12820',  title: 'CÓDIGO DE DERECHO INTERNACIONAL PRIVADO', tipo: 'ley', numero: 'S/N' },
  { idNorma: '176595', title: 'CÓDIGO PROCESAL PENAL',           tipo: 'ley',   numero: '19696' },
  { idNorma: '18914',  title: 'CÓDIGO DE JUSTICIA MILITAR',      tipo: 'ley',   numero: 'S/N' },
  { idNorma: '22740',  title: 'CÓDIGO DE PROCEDIMIENTO CIVIL',   tipo: 'ley',   numero: '1552' },
  { idNorma: '25563',  title: 'CÓDIGO ORGÁNICO DE TRIBUNALES',   tipo: 'ley',   numero: '7421' },
  { idNorma: '29668',  title: 'CÓDIGO DE MINERÍA',               tipo: 'ley',   numero: '18248' },
  { idNorma: '30287',  title: 'CÓDIGO AERONÁUTICO',              tipo: 'ley',   numero: '18916' },
  { idNorma: '6368',   title: 'LEY SOBRE IMPUESTO A LA RENTA',   tipo: 'decreto_ley', numero: '824' },
  { idNorma: '225128', title: 'LEY DE MATRIMONIO CIVIL',         tipo: 'ley',   numero: '19947' },
];

// ---------------------------------------------------------------------------
// Utils
// ---------------------------------------------------------------------------

function decodeEntities(s) {
  if (!s) return '';
  const named = { aacute:'á', eacute:'é', iacute:'í', oacute:'ó', uacute:'ú', ntilde:'ñ',
                  Aacute:'Á', Eacute:'É', Iacute:'Í', Oacute:'Ó', Uacute:'Ú', Ntilde:'Ñ',
                  agrave:'à', egrave:'è', igrave:'ì', ograve:'ò', ugrave:'ù', nbsp:' ',
                  auml:'ä', ouml:'ö', uuml:'ü', Auml:'Ä', Ouml:'Ö', Uuml:'Ü', deg:'°',
                  mdash:'—', nbspc:' ', laquo:'«', raquo:'»', amp:'&', lt:'<', gt:'>', quot:'"', apos:"'" };
  return s.replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
          .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
          .replace(/&([a-zA-Z]+);/g, (m, n) => named[n] || m);
}

function parseFrontmatter(content) {
  const t = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const meta = {};
  if (t) for (const line of t[1].split(/\r?\n/)) {
    const m = line.match(/^([a-z_]+):\s*"?([^"]*)"?\s*$/);
    if (m) meta[m[1]] = m[2];
  }
  return meta;
}

const RANK_LABELS = {
  ley: 'Ley', decreto_ley: 'Decreto Ley', decreto_con_fuerza_de_ley: 'Decreto con Fuerza de Ley',
  decreto: 'Decreto', constitucion: 'Constitución', tratado: 'Tratado Internacional',
  decreto_supremo: 'Decreto Supremo', otro: 'Otro', codigo: 'Código',
};

// ---------------------------------------------------------------------------
// XML de BCN -> markdown
// ---------------------------------------------------------------------------

// Encuentra el tag de cierre balanceado para un tag de apertura en `xml[openIndex]`.
function findClosing(xml, openIndex) {
  const m = /^<([A-Za-z][\w-]*)[\s>]/.exec(xml.slice(openIndex));
  if (!m) return null;
  const name = m[1];
  const openRe = new RegExp(`<${name}[\\s>]`, 'g');
  const closeRe = new RegExp(`</${name}>`, 'g');
  openRe.lastIndex = closeRe.lastIndex = openIndex;
  let depth = 0, o, c, nextIndex = openIndex;
  while (nextIndex < xml.length) {
    openRe.lastIndex = nextIndex;
    closeRe.lastIndex = nextIndex;
    o = openRe.exec(xml);
    c = closeRe.exec(xml);
    if (c !== null && (o === null || c.index < o.index)) { depth--; nextIndex = c.index + c[0].length; }
    else if (o !== null) { depth++; nextIndex = o.index + o[0].length; }
    else break;
    if (depth === 0) {
      const openTagEnd = xml.indexOf('>', openIndex) + 1;
      return { start: openIndex, end: nextIndex, innerStart: openTagEnd, innerEnd: nextIndex - (`</${name}>`).length };
    }
  }
  return null;
}

function stripTags(html) {
  return decodeEntities(html.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function attr(target, name, def='') {
  const m = new RegExp(`${name}="([^"]*)"`).exec(target.slice(0, target.indexOf('>')));
  return m ? m[1] : def;
}

// Quita el prefijo repetido "ARTÍCULO 1." / "ART. 49 BIS." del texto del artículo.
function cleanArticleText(text) {
  return text.replace(/^ART\.?\s*ÍCULO\s+[0-9]+\s*(BIS|TER|QU[AÁ]TER|QU[AÁ]TER\s*)?\s*\.\s*/i, '')
             .replace(/^ART\.\s*[0-9]+\s*(BIS|TER|QU[AÁ]TER|QU[AÁ]TER\s*)?\s*\.?\s*/i, '')
             .trim();
}

// Recorre recursivamente <EstructuraFuncional> para extraer títulos y artículos.
// `xmlNode` es el CONTENIDO interno (sin los tags del ancestro), así no se re-procesa el mismo nodo.
function walkStructure(xmlNode, body) {
  let idx = xmlNode.indexOf('<EstructuraFuncional');
  while (idx !== -1) {
    const range = findClosing(xmlNode, idx);
    if (!range) break;
    const openTag = xmlNode.slice(idx, xmlNode.indexOf('>', idx) + 1);
    const inner = xmlNode.slice(idx, range.innerEnd);
    const type = decodeEntities(attr(openTag, 'tipoParte', ''));

    const textM = /<Texto>([\s\S]*?)<\/Texto>/.exec(inner);
    const text = textM ? stripTags(textM[1]) : '';
    const tituloM = /<TituloParte[^>]*>([\s\S]*?)<\/TituloParte>/.exec(inner);
    const nombreM = /<NombreParte[^>]*>([\s\S]*?)<\/NombreParte>/.exec(inner);
    const titulo = tituloM ? stripTags(tituloM[1]) : '';
    const nombre = nombreM ? stripTags(nombreM[1]) : '';

    const typeLower = type.toLowerCase();
    if (typeLower.includes('título') || typeLower.includes('titulo')) {
      if ((titulo && !/^no$/i.test(titulo) && titulo !== '&#160;') || text) {
        const label = (titulo && !/^no$/i.test(titulo) && titulo !== '&#160;') ? titulo : text;
        if (label) body.push({ kind: 'title', level: 2, text: label });
      }
    } else if (typeLower.includes('libro')) {
      const label = (titulo && !/^no$/i.test(titulo)) ? titulo : text;
      if (label) body.push({ kind: 'title', level: 1, text: label });
    } else if (typeLower.includes('párrafo') || typeLower.includes('parrafo') || typeLower.includes('parágrafo')) {
      const label = (titulo && !/^no$/i.test(titulo) && titulo !== '&#160;') ? titulo : text;
      if (label) body.push({ kind: 'title', level: 3, text: label });
    } else if (typeLower.includes('artículo') || typeLower.includes('articulo')) {
      const num = (nombre && !/^no$/i.test(nombre) && nombre !== '&#160;') ? nombre : text;
      body.push({ kind: 'article', number: num, text: cleanArticleText(text) });
    } else if (text && text.length > 0) {
      body.push({ kind: 'plain', text });
    }

    walkStructure(xmlNode.slice(range.innerStart, range.innerEnd), body);
    idx = xmlNode.indexOf('<EstructuraFuncional', range.end);
  }
}

async function downloadCode(idNorma) {
  const url = `https://www.leychile.cl/Consulta/obtxml?opt=7&idNorma=${idNorma}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; JurisNexa corpus builder)' } });
  if (!res.ok) throw new Error(`HTTP ${res.status} para idNorma ${idNorma}`);
  return await res.text();
}

function xmlToMarkdown(xml, idNorma, code) {
  const body = [];
  walkStructure(xml, body);

  const title = code.title;
  const lines = [];
  lines.push('---');
  lines.push(`title: "${title}"`);
  lines.push(`identifier: "CL-${idNorma}"`);
  lines.push('country: "cl"');
  lines.push(`rank: "${code.tipo}"`);
  lines.push('publication_date: ""');
  lines.push('last_updated: ""');
  lines.push('status: "in_force"');
  lines.push(`source: "https://www.bcn.cl/leychile/navegar?idNorma=${idNorma}"`);
  lines.push('department: ""');
  lines.push('bcn_schema_version: "1.0"');
  lines.push('is_treaty: "no"');
  lines.push('promulgation_date: ""');
  lines.push(`official_type: "${code.tipo === 'ley' ? 'Código' : 'Decreto con Fuerza de Ley'}"`);
  lines.push(`official_number: "${code.numero}"`);
  lines.push('---');
  lines.push(`# ${title}`);
  lines.push(`Miniatura oficial de la Editorial Jurídica de Chile proporcionada por la Biblioteca del Congreso Nacional de Chile (Ley Chile).`);
  lines.push('');

  for (const it of body) {
    if (it.kind === 'title') {
      const level = it.level === 3 ? '###' : it.level === 1 ? '#' : '##';
      lines.push(`${level} ${it.text}`);
      lines.push('');
    } else if (it.kind === 'article') {
      if (it.number) {
        lines.push(`##### Artículo ${it.number}`);
        lines.push('');
      }
      if (it.text) { lines.push(it.text); lines.push(''); }
    } else if (it.kind === 'plain' && it.text && it.text.length > 0) {
      lines.push(it.text);
      lines.push('');
    }
  }
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Copia del corpus legalize-cl (filtrado)
// ---------------------------------------------------------------------------

const EXCLUDE_TITLE = /PLANTA(S)? (DE PERSONAL|DEL|Y)|ADECUA.*PLANTAS|ESCALAFONES|CONCESI[OÓ]N|NOMBRA A|RENOVACI[OÓ]N Y TRANSFERENCIA|PRORROGA DECLARACI[OÓ]N|EXPROPIACI[OÓ]N|BONO|REAJUSTA|DETERMINA EL COMPONENTE|CAPITAN[IÍ]A|MAR[IÍ]TIMA|AUTORIZA ERIGIR|MONUMENTO|D[IÍ]A NACIONAL|NOMBRA|SUELDO|FIJAR PLANTA|ORDENANZA LOCAL|MALLA|DELEGA EN|EXTRACTO/i;

function isSubstantive(meta, title) {
  const rank = meta.rank || '';
  if (meta.status !== 'in_force') return false;
  if (rank === 'constitucion') return true;
  if (rank === 'ley' || rank === 'decreto_ley') return !EXCLUDE_TITLE.test(title);
  if (rank === 'decreto_con_fuerza_de_ley') {
    if (EXCLUDE_TITLE.test(title)) return false;
    return /TEXTO REFUNDIDO|CODIGO|C[OÓ]DIGO/.test(title);
  }
  return false;
}

async function main() {
  console.log(`Corpus fuente: ${HOMEDIR}`);
  console.log(`Salida: ${OUT}`);
  fs.mkdirSync(OUT, { recursive: true });

  const files = fs.readdirSync(HOMEDIR).filter(f => f.endsWith('.md'));
  console.log(`Archivos en fuente: ${files.length}`);

  const index = [];
  let copied = 0, skipped = 0;
  const excludeSet = new Set(CODES.map(c => `CL-${c.idNorma}`));

  for (const f of files) {
    const id = f.replace('.md', '');
    if (excludeSet.has(id)) continue; // los códigos vienen de BCN
    const content = fs.readFileSync(path.join(HOMEDIR, f), 'utf-8');
    const meta = parseFrontmatter(content);
    const title = (meta.title || '').replace(/\r?\n/g, ' ').trim();
    if (!isSubstantive(meta, title)) { skipped++; continue; }
    fs.copyFileSync(path.join(HOMEDIR, f), path.join(OUT, f));
    copied++;
    index.push({
      identifier: id,
      title,
      rank: meta.rank || '',
      rankLabel: RANK_LABELS[meta.rank] || meta.rank,
      publication_date: meta.publication_date || '',
      status: meta.status || '',
      source: meta.source || `https://www.bcn.cl/leychile/navegar?idNorma=${id.replace('CL-', '')}`,
      department: meta.department || '',
      official_number: meta.official_number || '',
    });
  }
  console.log(`Copiadas: ${copied} · Omitidas (no sustantivas): ${skipped}`);

  // Descargar códigos
  for (const code of CODES) {
    const file = `CL-${code.idNorma}.md`;
    const outPath = path.join(OUT, file);
    const entry = {
      identifier: `CL-${code.idNorma}`,
      title: code.title,
      rank: code.tipo,
      rankLabel: RANK_LABELS[code.tipo] || code.tipo,
      publication_date: '',
      status: 'in_force',
      source: `https://www.bcn.cl/leychile/navegar?idNorma=${code.idNorma}`,
      department: 'MINISTERIO DE JUSTICIA',
      official_number: code.numero,
    };
    if (fs.existsSync(outPath)) { index.push(entry); console.log(`Código ya existe (indexado): ${file}`); continue; }
    try {
      const xml = await downloadCode(code.idNorma);
      const md = xmlToMarkdown(xml, code.idNorma, code);
      fs.writeFileSync(outPath, md, 'utf-8');
      index.push(entry);
      console.log(`Descargado: ${file} (${(md.length/1024).toFixed(0)} KB)`);
    } catch (e) {
      console.error(`ERROR descargando ${file}: ${e.message}`);
    }
  }

  // Escribir índice
  index.sort((a, b) => a.identifier.localeCompare(b.identifier, 'en', { numeric: true }));
  fs.mkdirSync(path.dirname(INDEX_OUT), { recursive: true });
  fs.writeFileSync(INDEX_OUT, JSON.stringify(index, null, 2), 'utf-8');
  console.log(`\nleyes-index.json: ${index.length} entradas (${(fs.statSync(INDEX_OUT).size/1024/1024).toFixed(2)} MB)`);
  console.log(`Total archivos en ${OUT}: ${fs.readdirSync(OUT).length}`);
  const totalSize = fs.readdirSync(OUT).reduce((a, f) => a + fs.statSync(path.join(OUT, f)).size, 0);
  console.log(`Tamaño total corpus: ${(totalSize/1048576).toFixed(1)} MB`);
}

main().catch(e => { console.error(e); process.exit(1); });

export { findClosing, walkStructure, xmlToMarkdown, cleanArticleText };