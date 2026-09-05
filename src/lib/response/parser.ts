import { LegalResponseData, LawReference, LawSource, Section, EvidenceItem, RiskItem, WarningItem, ConfidenceData, SectionStatus } from './types';

const HEADING_RE = /^#{1,4}\s+(.*)$/;

type SectionKey = 'conclusion' | 'analysis' | 'norms' | 'risks' | 'actions' | 'deadlines' | 'sources' | 'jurisprudence' | 'doctrine' | 'legalIssue' | 'unclassified';

const HEADER_KEYWORDS: Array<{ key: SectionKey; patterns: RegExp[] }> = [
  { key: 'conclusion', patterns: [/resum/i, /conclusi/i, /qu[eé] entend/i] },
  { key: 'analysis', patterns: [/an[aá]lisis/i, /análisis/i] },
  { key: 'norms', patterns: [/norma/i, /legislaci[oó]n/i, /leyes/i] },
  { key: 'risks', patterns: [/riesgo/i] },
  { key: 'actions', patterns: [/posibles acciones/i, /qu[eé] hacer/i, /pr[oó]ximos pasos/i] },
  { key: 'deadlines', patterns: [/plazo/i] },
  { key: 'sources', patterns: [/fuente/i, /jurisprudencia/i] },
  { key: 'jurisprudence', patterns: [/jurisprudenc/i] },
  { key: 'doctrine', patterns: [/doctrina/i] },
  { key: 'legalIssue', patterns: [/problema jur[ií]dico/i, /problema/i] },
];

function classifyHeader(headerText: string): SectionKey {
  for (const { key, patterns } of HEADER_KEYWORDS) {
    if (patterns.some((p) => p.test(headerText))) return key;
  }
  return 'unclassified';
}

interface RawBlock {
  key: SectionKey;
  headerLine: string | null;
  body: string;
}

function splitIntoBlocks(markdown: string): RawBlock[] {
  const cleaned = markdown.replace(/^\s*---\s*$/gm, '');
  const lines = cleaned.split('\n');
  const blocks: RawBlock[] = [];
  let currentKey: SectionKey = 'conclusion';
  let currentHeader: string | null = null;
  let buffer: string[] = [];

  const flush = () => {
    const body = buffer.join('\n').trim();
    if (body.length > 0) blocks.push({ key: currentKey, headerLine: currentHeader, body });
    buffer = [];
  };

  for (const line of lines) {
    const headerMatch = line.match(HEADING_RE);
    if (headerMatch) {
      flush();
      currentHeader = headerMatch[1].trim();
      currentKey = classifyHeader(currentHeader);
      continue;
    }
    buffer.push(line);
  }
  flush();
  return blocks;
}

function extractListItems(body: string): string[] {
  const lines = body.split('\n').map((l) => l.trim()).filter(Boolean);
  const items: string[] = [];
  let current = '';
  for (const line of lines) {
    const isBullet = /^[-*]\s+/.test(line) || /^\d+\.\s+/.test(line);
    if (isBullet) {
      if (current) items.push(current.trim());
      current = line.replace(/^[-*]\s+/, '').replace(/^\d+\.\s+/, '');
    } else if (current) {
      current += ' ' + line;
    } else {
      items.push(line);
    }
  }
  if (current) items.push(current.trim());
  return items.map((i) => i.replace(/\*\*/g, '').trim()).filter(Boolean);
}

function extractLawReferences(body: string): LawReference[] {
  return extractListItems(body).map((raw) => {
    const articleMatch = raw.match(/art[íi]culo\s+(\d+)/i);
    const jurisdiction: 'CL' | 'PE' | undefined = /chile/i.test(raw) ? 'CL' : /per[uú]/i.test(raw) ? 'PE' : undefined;
    const codeMatch = raw.match(/([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑa-záéíóúñ]+)*)\s*[-–—]/);
    return { raw, code: codeMatch?.[1]?.trim(), article: articleMatch?.[1], jurisdiction };
  });
}

function extractSources(body: string): LawSource[] {
  return extractListItems(body).map((raw) => {
    const urlMatch = raw.match(/https?:\/\/\S+/);
    const articleMatch = raw.match(/art[íi]culo\s+(\d+)/i);
    const jurisdiction: 'CL' | 'PE' | undefined = /chile/i.test(raw) ? 'CL' : /per[uú]/i.test(raw) ? 'PE' : undefined;
    let status: LawSource['status'] = 'PENDIENTE';
    if (urlMatch) status = 'VERIFICADA';
    else if (/no encontrad/i.test(raw)) status = 'NO_ENCONTRADA';
    const title = raw.split(urlMatch?.[0] ?? '###NOPE###')[0].trim();
    return { raw, title: title || raw, article: articleMatch?.[1], jurisdiction, url: urlMatch?.[0], status };
  });
}

