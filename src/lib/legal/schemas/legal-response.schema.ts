import { z } from 'zod';

export const LegalQueryTypeSchema = z.enum([
  'general_question',
  'case_analysis',
  'legal_research',
  'legislation',
  'jurisprudence',
  'legal_comparison',
  'contract',
  'lawsuit',
  'appeal',
  'legal_letter',
  'legal_report',
  'procedure',
  'criminal',
  'civil',
  'labor',
  'family',
  'commercial',
  'administrative',
  'constitutional',
  'immigration',
  'tax',
  'other',
]);

export const FactItemSchema = z.object({
  id: z.string(),
  text: z.string().min(1),
  sourceIds: z.array(z.string()).optional(),
  certainty: z.enum(['confirmed', 'reported_by_user', 'inferred', 'disputed']),
});

export const FactSectionSchema = z.object({
  userProvided: z.array(FactItemSchema),
  sourceSupported: z.array(FactItemSchema),
  inferred: z.array(FactItemSchema),
  disputed: z.array(FactItemSchema),
});

export const LegalIssueSectionSchema = z.object({
  primaryIssue: z.string().min(1),
  secondaryIssues: z.array(z.string()).optional(),
  legalQuestions: z.array(z.string()).optional(),
});

export const LegalNormSchema = z.object({
  id: z.string(),
  country: z.string().optional(),
  jurisdiction: z.string().optional(),
  instrumentType: z.enum(['constitution', 'law', 'decree', 'regulation', 'code', 'resolution', 'ordinance', 'other']),
  name: z.string().min(1),
  article: z.string().optional(),
  title: z.string().optional(),
  text: z.string().optional(),
  relevance: z.enum(['high', 'medium', 'low']),
  status: z.enum(['vigente', 'derogada', 'modificada', 'unknown']).optional(),
  effectiveDate: z.string().optional(),
  sourceId: z.string().optional(),
  notes: z.string().optional(),
});

export const JurisprudenceItemSchema = z.object({
  id: z.string(),
  court: z.string().min(1),
  country: z.string().optional(),
  caseNumber: z.string().optional(),
  date: z.string().optional(),
  matter: z.string().optional(),
  holding: z.string().optional(),
  relevantFacts: z.string().optional(),
  legalRule: z.string().optional(),
  applicationToCase: z.string().optional(),
  sourceId: z.string().optional(),
  verified: z.boolean(),
});

export const DoctrineItemSchema = z.object({
  id: z.string(),
  author: z.string().optional(),
  title: z.string().min(1),
  publication: z.string().optional(),
  year: z.string().optional(),
  excerpt: z.string().optional(),
  relevance: z.string().optional(),
  sourceId: z.string().optional(),
  verified: z.boolean().optional(),
});

export const AnalysisSubsectionSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  issue: z.string().optional(),
  rule: z.string().optional(),
  application: z.string().optional(),
  reasoning: z.array(z.string()).optional(),
  counterarguments: z.array(z.string()).optional(),
  conclusion: z.string().optional(),
  sourceIds: z.array(z.string()).optional(),
});

export const AnalysisSectionSchema = z.object({
  sections: z.array(AnalysisSubsectionSchema),
});

export const ArgumentItemSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  argument: z.string().min(1),
  strength: z.enum(['strong', 'moderate', 'weak']),
  sourceIds: z.array(z.string()).optional(),
  vulnerabilities: z.array(z.string()).optional(),
});

export const RiskItemSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  description: z.string().min(1),
  level: z.enum(['low', 'medium', 'high', 'critical']),
  reason: z.string().min(1),
  mitigation: z.string().optional(),
  sourceIds: z.array(z.string()).optional(),
});

export const StrategyActionSchema = z.object({
  order: z.number(),
  action: z.string().min(1),
  reason: z.string().min(1),
  priority: z.enum(['high', 'medium', 'low']),
});

