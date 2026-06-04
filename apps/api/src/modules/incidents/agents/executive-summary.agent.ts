import { Injectable } from '@nestjs/common';
import { z } from 'zod';

import { AGENT_MODELS } from '../../../config/agent-models.config';
import { LLMService } from '../../../infrastructure/llm/llm.service';

const executiveSummarySchema = z.object({
  overview: z.string(),
  customerImpact: z.string(),
  rootCause: z.string(),
  actionsTaken: z.string(),
  followUps: z.string(),
});

export type ExecutiveSummaryResult = z.infer<typeof executiveSummarySchema>;

@Injectable()
export class ExecutiveSummaryAgent {
  constructor(private readonly llmService: LLMService) {}

  async generate(input: {
    title: string;
    severity: string;
    aiSummary: string;
    rootCause: string;
    impactAssessment: string;
    remediationSteps: string[];
    affectedServices: string[];
  }): Promise<ExecutiveSummaryResult> {
    const prompt = `
You are writing an executive incident summary for engineering leadership.

Return ONLY valid JSON with these keys:
overview, customerImpact, rootCause, actionsTaken, followUps

Keep each section concise (2-4 sentences). No markdown.

Incident title: ${input.title}
Severity: ${input.severity}
Affected services: ${input.affectedServices.join(', ') || 'Unknown'}
Summary: ${input.aiSummary}
Root cause: ${input.rootCause}
Impact: ${input.impactAssessment}
Remediation: ${input.remediationSteps.join('; ')}
`;

    return this.llmService.generateJsonCompletion(
      prompt,
      executiveSummarySchema,
      AGENT_MODELS.rca,
    );
  }
}
