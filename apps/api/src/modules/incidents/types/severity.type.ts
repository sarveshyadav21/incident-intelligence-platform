import { z } from 'zod';

export const severitySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);

export type Severity = z.infer<typeof severitySchema>;