export const StrategySectionSchema = z.object({
  objective: z.string().optional(),
  recommendedActions: z.array(StrategyActionSchema),
  avoidActions: z.array(z.string()).optional(),
  evidenceToCollect: z.array(z.string()).optional(),
  nextSteps: z.array(z.string()).optional(),
});

export const ProcedureSectionSchema = z.object({
  steps: z.array(StrategyActionSchema),
  estimatedDuration: z.string().optional(),
  authority: z.string().optional(),
  requirements: z.array(z.string()).optional(),
});

export const ConclusionSectionSchema = z.object({
  answer: z.string().min(1),
  keyPoints: z.array(z.string()),
  limitations: z.array(z.string()),
  nextSteps: z.array(z.string()).optional(),
});

export const SourceSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  type: z.enum(['official', 'legislation', 'jurisprudence', 'government', 'academic', 'secondary', 'user_document']),
  authority: z.string().optional(),
  url: z.string().url().optional(),
  dateAccessed: z.string().optional(),
  publicationDate: z.string().optional(),
  citation: z.string().optional(),
  verified: z.boolean(),
  supports: z.array(z.string()).optional(),
});

export const WarningItemSchema = z.object({
  type: z.enum(['missing_information', 'unverified_source', 'jurisdiction_ambiguity', 'current_law_not_verified', 'possible_conflict', 'high_risk']),
  message: z.string().min(1),
  severity: z.enum(['info', 'warning', 'critical']),
});

export const ConfidenceInfoSchema = z.object({
  level: z.enum(['high', 'medium', 'low']),
  reasons: z.array(z.string()),
  missingEvidence: z.array(z.string()).optional(),
});

export const ClaimSchema = z.object({
  id: z.string(),
  text: z.string().min(1),
  type: z.enum(['fact', 'legal_rule', 'interpretation', 'inference']),
  sourceIds: z.array(z.string()),
  verified: z.boolean(),
});

export const ResponseMetadataSchema = z.object({
  createdAt: z.string(),
  model: z.string().optional(),
  promptVersion: z.string().optional(),
  schemaVersion: z.string(),
  jurisdiction: z.string().optional(),
  sourceCount: z.number(),
  verifiedSourceCount: z.number(),
});

export const JurisdictionSchema = z.object({
  country: z.enum(['CL', 'PE', 'OTHER']),
  region: z.string().optional(),
});

export const JurisdictionComparisonSchema = z.object({
  topic: z.string().min(1),
  jurisdictions: z.array(
    z.object({
      country: z.string(),
      rule: z.string(),
      sourceIds: z.array(z.string()),
      differences: z.array(z.string()),
    })
  ),
  practicalDifference: z.string().optional(),
});

export const LegalResponseSchema = z.object({
  id: z.string(),
  version: z.string(),
  queryType: LegalQueryTypeSchema,
  jurisdiction: JurisdictionSchema.optional(),
  title: z.string().min(1),
  executiveSummary: z.string().optional(),
  facts: FactSectionSchema.optional(),
  legalIssue: LegalIssueSectionSchema.optional(),
  applicableLaw: z.array(LegalNormSchema).optional(),
  jurisprudence: z.array(JurisprudenceItemSchema).optional(),
  doctrine: z.array(DoctrineItemSchema).optional(),
  analysis: AnalysisSectionSchema.optional(),
  argumentsFor: z.array(ArgumentItemSchema).optional(),
  argumentsAgainst: z.array(ArgumentItemSchema).optional(),
  risks: z.array(RiskItemSchema).optional(),
  strategy: StrategySectionSchema.optional(),
  procedure: ProcedureSectionSchema.optional(),
  conclusion: ConclusionSectionSchema.optional(),
  sources: z.array(SourceSchema),
  warnings: z.array(WarningItemSchema).optional(),
  confidence: ConfidenceInfoSchema.optional(),
  claims: z.array(ClaimSchema).optional(),
  jurisdictionComparison: JurisdictionComparisonSchema.optional(),
  metadata: ResponseMetadataSchema,
});

export type LegalResponseValidated = z.infer<typeof LegalResponseSchema>;
