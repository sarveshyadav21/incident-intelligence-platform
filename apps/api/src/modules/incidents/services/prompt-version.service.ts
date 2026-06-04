import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { AgentModelKey } from '../../../config/agent-models.config';
import { ModelRouterService } from './model-router.service';

const PROMPT_VERSION = 'v1.0.0';

@Injectable()
export class PromptVersionService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly modelRouterService: ModelRouterService,
  ) {}

  async recordPromptUsage(input: {
    agent: AgentModelKey;
    promptContent: string;
    jobId?: string;
    incidentId?: string;
  }) {
    const modelUsed = this.modelRouterService.resolveModel(input.agent);

    return this.prismaService.promptVersion.create({
      data: {
        agent: input.agent,
        promptVersion: PROMPT_VERSION,
        promptContent: input.promptContent.slice(0, 8000),
        modelUsed,
        jobId: input.jobId,
        incidentId: input.incidentId,
      },
    });
  }

  async listByAgent(agent: string) {
    return this.prismaService.promptVersion.findMany({
      where: { agent },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async compareVersions(agent: string, versionA: string, versionB: string) {
    const [a, b] = await Promise.all([
      this.prismaService.promptVersion.findFirst({
        where: { agent, promptVersion: versionA },
        orderBy: { createdAt: 'desc' },
      }),
      this.prismaService.promptVersion.findFirst({
        where: { agent, promptVersion: versionB },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return { versionA: a, versionB: b };
  }
}
