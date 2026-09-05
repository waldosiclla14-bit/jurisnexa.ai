export type SectionStatus = 'complete' | 'streaming' | 'empty';

export type SourceVerification = 'VERIFICADA' | 'NO_ENCONTRADA' | 'PENDIENTE';

export type FactKind = 'persona' | 'fecha' | 'lugar' | 'monto' | 'documento' | 'relacion' | 'conducta' | 'otro';
export type FactStatus = 'given' | 'needs_confirmation' | 'relevant_unproven';
export type ConfidenceLevel = 'ALTO' | 'MEDIO' | 'BAJO' | 'MUY BAJO';
export type RiskLevel = 'CRITICO' | 'ALTO' | 'MEDIO' | 'BAJO';
export type EvidenceStatus = 'aportada' | 'pendiente' | 'relevante' | 'prioritaria';

export interface Section<T> {
  items: T[];
  status: SectionStatus;
}

export interface FactItem {
  text: string;
  kind: FactKind;
  status: FactStatus;
}

export interface LawReference {
  raw: string;
  code?: string;
  article?: string;
  jurisdiction?: 'CL' | 'PE';
}

export interface LawSource {
  raw: string;
  title: string;
  article?: string;
  jurisdiction?: 'CL' | 'PE';
  url?: string;
  status: SourceVerification;
}

export interface RiskItem {
  level: RiskLevel;
  title: string;
  detail: string;
  mitigation?: string;
}

export interface ActionItem {
  text: string;
  priority: number;
}

export interface EvidenceItem {
  label: string;
  status: EvidenceStatus;
}

export interface WarningItem {
  text: string;
  type: 'advertencia' | 'informacion_faltante' | 'verificacion_necesaria';
}

export interface ConfidenceData {
  score: number;
  level: ConfidenceLevel;
  factors?: string[];
}

export interface LegalResponseData {
  conclusion: { text: string; status: SectionStatus };
  summary: Section<{ jurisdiction: string | null; matter: string | null; problem: string | null; state: string; confidence: ConfidenceData | null; sourcesCount: number }> | null;
  legalIssue: Section<string>;
  norms: Section<LawSource>;
  jurisprudence: Section<string>;
  doctrine: Section<string>;
  analysis: Section<string>;
  rights: Section<string>;
  obligations: Section<string>;
  evidence: Section<EvidenceItem>;
  deadlines: Section<string>;
  arguments: Section<{ favorable: string[]; against: string[]; response?: string }>;
  risks: Section<RiskItem>;
  actions: Section<string>;
  nextSteps: Section<string>;
  sources: Section<LawSource>;
  confidence: Section<ConfidenceData>;
  warnings: Section<WarningItem>;
  disclaimer: Section<string>;
  rawSections: Record<string, string[]>;
}
