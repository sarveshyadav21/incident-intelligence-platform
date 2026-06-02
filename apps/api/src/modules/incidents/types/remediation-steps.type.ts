import { z } from 'zod';

export const remediationStepsSchema = z.array(z.string());

export type RemediationSteps = z.infer<typeof remediationStepsSchema>;
