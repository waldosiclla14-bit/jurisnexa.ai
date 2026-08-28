import { Country, LegalArea, UserType } from '@/types';

export type LegalEngineMode = 'cliente' | 'abogado' | 'investigacion';

export interface RuleSource {
  identifier: string;
  title: string;
  rankLabel: string;
  articleNumber: string;
  articleTitle: string;
  content: string;
  url: string;
}

export interface Fact {
  kind: 'persona' | 'fecha' | 'lugar' | 'monto' | 'documento' | 'relacion' | 'conducta' | 'otro';
  value: string;
}

export interface ExtractedFacts {
  facts: Fact[];
  parties: string[];
  dates: string[];
  amounts: { value: number; label: string }[];
  keywords: string[];
}

export interface LegalAreaMatch {
  area: LegalArea;
  score: number;
  reasons: string[];
}

export interface LegalQualification {
  primaryArea: LegalArea | null;
  areas: LegalAreaMatch[];
  figure: string | null;
  figureLabel: string | null;
  summary: string | null;
  keywords: string[];
}

export interface LegislationClaim {
  claim: string;
  normaRef: string;
  articleRef: string | null;
  verified: boolean;
  foundLaw: {
    identifier: string;
    title: string;
    rankLabel: string;
    status: string;
    url: string;
  } | null;
  foundArticle: RuleSource | null;
  note: string | null;
}

export interface VerificationResult {
  claims: LegislationClaim[];
  verifiedCount: number;
  unverifiedCount: number;
}

export interface MissingFact {
  question: string;
  kind: Fact['kind'];
  priority: number;
  rationale: string;
}

export interface CaseComparisonItem {
  legalElement: string;
  present: boolean;
  detail: string;
}

export interface EvidenceItem {
  probanza: string;
  kind: string;
  mentioned: boolean;
  strength: string | null;
  note: string;
}

export interface LegalConflictItem {
  type: 'colision' | 'aparente' | 'temporal' | 'competencia' | 'duda';
  title: string;
  detail: string;
}

export interface RiskItem {
  level: 'CRITICO' | 'ALTO' | 'MEDIO' | 'BAJO';
  title: string;
  detail: string;
  mitigation: string | null;
}

export interface DeadlineItem {
  title: string;
  applicable: boolean;
  references: RuleSource[];
  observation: string | null;
}

export interface TemporalAnalysis {
  deadlines: DeadlineItem[];
  applicableLawPeriod: string | null;
  notes: string[];
}

export interface LawChangeRule {
  law: string;
  jurisdiction: string;
  article: string | null;
  changeType: 'nuevo' | 'sustituido' | 'modificado' | 'derogado' | 'agregado';
  beforeText: string | null;
  afterText: string | null;
  url: string;
  summary: string;
}

export interface LawChangeDetectionResult {
  detectedChanges: LawChangeRule[];
  referencedLaws: { title: string; url: string | null }[];
  summary: string;
}

export interface InterviewQuestion {
  question: string;
  option1: string | null;
  option2: string | null;
  option3: string | null;
  option4: string | null;
  option5: string | null;
  required: boolean;
  rationale: string | null;
}

export interface AdaptiveInterviewResult {
  questions: InterviewQuestion[];
  askedCount: number;
  exhausted: boolean;
}

export interface DocumentAnalyzerResult {
  docType: string | null;
  docTypeConfidence: number | null;
  segments: string[];
  extractedParties: string[];
  extractedDates: string[];
  extractedAmounts: string[];
}

export interface JurisprudenceAnalysisResult {
  literatureSearched: boolean;
  sourcesSuggested: string[];
  warning: string;
}

export interface ConfidenceScore {
  score: number;
  level: 'ALTO' | 'MEDIO' | 'BAJO' | 'MUY BAJO';
  factors: { name: string; impact: number; label: string }[];
}

export interface LegalAnalysisInput {
  message: string;
  country: Country;
  legalArea?: LegalArea;
  tipoUsuario?: UserType;
  history?: { role: 'user' | 'assistant'; content: string }[];
  documentText?: string;
  mode?: LegalEngineMode;
}

export interface LegalAnalysisResult {
  mode: LegalEngineMode;
  facts: ExtractedFacts;
  qualification: LegalQualification;
  verification: VerificationResult;
  caseComparison: CaseComparisonItem[];
  missingFacts: MissingFact[];
  evidence: EvidenceItem[];
  conflicts: LegalConflictItem[];
  temporal: TemporalAnalysis;
  risks: RiskItem[];
  interview: AdaptiveInterviewResult;
  document: DocumentAnalyzerResult | null;
  jurisprudence: JurisprudenceAnalysisResult;
  lawChanges: LawChangeDetectionResult | null;
  usurpation: {
    matched: boolean;
    suggestedArticle: string | null;
    detectionNote: string;
    reformNote: string | null;
  };
  confidence: ConfidenceScore;
  sources: RuleSource[];
  contextString: string;
  diagnosisCapat0: string;
  diagnosisCapat1: string;
  diagnosisCapat2: string;
}