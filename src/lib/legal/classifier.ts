import type { LegalQueryType, QueryClassification } from './types';
import type { Country, LegalArea } from '@/types';

const QUERY_PATTERNS: Array<{ type: LegalQueryType; patterns: RegExp[] }> = [
  { type: 'immigration', patterns: [/migrat/i, /visa/i, /residencia/i, /SERMIG/i, /extranjer/i, /permanencia definitiva/i, /prórroga/i] },
  { type: 'labor', patterns: [/laboral/i, /trabajo/i, /despido/i, /contrato de trabajo/i, /finiquito/i, /sueldo/i] },
  { type: 'family', patterns: [/familia/i, /divorcio/i, /custodia/i, /alimentos/i, /pensión/i, /matrimonio/i] },
  { type: 'criminal', patterns: [/penal/i, /delito/i, /criminal/i, /denuncia/i, /fiscal/i, /prisión/i] },
  { type: 'civil', patterns: [/civil/i, /contrato civil/i, /responsabilidad civil/i, /daños/i] },
  { type: 'contract', patterns: [/contrato/i, /cláusula/i, /convenio/i] },
  { type: 'lawsuit', patterns: [/demanda/i, /juicio/i, /demandar/i] },
  { type: 'appeal', patterns: [/apelac/i, /recurso/i, /casación/i] },
  { type: 'legal_letter', patterns: [/carta/i, /escrito/i, /solicitud.*juez/i] },
  { type: 'jurisprudence', patterns: [/jurisprud/i, /sentencia/i, /fallo/i, /corte/i] },
  { type: 'legislation', patterns: [/ley/i, /decreto/i, /norma/i, /artículo/i, /reglamento/i] },
  { type: 'legal_comparison', patterns: [/comparar/i, /diferencia.*chile.*perú/i, /chile.*perú/i] },
];

export function classifyLegalQuery(message: string, country?: Country, legalArea?: LegalArea): QueryClassification {
  const lower = message.toLowerCase();
  let queryType: LegalQueryType = 'general_question';
  for (const { type, patterns } of QUERY_PATTERNS) {
    if (patterns.some((p) => p.test(lower))) {
      queryType = type;
      break;
    }
  }
  // Heurística adicional por largo/complejidad
  if (message.length > 500 && queryType === 'general_question') {
    queryType = 'case_analysis';
  }

  const countryDetected: QueryClassification['country'] =
    country === 'CHILE' ? 'CL' : country === 'PERU' ? 'PE' : /chile/i.test(message) ? 'CL' : /per[uú]/i.test(message) ? 'PE' : undefined;

  const requiresSources = !/hola|gracias|qué es/i.test(lower) || queryType !== 'general_question';
  const requiresJurisprudence = queryType === 'jurisprudence' || /jurisprud/i.test(lower);
  const requiresCurrentLaw = queryType === 'legislation' || /vigente|actual/i.test(lower);

  return {
    queryType,
    jurisdiction: countryDetected,
    country: countryDetected,
    legalArea,
    urgency: /urgente|inmediato|plazo.*vence/i.test(lower) ? 'high' : 'low',
    requiresSources,
    requiresJurisprudence,
    requiresCurrentLaw,
  };
}
