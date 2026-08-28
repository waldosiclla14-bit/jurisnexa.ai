import { LegalArea } from '@/types';
import { LegalQualification, LegalAreaMatch, ExtractedFacts } from './types';
import { AREA_LEXICON, FIGURE_PATTERNS } from './lexicon';

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export class LegalQualificationEngine {
  qualify(message: string, facts: ExtractedFacts): LegalQualification {
    const normMessage = normalize(message);
    const areas: LegalAreaMatch[] = [];

    for (const lexicon of AREA_LEXICON) {
      let score = 0;
      const reasons: string[] = [];
      for (const term of lexicon.terms) {
        const nterm = normalize(term);
        if (normMessage.includes(nterm)) {
          score += lexicon.weight;
          reasons.push(term);
        }
      }
      for (const label of lexicon.labels) {
        if (normMessage.includes(normalize(label))) {
          score += lexicon.weight * 2;
          reasons.push(label);
        }
      }
      if (score > 0) {
        areas.push({ area: lexicon.area, score, reasons: reasons.slice(0, 6) });
      }
    }

    areas.sort((a, b) => b.score - a.score);
    const primaryArea: LegalArea | null = areas.length > 0 ? areas[0].area : null;

    let figure = null;
    let figureLabel = null;
    let summary = null;
    for (const pattern of FIGURE_PATTERNS) {
      const matched = pattern.patterns.some(r => r.test(normMessage));
      if (matched) {
        figure = pattern.figure;
        figureLabel = pattern.figureLabel;
        summary = pattern.summary;
        break;
      }
    }

    return {
      primaryArea,
      areas: areas.slice(0, 4),
      figure,
      figureLabel,
      summary,
      keywords: facts.keywords,
    };
  }
}

export const legalQualificationEngine = new LegalQualificationEngine();