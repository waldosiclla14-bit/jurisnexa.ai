import {
  findLawByTitle,
  findArticleByIdentifier,
  verifyChileanLaw,
} from '@/lib/rag/chilean-law-search';
import { VerificationResult, LegislationClaim, RuleSource } from './types';

export interface LegalReference {
  lawName: string;
  article: string | null;
}

const LAW_MENTION_PATTERN = /(?:el|los|un|una)?\s*([A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑ ]*(?:Código|Ley|Decreto|Constitución)[A-Za-zÁÉÍÓÚÑ ]*)(?:\s*(?:Artículo|Art\.?)\s*([\d]{1,6}(?:\s+[a-záéíóúñ]+){0,2}))?/g;

const LAW_KEYWORDS = /código|ley|decreto|constitución/i;

const NORM_SIGNAL = /\b(?:código|ley|decreto|constitución|art\b|artículo|art\.?)\b/i;

export function extractLegalReferences(message: string): LegalReference[] {
  const refs: LegalReference[] = [];
  const norm = message.replace(/\s+/g, ' ');
  let m: RegExpExecArray | null;
  while ((m = LAW_MENTION_PATTERN.exec(norm)) !== null) {
    if (m[1] && LAW_KEYWORDS.test(m[1])) {
      refs.push({
        lawName: m[1].trim().replace(/\s+/g, ' '),
        article: m[2] ? m[2].replace(/\.$/, '').toLowerCase() : null,
      });
    }
  }
  return refs;
}

function toRuleSource(identifier: string, articleNumber: string, law: NonNullable<LegislationClaim['foundLaw']>): RuleSource | null {
  const article = findArticleByIdentifier(identifier, articleNumber);
  if (!article) return null;
  return {
    identifier,
    title: law.title,
    rankLabel: law.rankLabel,
    articleNumber: article.number,
    articleTitle: article.title,
    content: article.text.substring(0, 1400),
    url: law.url,
  };
}

export class LegislationVerificationEngine {
  verify(message: string): VerificationResult {
    const claims: LegislationClaim[] = [];
    const checked = verifyChileanLaw(message);

    if (!checked.encontrada) {
      if (NORM_SIGNAL.test(message)) {
        claims.push({
          claim: message.trim(),
          normaRef: 'sin identificar',
          articleRef: null,
          verified: false,
          foundLaw: null,
          foundArticle: null,
          note: 'No se encontró una norma chilena que corresponda a esta referencia en el corpus local. Advertencia: no inventar su contenido ni su vigencia.',
        });
      }
      return { claims, verifiedCount: 0, unverifiedCount: claims.length };
    }

    const idNorma = checked.url?.replace(/[^0-9]/g, '');
    const identifier = idNorma ? `CL-${idNorma}` : null;

    const foundLaw = {
      identifier: identifier || 'CL-INDETERMINADA',
      title: checked.norma || 'Ley chilena',
      rankLabel: checked.tipo || 'Ley',
      status: checked.estado_raw || checked.verificacion,
      url: checked.url || `https://www.leychile.cl/Navegar?idNorma=${idNorma || '0'}`,
    };

    let foundArticle: RuleSource | null = null;
    if (checked.articulo && identifier) {
      foundArticle = toRuleSource(identifier, checked.articulo, foundLaw);
    }

    claims.push({
      claim: checked.articulo ? `${checked.norma} Art. ${checked.articulo}` : String(checked.norma),
      normaRef: checked.norma || 'Ley chilena',
      articleRef: checked.articulo || null,
      verified: true,
      foundLaw,
      foundArticle,
      note: checked.nota || null,
    });

    return {
      claims,
      verifiedCount: claims.filter(c => c.verified).length,
      unverifiedCount: claims.filter(c => !c.verified).length,
    };
  }
}

export const legislationVerificationEngine = new LegislationVerificationEngine();

interface GuardedClaim {
  claim: string;
  status: 'VERIFICADO' | 'NO_VERIFICADO' | 'REFERENCIA_SIN_NORMA';
  source?: RuleSource;
  detail: string;
}

export class LegalHallucinationGuard {
  guardReferences(message: string): GuardedClaim[] {
    const verification = legislationVerificationEngine.verify(message);
    return verification.claims.map<GuardedClaim>(c => {
      if (!c.verified) {
        return {
          claim: c.claim,
          status: c.foundLaw ? 'REFERENCIA_SIN_NORMA' : 'NO_VERIFICADO',
          detail: c.note || 'Sin fuente verificable. No citar como ley chilena vigente.',
        };
      }
      return {
        claim: c.claim,
        status: 'VERIFICADO',
        source: c.foundArticle || undefined,
        detail: c.note || `Verificado contra el corpus: ${c.foundLaw?.title}${c.articleRef ? ` Art. ${c.articleRef}` : ''} (${c.foundLaw?.rankLabel}).`,
      };
    });
  }

  assertArticleReferences(normaRef: string, articleRef: string): GuardedClaim {
    const law = findLawByTitle(normaRef);
    if (!law) {
      return {
        claim: `${normaRef} ${articleRef}`,
        status: 'NO_VERIFICADO',
        detail: `La norma "${normaRef}" no existe en el corpus chileno local. No afirmar su vigencia ni contenido.`,
      };
    }
    const article = findArticleByIdentifier(law.identifier, articleRef);
    const url = `https://www.leychile.cl/Navegar?idNorma=${law.identifier.replace('CL-', '')}`;
    if (!article) {
      return {
        claim: `${law.title} Art. ${articleRef}`,
        status: 'REFERENCIA_SIN_NORMA',
        detail: `La norma existe pero el Art. ${articleRef} no fue hallado en el texto local. Verificar con Ley Chile.`,
      };
    }
    return {
      claim: `${law.title} Art. ${articleRef}`,
      status: 'VERIFICADO',
      source: {
        identifier: law.identifier,
        title: law.title,
        rankLabel: law.rankLabel,
        articleNumber: article.number,
        articleTitle: article.title,
        content: article.text.substring(0, 1400),
        url,
      },
      detail: `Verificado: ${law.title} Art. ${article.number} (VIGENTE).`,
    };
  }
}

export const legalHallucinationGuard = new LegalHallucinationGuard();