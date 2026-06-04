export function extractJsonFromText(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);

  if (fenced?.[1]) {
    return fenced[1].trim();
  }

  const objectMatch = text.match(/\{[\s\S]*\}/);
  const arrayMatch = text.match(/\[[\s\S]*\]/);

  if (objectMatch) {
    return objectMatch[0];
  }

  if (arrayMatch) {
    return arrayMatch[0];
  }

  throw new Error('No valid JSON object found in AI response');
}