function emptySection<T>(): Section<T> {
  return { items: [], status: 'empty' };
}

export function parseMarkdownToStructure(markdown: string, isStreaming: boolean): LegalResponseData {
  const blocks = splitIntoBlocks(markdown);
  const result: LegalResponseData = {
    conclusion: { text: '', status: 'empty' },
    summary: null,
    legalIssue: emptySection<string>(),
    norms: emptySection<LawSource>(),
    jurisprudence: emptySection<string>(),
    doctrine: emptySection<string>(),
    analysis: emptySection<string>(),
    rights: emptySection<string>(),
    obligations: emptySection<string>(),
    evidence: emptySection<EvidenceItem>(),
    deadlines: emptySection<string>(),
    arguments: emptySection<{ favorable: string[]; against: string[]; response?: string }>(),
    risks: emptySection<RiskItem>(),
    actions: emptySection<string>(),
    nextSteps: emptySection<string>(),
    sources: emptySection<LawSource>(),
    confidence: emptySection<ConfidenceData>(),
    warnings: emptySection<WarningItem>(),
    disclaimer: emptySection<string>(),
    rawSections: {},
  };

  for (const chunk of blocks) {
    const rawHeading = chunk.headerLine || '__body__';
    result.rawSections[rawHeading] = chunk.body.split('\n');
  }

  for (let idx = 0; idx < blocks.length; idx++) {
    const block = blocks[idx];
    const isLastBlock = idx === blocks.length - 1;
    const status: SectionStatus = isStreaming && isLastBlock ? 'streaming' : 'complete';

    switch (block.key) {
      case 'conclusion':
        result.conclusion = { text: block.body.replace(/\*\*/g, '').substring(0, 500), status };
        break;
      case 'analysis':
        result.analysis = { items: extractListItems(block.body), status };
        break;
      case 'norms': {
        const laws = extractLawReferences(block.body).map(l => ({ raw: l.raw, title: l.raw, article: l.article, jurisdiction: l.jurisdiction, status: 'PENDIENTE' as const }));
        result.norms = { items: laws, status };
        if (result.sources.items.length === 0) result.sources = { items: laws, status };
        break;
      }
      case 'risks':
        result.risks = { items: extractRiskItems(block.body), status };
        break;
      case 'actions':
        result.actions = { items: extractListItems(block.body), status };
        if (result.nextSteps.items.length === 0) result.nextSteps = { items: extractListItems(block.body), status };
        break;
      case 'deadlines':
        result.deadlines = { items: extractListItems(block.body), status };
        break;
      case 'sources':
        result.sources = { items: extractSources(block.body), status };
        break;
      case 'jurisprudence':
        result.jurisprudence = { items: extractListItems(block.body), status };
        break;
      case 'doctrine':
        result.doctrine = { items: extractListItems(block.body), status };
        break;
      case 'legalIssue':
        result.legalIssue = { items: extractListItems(block.body).map(l => l.replace(/^[*#]+\s*/, '')), status };
        break;
      case 'unclassified':
        if (block.headerLine === null) {
          result.conclusion = { text: block.body.replace(/\*\*/g, '').substring(0, 500), status };
        } else {
          result.analysis = { items: extractListItems(block.body), status };
        }
        break;
    }
  }

  if (result.sources.items.length > 0 && result.norms.items.length === 0) {
    result.norms = result.sources;
  }

  return result;
}

function extractRiskItems(body: string): RiskItem[] {
  const items: RiskItem[] = [];
  const levelMap: Record<string, RiskItem['level']> = { '🟢': 'BAJO', '🟡': 'MEDIO', '🔴': 'ALTO', 'CRITICO': 'CRITICO', 'ALTO': 'ALTO', 'MEDIO': 'MEDIO', 'BAJO': 'BAJO' };
  for (const line of body.split('\n')) {
    const t = line.trim();
    if (!t) continue;
    const m = t.match(/^(🟢|🟡|🔴|CRITICO|ALTO|MEDIO|BAJO)\s*(.+)$/i);
    if (m) {
      items.push({ level: levelMap[m[1].toUpperCase()] || 'MEDIO', title: m[2].trim(), detail: '' });
    }
  }
  return items;
}
