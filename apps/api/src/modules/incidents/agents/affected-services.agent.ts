import { Injectable } from '@nestjs/common';
import { z } from 'zod';

import { LLMService } from '../../../infrastructure/llm/llm.service';

const affectedServicesSchema = z.array(z.string().min(1)).max(12);

@Injectable()
export class AffectedServicesAgent {
  constructor(private readonly llmService: LLMService) {}

  async identifyAffectedServices(logs: string): Promise<string[]> {
    const prompt = `
You are an enterprise service extraction agent.

Extract affected services/components explicitly named in the logs.

Rules:
- Return ONLY a valid JSON array of strings
- Include only service, component, host, queue, database, API, or dependency names present in logs
- Do not infer missing services
- If no services are named, return []
- No markdown

Logs:
${logs}
`;

    return this.llmService.generateJsonCompletion(
      prompt,
      affectedServicesSchema,
    );
  }
}
