import { z } from 'zod';

export const incidentEvidenceSchema = z.object({
  quote: z.string().min(1),
  signalType: z.enum([
    'ERROR',
    'LATENCY',
    'OUTAGE',
    'RESOURCE',
    'SECURITY',
    'DEPENDENCY',
    'DEPLOYMENT',
    'UNKNOWN',
  ]),
  interpretation: z.string().min(1),
});

export const incidentEvidenceListSchema = z
  .array(incidentEvidenceSchema)
  .max(12);

export type IncidentEvidence = z.infer<typeof incidentEvidenceSchema>;
