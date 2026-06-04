import { Injectable } from '@nestjs/common';
import { z } from 'zod';

import { AGENT_MODELS } from '../../../config/agent-models.config';
import { LLMService } from '../../../infrastructure/llm/llm.service';

const graphSchema = z.object({
  nodes: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      type: z.enum(['infrastructure', 'service', 'impact']),
    }),
  ),
  edges: z.array(
    z.object({
      id: z.string(),
      source: z.string(),
      target: z.string(),
      label: z.string().optional(),
    }),
  ),
});

export type DependencyGraphResult = z.infer<typeof graphSchema>;

@Injectable()
export class DependencyGraphAgent {
  constructor(private readonly llmService: LLMService) {}

  async generate(input: {
    logs: string;
    affectedServices: string[];
    rootCause: string;
    impactAssessment: string;
  }): Promise<DependencyGraphResult> {
    const prompt = `
Build an incident dependency graph from the evidence.

Return ONLY JSON:
{
  "nodes": [{ "id": "redis", "label": "Redis", "type": "infrastructure|service|impact" }],
  "edges": [{ "id": "e1", "source": "redis", "target": "api", "label": "depends on" }]
}

Rules:
- 4-8 nodes maximum
- Flow from infrastructure → services → customer impact
- Only include systems mentioned or strongly implied in logs
- Customer impact node should be type "impact"

Affected services: ${input.affectedServices.join(', ')}
Root cause: ${input.rootCause}
Impact: ${input.impactAssessment}
Logs excerpt:
${input.logs.slice(0, 3000)}
`;

    return this.llmService.generateJsonCompletion(
      prompt,
      graphSchema,
      AGENT_MODELS.affectedServices,
    );
  }
}
