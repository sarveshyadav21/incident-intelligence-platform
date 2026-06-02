import { z } from 'zod';

export const incidentInputProfileSchema = z.object({
  inputType: z.enum(['plain_text', 'json', 'json_array', 'unknown']),
  normalizedLogs: z.string().min(1),
  observedSignals: z.array(z.string()),
  warnings: z.array(z.string()),
});

export type IncidentInputProfile = z.infer<typeof incidentInputProfileSchema>;
