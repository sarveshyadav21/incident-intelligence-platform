import { Injectable } from '@nestjs/common';

import { AGENT_MODELS } from '../../../config/agent-models.config';
import { LLMService } from '../../../infrastructure/llm/llm.service';
import {
  incidentEvidenceListSchema,
  IncidentEvidence,
} from '../types/evidence.type';

@Injectable()
export class EvidenceExtractionAgent {
  constructor(private readonly llmService: LLMService) {}

  async extractEvidence(logs: string): Promise<IncidentEvidence[]> {
    const prompt = `
You are an enterprise incident evidence extraction agent.

Extract the strongest direct evidence from the input.

Rules:
- Return ONLY valid JSON array
- Each quote must be copied or tightly paraphrased from the logs
- Do not invent facts
- Prefer concrete errors, metrics, alerts, timestamps, affected components, and symptoms
- If evidence is weak, return the best available observable signals
- Maximum 12 items

JSON item schema:
{
  "quote": string,
  "signalType": "ERROR" | "LATENCY" | "OUTAGE" | "RESOURCE" | "SECURITY" | "DEPENDENCY" | "DEPLOYMENT" | "UNKNOWN",
  "interpretation": string
}

Logs:
${logs}
`;

    return this.llmService.generateJsonCompletion(
      prompt,
      incidentEvidenceListSchema,
      AGENT_MODELS.evidenceExtraction,
    );
  }
}
