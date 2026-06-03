import { Injectable } from '@nestjs/common';

import { LLMService } from '../../../infrastructure/llm/llm.service';
import {
  agentConfidenceSchema,
  AgentConfidence,
} from '../types/agent-confidence.type';
import { IncidentAnalysis } from '../types/incident-analysis.type';
import { IncidentEvidence } from '../types/evidence.type';
import { AGENT_MODELS } from '../../../config/agent-models.config';
@Injectable()
export class ConfidenceAgent {
  constructor(private readonly llmService: LLMService) {}

  async scoreConfidence(input: {
    logs: string;
    analysis: Omit<IncidentAnalysis, 'confidenceScore'>;
    similarIncidentCount: number;
    averageSimilarity: number | null;
    evidence?: IncidentEvidence[];
  }): Promise<AgentConfidence> {
    const prompt = `
You are an enterprise AI reliability scoring agent.

Score confidence in the proposed incident analysis.

Rules:
- Return ONLY valid JSON
- confidenceScore must be 0 to 100
- Score high only when claims are directly supported by logs
- Penalize inferred root causes, invented service names, vague impact, or missing evidence
- Similar incidents are supporting context only, never proof
- rationale must be one concise sentence

JSON schema:
{
  "confidenceScore": number,
  "rationale": string
}

Similar incident count: ${input.similarIncidentCount}
Average similarity: ${input.averageSimilarity ?? 'none'}

Proposed analysis:
${JSON.stringify(input.analysis)}

Extracted evidence:
${JSON.stringify(input.evidence ?? [])}

Logs:
${input.logs}
`;

    return this.llmService.generateJsonCompletion(
      prompt,
      agentConfidenceSchema,
      AGENT_MODELS.confidence,
    );
  }
}
