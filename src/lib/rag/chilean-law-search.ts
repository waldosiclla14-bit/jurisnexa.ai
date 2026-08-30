import fs from 'fs';
import path from 'path';

function getLeyesDataDir(): string {
  return process.env.JURISNEXA_LEYES_DATA || path.join(process.cwd(), 'data');
}

function getLeyesDir(): string {
  return path.join(getLeyesDataDir(), 'leyes', 'cl');
}

function getIndexPath(): string {
  return path.join(getLeyesDataDir(), 'leyes-index.json');
}

export interface LawIndexEntry {
  identifier: string;
  title: string;
  rank: string;
  rankLabel: string;
  publication_date: string;
  status: string;
  source: string;
  department: string;
  official_number: string;
}

let indexCache: LawIndexEntry[] | null = null;
let indexCachePath: string = '';

export function loadIndex(): LawIndexEntry[] {
  const indexPath = getIndexPath();
  if (indexCache && indexCachePath === indexPath) return indexCache;
  if (!fs.existsSync(indexPath)) {
    indexCache = [];
    indexCachePath = indexPath;
    return indexCache;
  }
  indexCache = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
  indexCachePath = indexPath;
  return indexCache!;
}

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function normalizeArticleNumber(s: string): string {
  return normalize(s).replace(/[^a-z0-9]/g, '');
}

const fileCache = new Map<string, { articles: { number: string; title: string; text: string }[] }>();

export function getFileArticles(identifier: string): { number: string; title: string; text: string }[] {
  const cached = fileCache.get(identifier);
  if (cached) return cached.articles;
  const filePath = path.join(getLeyesDir(), `${identifier}.md`);
  if (!fs.existsSync(filePath)) return [];
  const articles = extractArticles(fs.readFileSync(filePath, 'utf-8'));
  fileCache.set(identifier, { articles });
  return articles;
}

// Key Chilean laws for priority search
// IDs verificados en el corpus data/leyes/cl (nunca inventar normas).
const PRIORITY_LAWS: Record<string, string> = {
  'trabajo': 'CL-207436',
  'laboral': 'CL-207436',
  'despido': 'CL-207436',
  'contrato': 'CL-207436',
  'jornada': 'CL-207436',
  'vacaciones': 'CL-207436',
  'finiquito': 'CL-207436',
  'indemnización': 'CL-207436',
  'horas': 'CL-207436',
  'extra': 'CL-207436',
  'salario': 'CL-207436',
  'sueldo': 'CL-207436',
  'licencia': 'CL-207436',
  'feriado': 'CL-207436',
  'constitución': 'CL-242302',
  'constitucional': 'CL-242302',
  'derechos': 'CL-242302',
  'civil': 'CL-172986',
  'herencia': 'CL-172986',
  'propiedad': 'CL-172986',
  'compraventa': 'CL-172986',
  'obligaciones': 'CL-172986',
  'familia': 'CL-225128',
  'divorcio': 'CL-225128',
  'matrimonio': 'CL-225128',
  'alimentos': 'CL-172986',
  'penal': 'CL-1984',
  'delito': 'CL-1984',
  'homicidio': 'CL-1984',
  'hurto': 'CL-1984',
  'estafa': 'CL-1984',
  'consumidor': 'CL-1160403',
  'defensa': 'CL-1160403',
  'garantía': 'CL-1160403',
  'tributario': 'CL-6374',
  'impuesto': 'CL-6374',
  'iva': 'CL-6374',
  'renta': 'CL-6368',
  'procesal': 'CL-22740',
  'proceso': 'CL-22740',
  'juicio': 'CL-22740',
  'cobro': 'CL-22740',
  'comercial': 'CL-1974',
  'sociedad': 'CL-1974',
  'empresa': 'CL-1974',
  'mercado': 'CL-1974',
  'pensiones': 'CL-7147',
  'previsional': 'CL-7147',
  'agua': 'CL-5605',
  'minero': 'CL-29668',
  'sanitario': 'CL-5595',
  'aeronáutico': 'CL-30287',
};

const PRIORITY_VALUES = new Set(Object.values(PRIORITY_LAWS));

