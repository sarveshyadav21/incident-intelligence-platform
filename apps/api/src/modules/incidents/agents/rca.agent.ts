import { Injectable } from '@nestjs/common';

import { validateRcaResponse } from '../../../common/utils/validate-rca.util';

import { LLMService } from '../../../infrastructure/llm/llm.service';

@Injectable()
export class RCAAgent {
  constructor(private readonly llmService: LLMService) {}

  async analyzeRootCause(
    logs: string,
    historicalContext?: string,
  ): Promise<string> {
    const prompt = `
You are a production incident analysis engine.

Analyze the logs and identify the most evidence-supported root cause.

Rules:
- Maximum 35 words
- No introductions
- No markdown
- No bullet points
- No conversational phrasing
- ONLY use evidence explicitly present in logs
- NEVER mention technologies not present in logs
- NEVER speculate about caching, databases, networking, Kubernetes, or infrastructure unless explicitly mentioned
- Prefer observable symptoms over inferred causes
- Use historical incidents only as supporting context
- If evidence is inconclusive, explicitly state uncertainty
- Return ONLY the root cause statement

Historical similar incidents:
${historicalContext ?? 'None'}

Logs:
${logs}
`;

    const response = await this.llmService.generateTextCompletion(prompt);

    const validatedResponse = validateRcaResponse(logs, response);

    return validatedResponse;
  }
}
