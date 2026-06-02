export function extractJsonFromText(text: string): string {
  const jsonMatch = text.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    throw new Error('No valid JSON object found in AI response');
  }

  return jsonMatch[0];
}
