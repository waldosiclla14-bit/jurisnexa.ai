import fs from 'fs';
import path from 'path';

const LEYES_DIR = path.join(process.cwd(), 'data', 'leyes', 'cl');
const INDEX_PATH = path.join(process.cwd(), 'data', 'leyes-index.json');

interface LawIndexEntry {
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

function loadIndex(): LawIndexEntry[] {
  if (indexCache) return indexCache;
  if (!fs.existsSync(INDEX_PATH)) return [];
  indexCache = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf-8'));
  return indexCache!;
}

// Key Chilean laws for priority search
const PRIORITY_LAWS: Record<string, string> = {
  'trabajo': 'CL-207436',
  'laboral': 'CL-207436',
  'despido': 'CL-207436',
  'contrato': 'CL-207436',
  'jornada': 'CL-207436',
  'vacaciones': 'CL-207436',
  'finiquito': 'CL-207436',
  'indemnización': 'CL-207436',
  'constitución': 'CL-242302',
  'constitucional': 'CL-242302',
  'derechos': 'CL-242302',
  'civil': 'CL-172986',
  'familia': 'CL-172986',
  'divorcio': 'CL-172986',
  'alimentos': 'CL-172986',
  'herencia': 'CL-172986',
  'matrimonio': 'CL-172986',
  'propiedad': 'CL-172986',
  'compraventa': 'CL-172986',
  'obligaciones': 'CL-172986',
  'penal': 'CL-17344',
  'delito': 'CL-17344',
  'homicidio': 'CL-17344',
  'hurto': 'CL-17344',
  'estafa': 'CL-17344',
  'consumidor': 'CL-19496',
  'defensa': 'CL-19496',
  'tributario': 'CL-824',
  'impuesto': 'CL-824',
  'iva': 'CL-824',
  'renta': 'CL-824',
  'procesal': 'CL-17514',
  'proceso': 'CL-17514',
  'juicio': 'CL-17514',
  'cobro': 'CL-17514',
  'comercial': 'CL-2019',
  'sociedad': 'CL-2019',
  'empresa': 'CL-2019',
  'mercado': 'CL-2019',
};

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
  const headerRegex = /#####\s+(Artículo|Art\.?)\s+(\d+[a-z]?\.?)/gi;
  const positions: { start: number; number: string; title: string }[] = [];

  let m: RegExpExecArray | null;
  while ((m = headerRegex.exec(content)) !== null) {
    positions.push({
      start: m.index,
      number: m[2].replace(/\.$/, ''),
      title: m[0].replace(/^#+\s*/, ''),
    });
  }

  for (let i = 0; i < positions.length; i++) {
    const start = positions[i].start + positions[i].title.length;
    const end = i + 1 < positions.length ? positions[i + 1].start : start + 5000;
    const text = content.substring(start, end).trim();
    if (text.length > 10) {
      articles.push({ number: positions[i].number, title: positions[i].title, text: text.substring(0, 2000) });
    }
  }

  return articles;
}

function searchInFile(identifier: string, keywords: string[]): ChileanLawChunk[] {
  const filePath = path.join(LEYES_DIR, `${identifier}.md`);
  if (!fs.existsSync(filePath)) return [];

  const content = fs.readFileSync(filePath, 'utf-8');
  const articles = extractArticles(content);
  const index = loadIndex();
  const lawMeta = index.find(l => l.identifier === identifier);
  if (!lawMeta) return [];

  const results: ChileanLawChunk[] = [];

  for (const article of articles) {
    const lowerText = (article.title + ' ' + article.text).toLowerCase();
    let relevance = 0;
    for (const kw of keywords) {
      if (lowerText.includes(kw)) relevance++;
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
  sources: { title: string; url: string | null; similarity: number }[];
}

export function searchChileanLawsWithSources(query: string, maxChunks = 8): ChileanSearchResult {
  const lowerQuery = query.toLowerCase();
  const keywords = lowerQuery
    .replace(/[¿¡!?.:,;()]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3 && !['como', 'puedo', 'hacer', 'cual', 'cuando', 'donde', 'quien', 'para', 'desde', 'hasta', 'sobre', 'otro', 'esta', 'este', 'todo', 'puede', 'debe', 'tiene', 'hay'].includes(w));

  if (keywords.length === 0) return { contextString: '', sources: [] };

  const searchedIdentifiers = new Set<string>();
  const allResults: ChileanLawChunk[] = [];

  // 1. Search priority laws first
  for (const kw of keywords) {
    for (const [pattern, identifier] of Object.entries(PRIORITY_LAWS)) {
      if (kw.includes(pattern) || pattern.includes(kw)) {
        if (!searchedIdentifiers.has(identifier)) {
          searchedIdentifiers.add(identifier);
          allResults.push(...searchInFile(identifier, keywords));
        }
      }
    }
  }

  // 2. Search by title match in index
  const index = loadIndex();
  for (const law of index) {
    if (searchedIdentifiers.has(law.identifier)) continue;
    if (allResults.length >= maxChunks * 3) break;

    const titleLower = law.title.toLowerCase();
    const hasMatch = keywords.some(kw => titleLower.includes(kw));
    if (hasMatch) {
      searchedIdentifiers.add(law.identifier);
      allResults.push(...searchInFile(law.identifier, keywords));
    }
  }

  // 3. Sort by relevance and take top results
  allResults.sort((a, b) => b.relevance - a.relevance);
  const topResults = allResults.slice(0, maxChunks);

  if (topResults.length === 0) return { contextString: '', sources: [] };

  const sources = topResults.map(chunk => ({
    title: `${chunk.title} — Art. ${chunk.articleNumber}`,
    url: `https://www.leychile.cl/Navegar?idNorma=${chunk.identifier.replace('CL-', '')}`,
    similarity: chunk.relevance / 10,
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
