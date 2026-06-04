import { Injectable } from '@nestjs/common';

import {
  AGENT_MODELS,
  AgentModelKey,
} from '../../../config/agent-models.config';

export type TaskComplexity = 'light' | 'medium' | 'heavy';

const COMPLEXITY_BY_AGENT: Record<AgentModelKey, TaskComplexity> = {
  severity: 'light',
  detectionSource: 'light',
  affectedServices: 'light',
  summary: 'light',
  evidenceExtraction: 'light',
  impactAssessment: 'medium',
  confidence: 'medium',
  remediation: 'heavy',
  rca: 'heavy',
  evidenceReview: 'heavy',
  situationJudge: 'heavy',
};

@Injectable()
export class ModelRouterService {
  resolveModel(agent: AgentModelKey): string {
    return AGENT_MODELS[agent];
  }

  resolveComplexity(agent: AgentModelKey): TaskComplexity {
    return COMPLEXITY_BY_AGENT[agent];
  }

  getRoutingTable(): Array<{
    agent: AgentModelKey;
    model: string;
    complexity: TaskComplexity;
  }> {
    return (Object.keys(AGENT_MODELS) as AgentModelKey[]).map((agent) => ({
      agent,
      model: AGENT_MODELS[agent],
      complexity: COMPLEXITY_BY_AGENT[agent],
    }));
  }
}
