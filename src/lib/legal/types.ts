// JurisNexa — Tipos centrales de respuesta jurídica estructurada
// Spec: §3 Tipos de consulta, §4-17 Modelo de datos, §44 Comparación, §31 Metadata

export type LegalQueryType =
  | 'general_question'
  | 'case_analysis'
  | 'legal_research'
  | 'legislation'
  | 'jurisprudence'
  | 'legal_comparison'
  | 'contract'
  | 'lawsuit'
  | 'appeal'
  | 'legal_letter'
  | 'legal_report'
  | 'procedure'
  | 'criminal'
  | 'civil'
  | 'labor'
  | 'family'
  | 'commercial'
  | 'administrative'
  | 'constitutional'
  | 'immigration'
  | 'tax'
  | 'other';

export interface QueryClassification {
  queryType: LegalQueryType;
  jurisdiction?: string;
  country?: 'CL' | 'PE' | 'OTHER';
  legalArea?: string;
  requestedAction?: string;
  urgency?: 'low' | 'medium' | 'high';
  requiresSources: boolean;
  requiresJurisprudence: boolean;
  requiresCurrentLaw: boolean;
}

// §5 Hechos
export interface FactItem {
  id: string;
  text: string;
  sourceIds?: string[];
  certainty: 'confirmed' | 'reported_by_user' | 'inferred' | 'disputed';
}

export interface FactSection {
  userProvided: FactItem[];
  sourceSupported: FactItem[];
  inferred: FactItem[];
  disputed: FactItem[];
}

// §6 Problema jurídico
export interface LegalIssueSection {
  primaryIssue: string;
  secondaryIssues?: string[];
  legalQuestions?: string[];
}

// §7 Normativa
export interface LegalNorm {
  id: string;
  country?: string;
  jurisdiction?: string;
  instrumentType: 'constitution' | 'law' | 'decree' | 'regulation' | 'code' | 'resolution' | 'ordinance' | 'other';
  name: string;
  article?: string;
  title?: string;
  text?: string;
  relevance: 'high' | 'medium' | 'low';
  status?: 'vigente' | 'derogada' | 'modificada' | 'unknown';
  effectiveDate?: string;
  sourceId?: string;
  notes?: string;
}

// §8 Jurisprudencia
export interface JurisprudenceItem {
  id: string;
  court: string;
  country?: string;
  caseNumber?: string;
  date?: string;
  matter?: string;
  holding?: string;
  relevantFacts?: string;
  legalRule?: string;
  applicationToCase?: string;
  sourceId?: string;
  verified: boolean;
}

export interface DoctrineItem {
  id: string;
  author?: string;
  title: string;
  publication?: string;
  year?: string;
  excerpt?: string;
  relevance?: string;
  sourceId?: string;
  verified?: boolean;
}

// §9 Análisis
export interface AnalysisSubsection {
  id: string;
  title: string;
  issue?: string;
  rule?: string;
  application?: string;
  reasoning?: string[];
  counterarguments?: string[];
  conclusion?: string;
  sourceIds?: string[];
}

export interface AnalysisSection {
  sections: AnalysisSubsection[];
}

// §10 Argumentos
export interface ArgumentItem {
  id: string;
  title: string;
  argument: string;
  strength: 'strong' | 'moderate' | 'weak';
  sourceIds?: string[];
  vulnerabilities?: string[];
}

// §11 Riesgos (§11 level low|medium|high|critical)
export interface RiskItem {
  id: string;
  title: string;
  description: string;
  level: 'low' | 'medium' | 'high' | 'critical';
  reason: string;
  mitigation?: string;
  sourceIds?: string[];
}

// §12 Estrategia
export interface StrategyAction {
  order: number;
  action: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
}

export interface StrategySection {
  objective?: string;
  recommendedActions: StrategyAction[];
  avoidActions?: string[];
  evidenceToCollect?: string[];
  nextSteps?: string[];
}

export interface ProcedureSection {
  steps: StrategyAction[];
  estimatedDuration?: string;
  authority?: string;
  requirements?: string[];
}

// §13 Conclusión
export interface ConclusionSection {
  answer: string;
  keyPoints: string[];
  limitations: string[];
  nextSteps?: string[];
}

// §14 Fuentes
export interface SourceItem {
  id: string;
  title: string;
  type: 'official' | 'legislation' | 'jurisprudence' | 'government' | 'academic' | 'secondary' | 'user_document';
  authority?: string;
  url?: string;
  dateAccessed?: string;
  publicationDate?: string;
  citation?: string;
  verified: boolean;
  supports?: string[];
}

// §15 Advertencias
export interface WarningItem {
  type: 'missing_information' | 'unverified_source' | 'jurisdiction_ambiguity' | 'current_law_not_verified' | 'possible_conflict' | 'high_risk';
  message: string;
  severity: 'info' | 'warning' | 'critical';
}

// §16 Confianza
export interface ConfidenceInfo {
  level: 'high' | 'medium' | 'low';
  reasons: string[];
  missingEvidence?: string[];
}

// §24 Claims
export interface Claim {
  id: string;
  text: string;
  type: 'fact' | 'legal_rule' | 'interpretation' | 'inference';
  sourceIds: string[];
  verified: boolean;
}

// §31 Metadata
export interface ResponseMetadata {
  createdAt: string;
  model?: string;
  promptVersion?: string;
  schemaVersion: string;
  jurisdiction?: string;
  sourceCount: number;
  verifiedSourceCount: number;
}

export interface LegalResponseMetadata extends ResponseMetadata {
  queryType?: LegalQueryType;
  validationPassed?: boolean;
  retryCount?: number;
  responseTime?: number;
}

// §44 Comparación
export interface JurisdictionComparison {
  topic: string;
  jurisdictions: {
    country: string;
    rule: string;
    sourceIds: string[];
    differences: string[];
  }[];
  practicalDifference?: string;
}

// Jurisdicción genérica
export interface Jurisdiction {
  country: 'CL' | 'PE' | 'OTHER';
  region?: string;
}

// §4 Respuesta central
export interface LegalResponse {
  id: string;
  version: string;
  queryType: LegalQueryType;
  jurisdiction?: Jurisdiction;
  title: string;
  executiveSummary?: string;
  facts?: FactSection;
  legalIssue?: LegalIssueSection;
  applicableLaw?: LegalNorm[];
  jurisprudence?: JurisprudenceItem[];
  doctrine?: DoctrineItem[];
  analysis?: AnalysisSection;
  argumentsFor?: ArgumentItem[];
  argumentsAgainst?: ArgumentItem[];
  risks?: RiskItem[];
  strategy?: StrategySection;
  procedure?: ProcedureSection;
  conclusion?: ConclusionSection;
  sources: SourceItem[];
  warnings?: WarningItem[];
  confidence?: ConfidenceInfo;
  claims?: Claim[];
  jurisdictionComparison?: JurisdictionComparison;
  metadata: ResponseMetadata;
}
