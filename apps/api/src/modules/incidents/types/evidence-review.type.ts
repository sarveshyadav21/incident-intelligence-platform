import { z } from 'zod';

export const evidenceReviewSchema = z.object({
  isEvidenceSupported: z.boolean(),
  hallucinationRisk: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  unsupportedClaims: z.array(z.string()),
  missingEvidence: z.array(z.string()),
  confidenceAdjustment: z.number().min(-50).max(10),
  reviewerNotes: z.string().min(1),
});

export type EvidenceReview = z.infer<typeof evidenceReviewSchema>;
