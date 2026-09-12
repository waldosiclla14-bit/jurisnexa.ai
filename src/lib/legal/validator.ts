import { LegalResponseSchema } from './schemas/legal-response.schema';
import type { LegalResponse, SourceItem } from './types';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  data?: LegalResponse;
}

export function validateLegalResponse(input: unknown): ValidationResult {
  const result = LegalResponseSchema.safeParse(input);
  if (result.success) {
    const warnings: string[] = [];
    const response = result.data as LegalResponse;
    // §40 anti-alucinación checks
    if (response.jurisprudence?.some((j) => !j.verified)) {
      warnings.push('Jurisprudencia no verificada presente');
    }
    if (response.applicableLaw?.some((n) => n.status === 'unknown')) {
      warnings.push('Normativa con estado de vigencia no verificado');
    }
    return { valid: true, errors: [], warnings, data: response };
  }
  const errors = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
  return { valid: false, errors, warnings: [] };
}

export function validateLegalSources(response: LegalResponse): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const sourceIds = new Set(response.sources.map((s) => s.id));

  // Validar que toda referencia a sourceIds exista
  const allRefs: string[] = [
    ...(response.facts ? [...response.facts.userProvided, ...response.facts.sourceSupported, ...response.facts.inferred, ...response.facts.disputed].flatMap((f) => f.sourceIds ?? []) : []),
    ...(response.applicableLaw?.flatMap((n) => (n.sourceId ? [n.sourceId] : [])) ?? []),
    ...(response.jurisprudence?.flatMap((j) => (j.sourceId ? [j.sourceId] : [])) ?? []),
    ...(response.analysis?.sections.flatMap((s) => s.sourceIds ?? []) ?? []),
    ...(response.argumentsFor?.flatMap((a) => a.sourceIds ?? []) ?? []),
    ...(response.argumentsAgainst?.flatMap((a) => a.sourceIds ?? []) ?? []),
    ...(response.risks?.flatMap((r) => r.sourceIds ?? []) ?? []),
    ...(response.claims?.flatMap((c) => c.sourceIds) ?? []),
  ];

  for (const ref of allRefs) {
    if (!sourceIds.has(ref)) {
      errors.push(`sourceId inexistente referenciado: ${ref}`);
    }
  }

  // URL válida para fuentes oficiales
  for (const src of response.sources) {
    if (src.url) {
      try {
        new URL(src.url);
      } catch {
        errors.push(`URL inválida en fuente ${src.id}: ${src.url}`);
      }
    }
    if (src.type === 'official' && !src.verified) {
      warnings.push(`Fuente oficial no verificada: ${src.id}`);
    }
  }

  // Jurisprudencia sin fuente
  if (response.jurisprudence?.some((j) => !j.sourceId && j.verified)) {
    warnings.push('Jurisprudencia marcada como verificada sin sourceId');
  }

  return { valid: errors.length === 0, errors, warnings };
}

export type ClaimVerification = 'verified' | 'partially_verified' | 'unverified' | 'user_reported' | 'inferred';

export function detectUnverifiedClaims(response: LegalResponse): Record<string, ClaimVerification> {
  const result: Record<string, ClaimVerification> = {};
  if (!response.claims) return result;
  for (const claim of response.claims) {
    if (claim.type === 'fact' && claim.verified) {
      const hasOfficial = claim.sourceIds.some((id) => response.sources.find((s) => s.id === id)?.verified);
      result[claim.id] = hasOfficial ? 'verified' : 'partially_verified';
    } else if (claim.type === 'inference') {
      result[claim.id] = 'inferred';
    } else if (!claim.verified || claim.sourceIds.length === 0) {
      result[claim.id] = 'unverified';
    } else {
      result[claim.id] = 'verified';
    }
  }
  // Hechos aportados por usuario
  if (response.facts) {
    for (const f of response.facts.userProvided) {
      result[f.id] = 'user_reported';
    }
  }
  return result;
}

export function safeParseLegalResponse(raw: string): ValidationResult {
  try {
    const parsed = JSON.parse(raw);
    return validateLegalResponse(parsed);
  } catch (e) {
    return { valid: false, errors: [`JSON inválido: ${e instanceof Error ? e.message : String(e)}`], warnings: [] };
  }
}
