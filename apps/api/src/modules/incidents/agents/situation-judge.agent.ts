import { Injectable } from '@nestjs/common';

import { LLMService } from '../../../infrastructure/llm/llm.service';
import { IncidentAnalysis } from '../types/incident-analysis.type';
import { IncidentEvidence } from '../types/evidence.type';
import {
  situationJudgmentSchema,
  SituationJudgment,
} from '../types/situation-judgment.type';

@Injectable()
export class SituationJudgeAgent {
  constructor(private readonly llmService: LLMService) {}

  async judgeSituation(input: {
    logs: string;
    analysis: IncidentAnalysis;
    evidence: IncidentEvidence[];
  }): Promise<SituationJudgment> {
    const prompt = `
You are an enterprise incident commander AI.

Judge the operational situation from the logs, evidence, and proposed analysis.

Rules:
- Return ONLY valid JSON
- Be conservative when evidence is incomplete
- Escalate immediately for critical outage, security risk, data loss risk, or system-wide blast radius
- Do not claim customer impact unless logs show user-visible errors, latency, failed requests, outage, or degraded service
- rationale must be concise and evidence-based

JSON schema:
{
  "urgency": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "escalationRequired": boolean,
  "customerImpactLikely": boolean,
  "securityRisk": "NONE_DETECTED" | "POSSIBLE" | "LIKELY",
  "dataLossRisk": "NONE_DETECTED" | "POSSIBLE" | "LIKELY",
  "blastRadius": "UNKNOWN" | "SINGLE_SERVICE" | "MULTI_SERVICE" | "SYSTEM_WIDE",
  "recommendedResponseMode": "MONITOR" | "INVESTIGATE" | "MITIGATE_NOW" | "ESCALATE_IMMEDIATELY",
  "rationale": string
}

Evidence:
${JSON.stringify(input.evidence)}

Analysis:
${JSON.stringify(input.analysis)}

Logs:
${input.logs}
`;

    return this.llmService.generateJsonCompletion(
      prompt,
      situationJudgmentSchema,
    );
  }
}
