import { ZodSchema } from 'zod';

export function parseJsonResponse<T>(
  response: string,
  schema: ZodSchema<T>,
): T {
  const extractedJson = response.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);

  if (!extractedJson) {
    throw new Error('No JSON structure found in AI response');
  }

  const parsed = JSON.parse(extractedJson[0]) as unknown;

  return schema.parse(parsed);
}
