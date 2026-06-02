const knownTechnologies = [
  'redis',
  'kubernetes',
  'postgres',
  'mysql',
  'kafka',
  'cache',
  'caching',
  'dns',
  'api gateway',
  'nginx',
  'load balancer',
  'mongodb',
];

export function validateRcaResponse(logs: string, response: string): string {
  const normalizedLogs = logs.toLowerCase();

  const normalizedResponse = response.toLowerCase();

  for (const tech of knownTechnologies) {
    const mentionedInLogs = normalizedLogs.includes(tech);

    const mentionedInResponse = normalizedResponse.includes(tech);

    if (mentionedInResponse && !mentionedInLogs) {
      return `
Potential application-level performance regression. Available logs do not provide sufficient evidence for infrastructure-level diagnosis.
`.trim();
    }
  }

  return response.trim();
}
