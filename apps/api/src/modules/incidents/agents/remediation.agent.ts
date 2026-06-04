import { Injectable } from '@nestjs/common';

import { AGENT_MODELS } from '../../../config/agent-models.config';
import { LLMService } from '../../../infrastructure/llm/llm.service';

import {
  remediationStepsSchema,
  RemediationSteps,
} from '../types/remediation-steps.type';

@Injectable()
export class RemediationAgent {
  constructor(private readonly llmService: LLMService) {}

  async generateRemediationSteps(logs: string): Promise<RemediationSteps> {
    const prompt = `
You are an expert Site Reliability Engineer.

Generate remediation steps for the production incident.

Rules:
- Return ONLY valid JSON array
- No markdown
- No explanations
- No conversational text
- No trailing commas
- Keep remediation steps concise
- ONLY reference technologies explicitly mentioned in logs
- Do NOT invent infrastructure components

Example:
[
  "Rollback recent deployment",
  "Analyze API latency metrics"
]

Logs:
${logs}
`;
    return this.llmService.generateJsonCompletion<RemediationSteps>(
      prompt,
      remediationStepsSchema,
      AGENT_MODELS.remediation,
    );
  }
}
