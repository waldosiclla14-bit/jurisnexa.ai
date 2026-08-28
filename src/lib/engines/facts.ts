import { ExtractedFacts } from './types';

const PARTY_PATTERNS = [
  /(?:mi cliente|el cliente|don|doña|señor[a]?|sr\.?|sra\.?)\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+){0,3})/g,
  /(?:contraté|firmé|compré|arrendé|me despidieron|soy)\s+(?:con|de|un|una)?\s*(.+?)(?:\.|,|$)/gi,
];

const DATE_PATTERNS = [
  /\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/g,
  /\b\d{1,2}\s+de\s+[a-záéíóúñ]+(?:\s+de\s+\d{2,4})?\b/gi,
  /\b(?:hace)\s+(\d+)\s+(días?|meses?|años?|semanas?)\b/gi,
  /\b(?:el pasado|la semana pasada|el año pasado|ayer|hoy|anteayer)\b/gi,
];

const MONEY_PATTERNS = [
  /\$?\s?([\d.,]{3,})\s*(?:pesos|dólares|usd|clp|uf|utm)?(?:\s*(?:pesos|dólares|usd|clp|uf|utm))?\b/gi,
  /\b(\d{1,3}(?:\.\d{3})?)+\s*UF\b/gi,
];

const STOPWORDS = ['para', 'como', 'cuando', 'porque', 'desde', 'hasta', 'sobre', 'entre', 'tambien', 'siempre', 'nunca'];

export function extractFacts(message: string): ExtractedFacts {
  const keywords = message
    .toLowerCase()
    .replace(/[¿¡!?.:,;()]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3 && !STOPWORDS.includes(w));

  const parties: string[] = [];
  for (const re of PARTY_PATTERNS) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(message)) !== null) {
      if (m[1]) parties.push(m[1].trim());
    }
  }

  const dates = new Set<string>();
  let m: RegExpExecArray | null;
  for (const re of DATE_PATTERNS) {
    re.lastIndex = 0;
    while ((m = re.exec(message)) !== null) {
      dates.add(m[0] !== undefined ? m[0] : m[1]);
    }
  }

  const amounts: ExtractedFacts['amounts'] = [];
  for (const re of MONEY_PATTERNS) {
    re.lastIndex = 0;
    while ((m = re.exec(message)) !== null) {
      const raw = m[0] || m[1] || '';
      const numeric = parseFloat(raw.replace(/[^\d.,]/g, '').replace(/\./g, '').replace(',', '.'));
      if (!isNaN(numeric) && numeric > 0) {
        amounts.push({ value: numeric, label: raw.trim() });
      }
    }
  }

  return {
    facts: [
      ...parties.map(p => ({ kind: 'persona' as const, value: p })),
      ...[...dates].map(d => ({ kind: 'fecha' as const, value: d })),
      ...amounts.map(a => ({ kind: 'monto' as const, value: a.label })),
    ],
    parties,
    dates: [...dates],
    amounts: amounts.slice(0, 10),
    keywords: keywords.slice(0, 30),
  };
}