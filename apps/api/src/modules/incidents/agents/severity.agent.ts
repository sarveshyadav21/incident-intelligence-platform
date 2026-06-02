import { Injectable } from '@nestjs/common';

import { normalizeSeverity } from '../../../common/utils/normalize-severity.util';

import { LLMService } from '../../../infrastructure/llm/llm.service';

import { Severity, severitySchema } from '../types/severity.type';

@Injectable()
export class SeverityAgent {
  constructor(private readonly llmService: LLMService) {}

  async classifySeverity(logs: string): Promise<Severity> {
    const prompt = `
You are a production incident severity classifier.

Classify the incident severity.

Severity rubric:

LOW:
- Minimal impact
- No production degradation
- No user-visible impact

MEDIUM:
- Partial degradation
- Increased latency
- Limited operational impact

HIGH:
- Major degradation
- SLA violations
- Significant production instability

CRITICAL:
- Complete outage
- Security breach
- Severe business disruption
- Widespread production failure

Rules:
- Return ONLY one word
- Allowed values:
LOW
MEDIUM
HIGH
CRITICAL

Logs:
${logs}
`;

    const response = await this.llmService.generateTextCompletion(prompt);

    const normalizedSeverity = normalizeSeverity(response);

    return severitySchema.parse(normalizedSeverity);
  }
}
