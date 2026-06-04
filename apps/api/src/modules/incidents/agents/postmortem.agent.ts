import { Injectable } from '@nestjs/common';
import { z } from 'zod';

import { AGENT_MODELS } from '../../../config/agent-models.config';
import { LLMService } from '../../../infrastructure/llm/llm.service';

const postmortemSchema = z.object({
  incidentSummary: z.string(),
  timeline: z.string(),
  rootCause: z.string(),
  impactAnalysis: z.string(),
  resolution: z.string(),
  recommendations: z.string(),
  lessonsLearned: z.string(),
  followUpActions: z.string(),
});

export type PostmortemSections = z.infer<typeof postmortemSchema>;

@Injectable()
export class PostmortemAgent {
  constructor(private readonly llmService: LLMService) {}

  async generate(input: {
    title: string;
    severity: string;
    timelineText: string;
    aiSummary: string;
    rootCause: string;
    impactAssessment: string;
    remediationSteps: string[];
  }): Promise<{ sections: PostmortemSections; markdown: string }> {
    const prompt = `
Generate a complete incident postmortem as JSON with keys:
incidentSummary, timeline, rootCause, impactAnalysis, resolution, recommendations, lessonsLearned, followUpActions

No markdown in JSON values. Use plain text paragraphs.

Title: ${input.title}
Severity: ${input.severity}
Timeline events:
${input.timelineText}
Summary: ${input.aiSummary}
Root cause: ${input.rootCause}
Impact: ${input.impactAssessment}
Remediation: ${input.remediationSteps.join('; ')}
`;

    const sections = await this.llmService.generateJsonCompletion(
      prompt,
      postmortemSchema,
      AGENT_MODELS.rca,
    );

    const markdown = this.toMarkdown(input.title, sections);

    return { sections, markdown };
  }

  private toMarkdown(title: string, sections: PostmortemSections): string {
    return `# Postmortem: ${title}

## Incident Summary
${sections.incidentSummary}

## Timeline
${sections.timeline}

## Root Cause
${sections.rootCause}

## Impact Analysis
${sections.impactAnalysis}

## Resolution
${sections.resolution}

## Recommendations
${sections.recommendations}

## Lessons Learned
${sections.lessonsLearned}

## Follow-Up Actions
${sections.followUpActions}
`;
  }
}
