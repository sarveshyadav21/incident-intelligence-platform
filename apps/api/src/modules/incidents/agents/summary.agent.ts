import { Injectable } from '@nestjs/common';

import { LLMService } from '../../../infrastructure/llm/llm.service';
import { IncidentsGateway } from '../../../infrastructure/websocket/incidents.gateway';

type StreamContext = {
  incidentId: string;
  jobId: string;
};

@Injectable()
export class SummaryAgent {
  constructor(
    private readonly llmService: LLMService,
    private readonly incidentsGateway: IncidentsGateway,
  ) {}

  private buildPrompt(logs: string): string {
    return `
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
  }

  async generateSummary(logs: string, streamContext?: StreamContext): Promise<string> {
    const prompt = this.buildPrompt(logs);

    if (streamContext) {
      const summary = await this.llmService.generateTextCompletionStream(
        prompt,
        (token) => {
          this.incidentsGateway.emitAgentToken(
            streamContext.incidentId,
            streamContext.jobId,
            'summary',
            token,
          );
        },
      );

      this.incidentsGateway.emitAgentComplete(
        streamContext.incidentId,
        streamContext.jobId,
        'summary',
        summary,
      );

      return summary;
    }

    const response = await this.llmService.generateTextCompletion(prompt);

    return response.trim();
  }
}
