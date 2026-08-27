import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';

const LEYES_DIR = path.join(process.cwd(), 'data', 'leyes', 'cl');
const INDEX_PATH = path.join(process.cwd(), 'data', 'leyes-index.json');

interface LawMeta {
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

let indexCache: LawMeta[] | null = null;

function loadIndex(): LawMeta[] {
  if (indexCache) return indexCache;
  if (!fs.existsSync(INDEX_PATH)) return [];
  indexCache = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf-8'));
  return indexCache!;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const identifier = decodeURIComponent(id);

  // Find in index
  const index = loadIndex();
  const law = index.find(l => l.identifier === identifier);
  if (!law) {
    return Response.json({ error: 'Ley no encontrada' }, { status: 404 });
  }

  // Read full file
  const filePath = path.join(LEYES_DIR, `${identifier}.md`);
  if (!fs.existsSync(filePath)) {
    return Response.json({ error: 'Archivo no encontrado' }, { status: 404 });
  }

  const fullContent = fs.readFileSync(filePath, 'utf-8');

  // Extract just the articles section (after frontmatter)
  const contentMatch = fullContent.match(/^---\r?\n[\s\S]*?\r?\n---\s*\n([\s\S]*)$/);
  const markdownContent = contentMatch ? contentMatch[1] : fullContent;

  // Extract articles list for navigation
  const articleMatches = [...markdownContent.matchAll(/#####\s+(Artículo|Art\.?)\s+(\d+)/gi)];
  const articles = articleMatches.map(m => ({
    number: parseInt(m[2]),
    title: m[0].replace(/^#+\s*/, ''),
  }));

  return Response.json({
    ...law,
    content: markdownContent.slice(0, 200000), // Cap at 200KB
    totalArticles: articles.length,
    articles: articles.slice(0, 200), // First 200 for nav
  });
}
