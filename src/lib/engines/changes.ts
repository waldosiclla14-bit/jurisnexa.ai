import { LawChangeDetectionResult, LawChangeRule } from './types';
import { findLawByIdentifier, loadIndex } from '@/lib/rag/chilean-law-search';
import fs from 'fs';
import path from 'path';

interface ChangeRecord {
  lawId: string;
  lawTitle: string;
  article: string | null;
  changeType: LawChangeRule['changeType'];
  beforeText: string | null;
  afterText: string | null;
  summary: string;
}

const KNOWN_MODIFYING_LAWS: Record<string, { modifies: string; primaryNote: string }> = {
  'CL-1198283': {
    modifies: 'CL-1984',
    primaryNote: 'Ley N.º 21.633 (ocupación ilegal de inmuebles): sustituye el inciso primero del Art. 457, agrega Art. 457 bis y Art. 458 bis, y agrega el inciso final al Art. 458 del Código Penal.',
  },
};

export class LawChangeDetector {
  detect(message: string): LawChangeDetectionResult {
    const referencedLaws: { title: string; url: string | null }[] = [];
    const detectedChanges: LawChangeRule[] = [];

    const usrushed = message.toLowerCase();
    const index = loadIndex();

    for (const law of index) {
      if (!/LEY|NÚM|REGULA/.test(law.title)) continue;
      if (/21\.633/.test(usrushed) || /ocupaci.o ilegal/.test(usrushed)) {
        if (law.identifier === 'CL-1198283') {
          referencedLaws.push({
            title: law.title,
            url: `https://www.leychile.cl/Navegar?idNorma=1198283`,
          });
          break;
        }
      }
    }

    const mapping = KNOWN_MODIFYING_LAWS['CL-1198283'];
    if (mapping && /ocupaci|usur|l\.?\s*21\.633|ley 21\.633/.test(usrushed)) {
      const darios = this.extractChangesFromLey21633();
      for (const record of darios) {
        const law = findLawByIdentifier(record.lawId);
        detectedChanges.push({
          law: law?.title || record.lawTitle,
          jurisdiction: 'CHILE',
          article: record.article,
          changeType: record.changeType,
          beforeText: record.beforeText,
          afterText: record.afterText,
          url: `https://www.leychile.cl/Navegar?idNorma=${record.lawId.replace('CL-', '')}`,
          summary: mapping.primaryNote,
        });
      }
    }

    const summary = detectedChanges.length > 0
      ? `Se detectó el corpus contiene el texto consolidado del Código Penal con las modificaciones de la Ley N.º 21.633.`
      : 'No se detectaron cambios legislativos específicamente referidos en la consulta.';

    return { detectedChanges, referencedLaws, summary };
  }

  private extractChangesFromLey21633(): ChangeRecord[] {
    const ley = findLawByIdentifier('CL-1198283');
    if (!ley) return [];
    const content = readRawFile('CL-1198283');
    if (!content) return [];

    const changes: ChangeRecord[] = [];

    const art1 = extractSection(content, /Artículo 1º/i);
    if (art1) {
      if (/Sustit[úu]yese el inciso primero del art[ií]culo 457/i.test(art1)) {
        const after = extractQuote(art1, /"Art[ií]culo 457\.[\s\S]*?"/);
        changes.push({
          lawId: 'CL-1984',
          lawTitle: 'CÓDIGO PENAL',
          article: '457',
          changeType: 'sustituido',
          beforeText: 'Antes de la Ley 21.633 el inciso primero del Art. 457 incluía además la pena de multa de seis a diez unidades tributarias mensuales para el caso de violencia o intimidación.',
          afterText: after ? truncate(after, 600) : 'Al que, con violencia o intimidación en las personas, ocupare total o parcialmente un inmueble, sea público o privado...',
          summary: 'Sustitución del inciso primero del Art. 457 CP',
        });
      }
      if (/Agr[eé]gase un art[ií]culo 457 bis/i.test(art1)) {
        changes.push({
          lawId: 'CL-1984',
          lawTitle: 'CÓDIGO PENAL',
          article: '457 bis',
          changeType: 'agregado',
          beforeText: null,
          afterText: 'Artículo 457 bis: ocupación sin violencia pero con daño en las cosas, con penas escalonadas según el importe del daño.',
          summary: 'Nuevo Art. 457 bis CP: usupación con daño',
        });
      }
      if (/Agr[eé]gase un art[ií]culo 458 bis/i.test(art1)) {
        changes.push({
          lawId: 'CL-1984',
          lawTitle: 'CÓDIGO PENAL',
          article: '458 bis',
          changeType: 'agregado',
          beforeText: null,
          afterText: 'Artículo 458 bis: se impone el máximum de las penas si la ocupación es en lugar habitado, obstaculiza combate de incendios o interrumpe servicios públicos.',
          summary: 'Nuevo Art. 458 bis CP: agravantes de la ocupación',
        });
      }
    }

    return changes;
  }
}

