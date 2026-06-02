import { Injectable } from '@nestjs/common';

import { LLMService } from '../../../infrastructure/llm/llm.service';
import { IncidentAnalysis } from '../types/incident-analysis.type';
import {
  evidenceReviewSchema,
  EvidenceReview,
} from '../types/evidence-review.type';
import { IncidentEvidence } from '../types/evidence.type';
import { SituationJudgment } from '../types/situation-judgment.type';

@Injectable()
export class EvidenceReviewAgent {
  constructor(private readonly llmService: LLMService) {}

  async reviewAnalysis(input: {
    logs: string;
    analysis: IncidentAnalysis;
    evidence: IncidentEvidence[];
    situationJudgment: SituationJudgment;
  }): Promise<EvidenceReview> {
    const prompt = `
You are an adversarial enterprise AI incident review agent.

Your job is to question the analysis and find unsupported claims.

Rules:
- Compare every claim against the logs
- Treat missing evidence as a reliability risk
- Do not be generous
- Return ONLY valid JSON
- confidenceAdjustment must be between -50 and 10
- Use negative adjustment for unsupported root cause, invented services, invented impact, or weak remediation

JSON schema:
{
  "isEvidenceSupported": boolean,
  "hallucinationRisk": "LOW" | "MEDIUM" | "HIGH",
  "unsupportedClaims": string[],
  "missingEvidence": string[],
  "confidenceAdjustment": number,
  "reviewerNotes": string
}

Analysis:
${JSON.stringify(input.analysis)}

Extracted evidence:
${JSON.stringify(input.evidence)}

Situation judgment:
${JSON.stringify(input.situationJudgment)}

Logs:
${input.logs}
`;

    return this.llmService.generateJsonCompletion(prompt, evidenceReviewSchema);
  }
}
