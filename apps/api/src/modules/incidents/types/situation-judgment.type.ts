import { z } from 'zod';

export const situationJudgmentSchema = z.object({
  urgency: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  escalationRequired: z.boolean(),
  customerImpactLikely: z.boolean(),
  securityRisk: z.enum(['NONE_DETECTED', 'POSSIBLE', 'LIKELY']),
  dataLossRisk: z.enum(['NONE_DETECTED', 'POSSIBLE', 'LIKELY']),
  blastRadius: z.enum([
    'UNKNOWN',
    'SINGLE_SERVICE',
    'MULTI_SERVICE',
    'SYSTEM_WIDE',
  ]),
  recommendedResponseMode: z.enum([
    'MONITOR',
    'INVESTIGATE',
    'MITIGATE_NOW',
    'ESCALATE_IMMEDIATELY',
  ]),
  rationale: z.string().min(1),
});

export type SituationJudgment = z.infer<typeof situationJudgmentSchema>;
