import { ZodSchema } from 'zod';

import { extractJsonFromText } from './json-parser.util';

function stripMarkdownFences(text: string): string {
  return text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}

function repairJsonText(text: string): string {
  let repaired = stripMarkdownFences(text);

  repaired = repaired.replace(/,\s*([}\]])/g, '$1');
  repaired = repaired.replace(/([{,]\s*)(\w+)\s*:/g, '$1"$2":');
  repaired = repaired.replace(/'/g, '"');

  return repaired;
}

export function parseJsonResponse<T>(
  response: string,
  schema: ZodSchema<T>,
): T {
  const candidates = [
    response,
    stripMarkdownFences(response),
    extractJsonFromText(response),
    repairJsonText(response),
    repairJsonText(extractJsonFromText(response)),
  ];

  let lastError: unknown;

  for (const candidate of candidates) {
    try {
      const extracted = candidate.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);

      if (!extracted) {
        continue;
      }

      const parsed = JSON.parse(extracted[0]) as unknown;
      return schema.parse(parsed);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('No JSON structure found in AI response');
}
