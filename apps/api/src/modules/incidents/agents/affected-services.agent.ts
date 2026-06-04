import { Injectable } from '@nestjs/common';
import { z } from 'zod';

import { LLMService } from '../../../infrastructure/llm/llm.service';
import { AGENT_MODELS } from '../../../config/agent-models.config';
const affectedServicesSchema = z.object({
  services: z.array(z.string().min(1)).max(12),
});
@Injectable()
export class AffectedServicesAgent {
  constructor(private readonly llmService: LLMService) {}

  async identifyAffectedServices(logs: string): Promise<string[]> {
    const prompt = `
You are an enterprise service extraction agent.

Extract affected services/components explicitly named in the logs.

Rules:
- Return ONLY valid JSON
- Return an object with a "services" array
- No markdown
- No explanation
- Do NOT include markdown
- Do NOT explain anything
- Include only services explicitly mentioned in logs
- If no services are mentioned, return []

Valid examples:
{
  "services": [
    "redis",
    "postgres",
    "api-gateway"
  ]
}

{
  "services": []
}
Logs:
${logs}
`;

    const response = await this.llmService.generateJsonCompletion(
      prompt,
      affectedServicesSchema,
      AGENT_MODELS.affectedServices,
    );

    return response.services;
  }
}
