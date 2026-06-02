import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),

  PORT: z.coerce.number().default(4000),

  DATABASE_URL: z.string().min(1),

  REDIS_URL: z.string().min(1),

  OPENAI_API_KEY: z.string().optional(),

  ANTHROPIC_API_KEY: z.string().optional(),
});

export type EnvironmentVariables = z.infer<typeof envSchema>;

export const validateEnvironment = (
  config: Record<string, unknown>,
): EnvironmentVariables => {
  return envSchema.parse(config);
};
