import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';

const INDEX_PATH = path.join(process.cwd(), 'data', 'leyes-index.json');
const TYPE_LABELS: Record<string, string> = {
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

let cachedLaws: LawMeta[] | null = null;

function loadLaws(): LawMeta[] {
  if (cachedLaws) return cachedLaws;
  if (!fs.existsSync(INDEX_PATH)) return [];
  const raw = fs.readFileSync(INDEX_PATH, 'utf-8');
  cachedLaws = JSON.parse(raw);
  return cachedLaws!;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') || '').toLowerCase();
  const type = searchParams.get('type') || '';
  const status = searchParams.get('status') || '';
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')));

  let laws = loadLaws();

  if (q) {
    laws = laws.filter(l =>
      l.title.toLowerCase().includes(q) ||
      l.identifier.toLowerCase().includes(q) ||
      l.department.toLowerCase().includes(q) ||
      l.official_number.toLowerCase().includes(q)
    );
  }

  if (type) {
    laws = laws.filter(l => l.rank === type);
  }

  if (status) {
    laws = laws.filter(l => l.status === status);
  }

  laws.sort((a, b) => a.title.localeCompare(b.title));

  const total = laws.length;
  const start = (page - 1) * limit;
  const paged = laws.slice(start, start + limit);

  return Response.json({
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    laws: paged,
    types: Object.entries(TYPE_LABELS).map(([value, label]) => ({ value, label })),
  });
}
