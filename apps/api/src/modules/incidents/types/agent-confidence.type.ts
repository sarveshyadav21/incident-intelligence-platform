import { z } from 'zod';

export const agentConfidenceSchema = z.object({
  confidenceScore: z.number().min(0).max(100),
  rationale: z.string().min(1),
});

export type AgentConfidence = z.infer<typeof agentConfidenceSchema>;
