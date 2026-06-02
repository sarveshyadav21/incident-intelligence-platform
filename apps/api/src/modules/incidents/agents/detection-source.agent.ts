import { Injectable } from '@nestjs/common';

import { LLMService } from '../../../infrastructure/llm/llm.service';

@Injectable()
export class DetectionSourceAgent {
  constructor(private readonly llmService: LLMService) {}

  async identifyDetectionSource(logs: string): Promise<string> {
    const prompt = `
You are an enterprise incident detection source classifier.

Identify the detection source visible in the logs.

Rules:
- Maximum 8 words
- No markdown
- No punctuation at the end
- Use only evidence from the logs
- Examples: "Application logs", "Prometheus alert", "Health check", "Synthetic monitor", "Unknown log source"
- If source is not explicit, return "Unknown log source"
- Return ONLY the detection source

Logs:
${logs}
`;

    const response = await this.llmService.generateTextCompletion(prompt);

    return response.trim();
  }
}