function readRawFile(identifier: string): string | null {
  try {
    const dataDir = process.env.JURISNEXA_LEYES_DATA || path.join(process.cwd(), 'data');
    const p = path.join(dataDir, 'leyes', 'cl', `${identifier}.md`);
    if (!fs.existsSync(p)) return null;
    return fs.readFileSync(p, 'utf-8');
  } catch {
    return null;
  }
}

function extractSection(content: string, re: RegExp): string | null {
  const m = content.match(re);
  if (!m) return null;
  const start = m.index !== undefined ? m.index : content.indexOf(m[0]);
  if (start < 0) return null;
  const maxLen = 6000;
  return content.substring(start, start + maxLen);
}

function extractQuote(text: string, re: RegExp): string | null {
  const m = text.match(re);
  return m ? m[0] : null;
}

function truncate(s: string, n: number): string {
  return s.length > n ? s.substring(0, n) + '...' : s;
}

export const lawChangeDetector = new LawChangeDetector();

export class JurisprudenceEngine {
  analyze(message: string): { literatureSearched: boolean; sourcesSuggested: string[]; warning: string; matchedRefs: { title: string; url: string }[] } {
    const sourcesSuggested = [
      'Poder Judicial de Chile — Causas en línea (cid.pjud.cl)',
      'Jurisprudencia Corte Suprema (basejurisprudencial.cl)',
      'Sistema de Tramitación Judicial (CTR / OJV)',
      'BCN — Biblioteca jurisprudencial leychile.cl',
    ];

    const matchedRefs: { title: string; url: string }[] = [];
    if (/corte suprema|jurisprudencia|sentencia/.test(message)) {
      matchedRefs.push({
        title: 'Base Jurisprudencial de la Corte Suprema',
        url: 'https://basejurisprudencial.pjud.cl',
      });
    }

    return {
      literatureSearched: false,
      sourcesSuggested,
      warning: 'No se dispone de un corpus local de sentencias en este despliegue. Toda jurisprudencia citada en la respuesta debe indicarse expresamente como NO VERIFICADA contra corpus, o debe omitirse.',
      matchedRefs,
    };
  }
}

export const jurisprudenceEngine = new JurisprudenceEngine();

export class LegalDocumentAnalyzer {
  analyze(documentText: string): {
    docType: string | null;
    docTypeConfidence: number | null;
    segments: string[];
    extractedParties: string[];
    extractedDates: string[];
    extractedAmounts: string[];
  } {
    if (!documentText || documentText.trim().length === 0) {
      return { docType: null, docTypeConfidence: null, segments: [], extractedParties: [], extractedDates: [], extractedAmounts: [] };
    }

    const norm = documentText.toLowerCase();
    const docType = detectDocType(norm);

    const extractedParties = (documentText.match(/(?:señor|señora|don|doña|en representación de)\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+){1,2})/g) || []);
    const extractedDates = (documentText.match(/\d{1,2}\s+de\s+[a-záéíóúñ]+\s+de\s+\d{4}/gi) || []);
    const extractedAmounts = (documentText.match(/\$\s?[\d.,]+\s*(?:CLP|pesos)?/gi) || []).slice(0, 12);

    const segments = norm.split(/\n{2,}/).filter(s => s.trim().length > 30).slice(0, 8);

    return {
      docType,
      docTypeConfidence: docType ? 0.8 : null,
      segments,
      extractedParties,
      extractedDates,
      extractedAmounts,
    };
  }
}

function detectDocType(norm: string): string | null {
  if (/contrato de trabajo|relaci[oó]n laboral/.test(norm)) return 'Contrato laboral';
  if (/demanda|en lo principal/.test(norm) && /tribunal|juzgado/.test(norm)) return 'Escrito judicial (demanda)';
  if (/escritura|conservador de bienes ra[ií]ces/.test(norm)) return 'Escritura / asunto inmobiliario';
  if (/factura|boleta|gu[ií]a de despacho/.test(norm)) return 'Documento comercial';
  if (/sentencia|resoluci[oó]n/.test(norm) && /se resuelve/.test(norm)) return 'Sentencia / resolución';
  if (/testamento|nombramiento de heredero/.test(norm)) return 'Testamento';
  if (/finiquito|avis[oó] de t[eé]rmino/.test(norm)) return 'Finiquito laboral';
  return null;
}

export const legalDocumentAnalyzer = new LegalDocumentAnalyzer();