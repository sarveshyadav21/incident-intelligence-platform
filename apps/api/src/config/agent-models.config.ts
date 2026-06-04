/**
 * Per-agent Ollama model routing.
 * Fast agents use lightweight models; heavy reasoning uses larger models.
 */
export const AGENT_MODELS = {
  severity: 'phi3:mini',
  detectionSource: 'phi3:mini',
  affectedServices: 'phi3:mini',
  summary: 'phi3:mini',
  evidenceExtraction: 'phi3:mini',
  impactAssessment: 'mistral:7b',
  remediation: 'llama3:8b',
  rca: 'llama3:8b',
  confidence: 'mistral:7b',
  evidenceReview: 'llama3:8b',
  situationJudge: 'llama3:8b',
} as const;

export type AgentModelKey = keyof typeof AGENT_MODELS;