interface ChileanLawChunk {
  identifier: string;
  title: string;
  rankLabel: string;
  source: string;
  articleNumber: string;
  articleTitle: string;
  content: string;
  relevance: number;
}

function extractArticles(content: string): { number: string; title: string; text: string }[] {
  const articles: { number: string; title: string; text: string }[] = [];
  const headerRegex = /^#{3,6}\s+(?:Artículo|Art\.?)\s+(\d{1,6})(?:\s+(BIS|TER|QUATER|QUÁTER|QUINQUIES|SEXIES|SEPTIES|OCTIES|NOVIES|DECIES|CENTIES)[ .]?)?\.?\s*\r?$/gim;
  const positions: { start: number; end: number; number: string; title: string }[] = [];

  let m: RegExpExecArray | null;
  while ((m = headerRegex.exec(content)) !== null) {
    const suffix = (m[2] || '').toLowerCase().replace(/\.$/, '');
    positions.push({
      start: m.index,
      end: m.index + m[0].length,
      number: suffix ? `${m[1]} ${suffix}` : m[1].replace(/\.$/, ''),
      title: m[0].replace(/^#+\s*/, ''),
    });
  }

  for (let i = 0; i < positions.length; i++) {
    const start = positions[i].end;
    const end = i + 1 < positions.length ? positions[i + 1].start : start + 5000;
    const text = content.substring(start, end).trim();
    if (text.length > 10) {
      articles.push({ number: positions[i].number, title: positions[i].title, text: text.substring(0, 2000) });
    }
  }

  return articles;
}

function searchInFile(identifier: string, keywords: string[], targetArticle?: string | null): ChileanLawChunk[] {
  const articles = getFileArticles(identifier);
  const index = loadIndex();
  const lawMeta = index.find(l => l.identifier === identifier);
  if (!lawMeta) return [];

  const results: ChileanLawChunk[] = [];

  for (const article of articles) {
    const lowerText = normalize(article.title + ' ' + article.text);
    let relevance = 0;
    for (const kw of keywords) {
      if (lowerText.includes(kw)) relevance++;
    }
    if (relevance === 0) continue;
    // Las leyes de prioridad mapeadas por área ganan el desempate
    if (PRIORITY_VALUES.has(identifier)) relevance += 5;
    // Si el título de la ley coincide con keywords, es una ley directamente relevante (ej. "Ley de la Renta")
    const lawTitleNorm = normalize(lawMeta.title);
    if (keywords.some(kw => lawTitleNorm.includes(kw))) relevance += 3;
    // El artículo explícitamente solicitado tiene prioridad total dentro de su ley
    if (targetArticle && normalizeArticleNumber(article.number) === normalizeArticleNumber(targetArticle)) {
      relevance += 1000;
    }
    if (relevance > 0) {
      results.push({
        identifier,
        title: lawMeta.title,
        rankLabel: lawMeta.rankLabel,
        source: lawMeta.source,
        articleNumber: article.number,
        articleTitle: article.title,
        content: article.text,
        relevance,
      });
    }
  }

  return results;
}

export interface ChileanSearchResult {
  contextString: string;
  sources: { id: string; title: string; url: string | null; similarity: number }[];
}

export function searchChileanLawsWithSources(query: string, maxChunks = 8): ChileanSearchResult {
  const normQuery = normalize(query);
  const keywords = normQuery
    .replace(/[¿¡!?.:,;()]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3 && !['como', 'puedo', 'hacer', 'cual', 'cuando', 'donde', 'quien', 'para', 'desde', 'hasta', 'sobre', 'otro', 'esta', 'este', 'todo', 'puede', 'debe', 'tiene', 'hay'].includes(w));

  if (keywords.length === 0) return { contextString: '', sources: [] };

  const targetArticle = extractArticleNumber(query);

  const searchedIdentifiers = new Set<string>();
  const allResults: ChileanLawChunk[] = [];

  // 1. Search priority laws first (con match por prefijo: "hereda" -> "herencia")
  for (const kw of keywords) {
    for (const [pattern, identifier] of Object.entries(PRIORITY_LAWS)) {
      const p = normalize(pattern);
      const matches = kw.startsWith(p) || p.startsWith(kw) || (kw.length >= 4 && p.startsWith(kw.slice(0, 4)));
      if (matches) {
        if (!searchedIdentifiers.has(identifier)) {
          searchedIdentifiers.add(identifier);
          allResults.push(...searchInFile(identifier, keywords, targetArticle));
        }
      }
    }
  }

  // 2. Search by title match in index
  const index = loadIndex();
  for (const law of index) {
    if (searchedIdentifiers.has(law.identifier)) continue;
    if (allResults.length >= maxChunks * 3) break;

    const titleLower = normalize(law.title);
    const hasMatch = keywords.some(kw => titleLower.includes(kw));
    if (hasMatch) {
      searchedIdentifiers.add(law.identifier);
      allResults.push(...searchInFile(law.identifier, keywords, targetArticle));
    }
  }

  // 3. Sort by relevance and take top results
  allResults.sort((a, b) => b.relevance - a.relevance);
  const topResults = allResults.slice(0, maxChunks);

  if (topResults.length === 0) return { contextString: '', sources: [] };

  const sources = topResults.map(chunk => ({
    id: `${chunk.identifier}:${chunk.articleNumber}`,
    title: `${chunk.title} — Art. ${chunk.articleNumber}`,
    url: `https://www.leychile.cl/Navegar?idNorma=${chunk.identifier.replace('CL-', '')}`,
    similarity: Math.min(1, chunk.relevance / 10),
  }));

  // Build context string
  const sections = topResults.map((chunk, i) => {
    const parts = [
      `[Fuente ${i + 1}] ${chunk.title}`,
      `Identificador: ${chunk.identifier}`,
      `Tipo: ${chunk.rankLabel}`,
      `Artículo: ${chunk.articleNumber}`,
      `Estado: Vigente`,
      `URL Ley Chile: https://www.leychile.cl/Navegar?idNorma=${chunk.identifier.replace('CL-', '')}`,
    ];
    if (chunk.source) parts.push(`Fuente oficial: ${chunk.source}`);
    parts.push('');
    parts.push(chunk.content);
    return parts.join('\n');
  });

  return {
    contextString: `=== DOCUMENTOS JURÍDICOS CHILENOS RECUPERADOS (Búsqueda local) ===\n\n${sections.join('\n\n---\n\n')}\n\n=== FIN DE DOCUMENTOS ===`,
    sources,
  };
}

export function searchChileanLaws(query: string, maxChunks = 8): string {
  return searchChileanLawsWithSources(query, maxChunks).contextString;
}

export type NoneVigencia =
  | 'VIGENTE'
  | 'DEROGADA'
  | 'MODIFICADA'
  | 'SUSPENDIDA'
  | 'DESCONOCIDA';

export interface ChileanLawVerification {
  encontrada: boolean;
  verificacion: NoneVigencia;
  estado_raw: string | null;
  norma?: string;
  tipo?: string;
  articulo?: string | null;
  url?: string | null;
  fragmento?: string;
  nota?: string;
}

function mapEstado(raw: string | null | undefined): NoneVigencia {
  if (!raw) return 'DESCONOCIDA';
  const r = raw.toLowerCase();
  if (r.includes('in_force') || r.includes('vigente')) return 'VIGENTE';
  if (r.includes('repealed') || r.includes('derog') || r.includes('abrog')) return 'DEROGADA';
  if (r.includes('modif')) return 'MODIFICADA';
  if (r.includes('suspend')) return 'SUSPENDIDA';
  return 'DESCONOCIDA';
}

function extractArticleNumber(query: string): string | null {
  const suffixSeg = '(?:bis|ter|quater|quáter|quinquies|sexies|septies|octies|novies|decies|centies)\\b';
  const reArt = new RegExp(`(?:art[ií]?culo\\b|art\\.?)\\s*(\\d{1,6}(?:\\s+${suffixSeg})?)\\b`, 'i');
  const m = query.match(reArt);
  if (m) return m[1].replace(/\.$/, '').toLowerCase();
  return null;
}

export function verifyChileanLaw(query: string): ChileanLawVerification {
  const lowerQuery = query.toLowerCase();
  const index = loadIndex();
  if (!index.length) {
    return { encontrada: false, verificacion: 'DESCONOCIDA', estado_raw: null, nota: 'No hay índice de leyes chilenas disponible en este despliegue.' };
  }

  const keywords = lowerQuery
    .replace(/[¿¡!?.:,;()]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3 && !['como', 'para', 'desde', 'hasta', 'sobre', 'estado', 'vigente', 'derogada', 'modificada', 'artículo', 'articulo'].includes(w));

  const nKeywords = keywords.map(normalize);
  let law: LawIndexEntry | null = null;
  let bestScore = 0;
  for (const entry of index) {
    const titleLower = normalize(entry.title);
    let score = 0;
    for (const nk of nKeywords) {
      if (titleLower.includes(nk)) score++;
    }
    if (score === 0) continue;

    // Bonus por frase contigua de dos keywords en el título (p. ej. "codigo civil")
    for (let i = 0; i + 1 < nKeywords.length; i++) {
      if (titleLower.includes(nKeywords[i] + ' ' + nKeywords[i + 1])) score += 3;
    }
    // Ley canónica / de prioridad
    if (PRIORITY_VALUES.has(entry.identifier)) score += 5;
    // Título más corto es más canónico que una norma que solo lo menciona
    score += 1 / entry.title.length;

    if (score > bestScore) {
      bestScore = score;
      law = entry;
    }
  }

  if (!law || bestScore === 0) {
    return { encontrada: false, verificacion: 'DESCONOCIDA', estado_raw: null, nota: 'No se identificó una ley chilena en la consulta. Revisa el nombre de la norma.' };
  }

  const url = `https://www.leychile.cl/Navegar?idNorma=${law.identifier.replace('CL-', '')}`;
  const articulo = extractArticleNumber(query);

  // Intentar recuperar el texto del artículo desde el archivo de la ley
  let fragmento: string | undefined;
  if (articulo) {
    const articles = getFileArticles(law.identifier);
    const found = articles.find(a => {
      return normalizeArticleNumber(a.number) === normalizeArticleNumber(articulo);
    });
    if (found) fragmento = found.text.substring(0, 1400);
    else if (articles.length > 0) {
      return {
        encontrada: true,
        verificacion: mapEstado(law.status),
        estado_raw: law.status || null,
        norma: law.title,
        tipo: law.rankLabel,
        articulo,
        url,
        nota: `La norma se identificó pero no se encontró el Art. ${articulo} en el texto disponible del ${law.title}. Verifica el artículo en Ley Chile.`,
      };
    }
  }

  return {
    encontrada: true,
    verificacion: mapEstado(law.status),
    estado_raw: law.status || null,
    norma: law.title,
    tipo: law.rankLabel,
    articulo: articulo || null,
    url,
    fragmento,
    nota: fragmento ? undefined : 'Se verificó la ley, pero no se indicó un número de artículo en la consulta.',
  };
}

export function findLawByIdentifier(identifier: string): LawIndexEntry | undefined {
  return loadIndex().find(l => l.identifier === identifier);
}

export function findLawByTitle(query: string): LawIndexEntry | undefined {
  const index = loadIndex();
  const nq = normalize(query);
  let best: LawIndexEntry | undefined;
  let bestScore = 0;
  const qWords = nq.split(/\s+/).filter(w => w.length > 2);
  for (const entry of index) {
    const title = normalize(entry.title);
    if (!title) continue;
    let score = 0;
    if (title.includes(nq)) score += 10;
    for (const w of qWords) {
      if (title.includes(w)) score++;
    }
    score += 1 / entry.title.length;
    if (score > bestScore) {
      bestScore = score;
      best = entry;
    }
  }
  return bestScore > 0 ? best : undefined;
}

export function findArticleByIdentifier(identifier: string, articleNumber: string) {
  const num = normalizeArticleNumber(articleNumber);
  return getFileArticles(identifier).find(a => normalizeArticleNumber(a.number) === num);
}

export { normalizeArticleNumber, normalize, extractArticleNumber };
