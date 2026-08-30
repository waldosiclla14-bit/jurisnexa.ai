import fs from 'fs';
import path from 'path';

function getLeyesDataDir(): string {
  return process.env.JURISNEXA_LEYES_DATA || path.join(process.cwd(), 'data');
}

function getLeyesDir(): string {
  return path.join(getLeyesDataDir(), 'leyes', 'pe');
}

function getIndexPath(): string {
  return path.join(getLeyesDataDir(), 'leyes', 'pe-index.json');
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

export function loadPeruvianIndex(): LawIndexEntry[] {
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

export function getPeruvianFileArticles(identifier: string): { number: string; title: string; text: string }[] {
  const cached = fileCache.get(identifier);
  if (cached) return cached.articles;
  const filePath = path.join(getLeyesDir(), `${identifier}.md`);
  if (!fs.existsSync(filePath)) return [];
  const articles = extractArticles(fs.readFileSync(filePath, 'utf-8'));
  fileCache.set(identifier, { articles });
  return articles;
}

const PRIORITY_LAWS: Record<string, string> = {
  'trabajo': 'PE-DS-003-97-TR',
  'laboral': 'PE-DS-003-97-TR',
  'despido': 'PE-DS-003-97-TR',
  'jornada': 'PE-DS-003-97-TR',
  'horas': 'PE-DS-003-97-TR',
  'extra': 'PE-DS-003-97-TR',
  'sueldo': 'PE-DS-003-97-TR',
  'salario': 'PE-DS-003-97-TR',
  'indemnizacion': 'PE-DS-003-97-TR',
  'vacaciones': 'PE-DS-003-97-TR',
  'finiquito': 'PE-DS-003-97-TR',
  'constitucion': 'PE-CONST-1993',
  'constitucional': 'PE-CONST-1993',
  'derechos': 'PE-CONST-1993',
  'civil': 'PE-CC-1984',
  'terreno': 'PE-CP-1991',
  'pared': 'PE-CC-1984',
  'vecino': 'PE-CC-1984',
  'inmueble': 'PE-CP-1991',
  'propiedad': 'PE-CC-1984',
  'domicilio': 'PE-CC-1984',
  'contrato': 'PE-CC-1984',
  'reivindicatoria': 'PE-CC-1984',
  'reivindicacion': 'PE-CC-1984',
  'sucesion': 'PE-CC-1984',
  'herencia': 'PE-CC-1984',
  'divorcio': 'PE-CC-1984',
  'separacion': 'PE-CC-1984',
  'matrimonio': 'PE-CC-1984',
  'familia': 'PE-CC-1984',
  'obligaciones': 'PE-CC-1984',
  'penal': 'PE-CP-1991',
  'delito': 'PE-CP-1991',
  'usurpacion': 'PE-CP-1991',
  'despojo': 'PE-CP-1991',
  'robo': 'PE-CP-1991',
  'hurto': 'PE-CP-1991',
  'homicidio': 'PE-CP-1991',
  'consumidor': 'PE-L29571',
  'garantia': 'PE-L29571',
  'tienda': 'PE-L29571',
  'producto': 'PE-L29571',
  'defensa': 'PE-L29571',
  'procesal': 'PE-L29497',
  'proceso': 'PE-L29497',
  'juicio': 'PE-L29497',
  'alimentos': 'PE-L27337',
  'ninos': 'PE-L27337',
  'tributario': 'PE-DL-774',
  'impuesto': 'PE-DL-774',
  'renta': 'PE-DL-774',
  'arrendamiento': 'PE-DL-774',
  'alquiler': 'PE-DL-774',
  'sunat': 'PE-DL-774',
};

const PRIORITY_VALUES = new Set(Object.values(PRIORITY_LAWS));

interface PeruvianLawChunk {
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

function searchInFile(identifier: string, keywords: string[], targetArticle?: string | null): PeruvianLawChunk[] {
  const articles = getPeruvianFileArticles(identifier);
  const index = loadPeruvianIndex();
  const lawMeta = index.find(l => l.identifier === identifier);
  if (!lawMeta) return [];

  const results: PeruvianLawChunk[] = [];

  for (const article of articles) {
    const lowerText = normalize(article.title + ' ' + article.text);
    let relevance = 0;
    for (const kw of keywords) {
      if (lowerText.includes(kw)) relevance++;
    }
    if (relevance === 0) continue;
    if (PRIORITY_VALUES.has(identifier)) relevance += 5;
    const lawTitleNorm = normalize(lawMeta.title);
    if (keywords.some(kw => lawTitleNorm.includes(kw))) relevance += 3;
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

export interface PeruvianSearchResult {
  contextString: string;
  sources: { id: string; title: string; url: string | null; similarity: number }[];
}

export function searchPeruvianLawsWithSources(query: string, maxChunks = 8): PeruvianSearchResult {
  const normQuery = normalize(query);
  const keywords = normQuery
    .replace(/[¿¡!?.:,;()]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3 && !['como', 'puedo', 'hacer', 'cual', 'cuando', 'donde', 'quien', 'para', 'desde', 'hasta', 'sobre', 'otro', 'esta', 'este', 'todo', 'puede', 'debe', 'tiene', 'hay'].includes(w));

  if (keywords.length === 0) return { contextString: '', sources: [] };

  const targetArticle = extractArticleNumber(query);

  const searchedIdentifiers = new Set<string>();
  const allResults: PeruvianLawChunk[] = [];

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

  const index = loadPeruvianIndex();
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

  allResults.sort((a, b) => b.relevance - a.relevance);
  const topResults = allResults.slice(0, maxChunks);

  if (topResults.length === 0) return { contextString: '', sources: [] };

  const sources = topResults.map(chunk => ({
    id: `${chunk.identifier}:${chunk.articleNumber}`,
    title: `${chunk.title} — Art. ${chunk.articleNumber}`,
    url: chunk.source || null,
    similarity: Math.min(1, chunk.relevance / 10),
  }));

  const sections = topResults.map((chunk, i) => {
    const parts = [
      `[Fuente ${i + 1}] ${chunk.title}`,
      `Identificador: ${chunk.identifier}`,
      `Tipo: ${chunk.rankLabel}`,
      `Artículo: ${chunk.articleNumber}`,
      `Estado: Vigente`,
    ];
    if (chunk.source) parts.push(`Fuente oficial: ${chunk.source}`);
    parts.push('');
    parts.push(chunk.content);
    return parts.join('\n');
  });

  return {
    contextString: `=== DOCUMENTOS JURÍDICOS PERUANOS RECUPERADOS (Búsqueda local) ===\n\n${sections.join('\n\n---\n\n')}\n\n=== FIN DE DOCUMENTOS ===`,
    sources,
  };
}

export function searchPeruvianLaws(query: string, maxChunks = 8): string {
  return searchPeruvianLawsWithSources(query, maxChunks).contextString;
}

export type NoneVigencia = 'VIGENTE' | 'DEROGADA' | 'MODIFICADA' | 'SUSPENDIDA' | 'DESCONOCIDA';

export interface PeruvianLawVerification {
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

export function verifyPeruvianLaw(query: string): PeruvianLawVerification {
  const lowerQuery = query.toLowerCase();
  const index = loadPeruvianIndex();
  if (!index.length) {
    return { encontrada: false, verificacion: 'DESCONOCIDA', estado_raw: null, nota: 'No hay índice de leyes peruanas disponible en este despliegue.' };
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

    for (let i = 0; i + 1 < nKeywords.length; i++) {
      if (titleLower.includes(nKeywords[i] + ' ' + nKeywords[i + 1])) score += 3;
    }
    if (PRIORITY_VALUES.has(entry.identifier)) score += 5;
    score += 1 / entry.title.length;

    if (score > bestScore) {
      bestScore = score;
      law = entry;
    }
  }

  if (!law || bestScore === 0) {
    return { encontrada: false, verificacion: 'DESCONOCIDA', estado_raw: null, nota: 'No se identificó una ley peruana en la consulta. Revisa el nombre de la norma.' };
  }

  const articulo = extractArticleNumber(query);

  let fragmento: string | undefined;
  if (articulo) {
    const articles = getPeruvianFileArticles(law.identifier);
    const found = articles.find(a => normalizeArticleNumber(a.number) === normalizeArticleNumber(articulo));
    if (found) fragmento = found.text.substring(0, 1400);
    else if (articles.length > 0) {
      return {
        encontrada: true,
        verificacion: mapEstado(law.status),
        estado_raw: law.status || null,
        norma: law.title,
        tipo: law.rankLabel,
        articulo,
        url: law.source,
        nota: `La norma se identificó pero no se encontró el Art. ${articulo} en el texto disponible. Verifica el artículo en SPIJ.`,
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
    url: law.source,
    fragmento,
    nota: fragmento ? undefined : 'Se verificó la ley, pero no se indicó un número de artículo en la consulta.',
  };
}

export function findPeruvianLawByIdentifier(identifier: string): LawIndexEntry | undefined {
  return loadPeruvianIndex().find(l => l.identifier === identifier);
}

export function findPeruvianLawByTitle(query: string): LawIndexEntry | undefined {
  const index = loadPeruvianIndex();
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

export function findPeruvianArticleByIdentifier(identifier: string, articleNumber: string) {
  const num = normalizeArticleNumber(articleNumber);
  return getPeruvianFileArticles(identifier).find(a => normalizeArticleNumber(a.number) === num);
}

export { normalizeArticleNumber, normalize, extractArticleNumber };