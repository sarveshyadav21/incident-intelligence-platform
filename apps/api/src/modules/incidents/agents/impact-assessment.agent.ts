import { Injectable } from '@nestjs/common';

import { LLMService } from '../../../infrastructure/llm/llm.service';

@Injectable()
export class ImpactAssessmentAgent {
  constructor(private readonly llmService: LLMService) {}

  async assessImpact(logs: string): Promise<string> {
    const prompt = `
You are an enterprise incident impact assessment agent.

Describe the operational impact using only evidence explicitly present in the logs.

Rules:
- Maximum 45 words
- No markdown
- No bullets
- No customer impact claims unless logs show user-facing failure, latency, errors, or outage
- Do not invent affected regions, teams, components, or business impact
- If impact is unclear, state what is observable and what is unknown
- Return ONLY the impact assessment sentence

Logs:
${logs}
`;

    const response = await this.llmService.generateTextCompletion(prompt);

    return response.trim();
  }
}
