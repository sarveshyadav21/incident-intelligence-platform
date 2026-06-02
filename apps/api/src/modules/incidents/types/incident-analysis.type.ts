import { z } from 'zod';

export const incidentAnalysisSchema = z.object({
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),

  confidenceScore: z.number().min(0).max(100),

  aiSummary: z.string(),

  rootCause: z.string(),

  impactAssessment: z.string(),

  detectionSource: z.string(),

  affectedServices: z.array(z.string()),

  remediationSteps: z.array(z.string()),
});

export type IncidentAnalysis = z.infer<typeof incidentAnalysisSchema>;
