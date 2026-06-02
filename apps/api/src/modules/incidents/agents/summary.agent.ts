import { Injectable } from '@nestjs/common';

import { LLMService } from '../../../infrastructure/llm/llm.service';

@Injectable()
export class SummaryAgent {
  constructor(private readonly llmService: LLMService) {}

  async generateSummary(logs: string): Promise<string> {
    const prompt = `
You are an enterprise SRE incident summarization agent.

Summarize the incident using only evidence explicitly present in the logs.

Rules:
- Maximum 45 words
- No markdown
- No bullets
- No speculation
- Do not name systems, services, or causes unless they appear in the logs
- If evidence is incomplete, include that uncertainty
- Return ONLY the summary sentence

Logs:
${logs}
`;

    const response = await this.llmService.generateTextCompletion(prompt);

    return response.trim();
  }
}
