import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

@Injectable()
export class AgentMetricsService {
  constructor(private readonly prismaService: PrismaService) {}

  estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  estimateCost(model: string, tokenCount: number): number {
    const ratePer1k =
      model.includes('phi3') ? 0.0001 : model.includes('mistral') ? 0.0003 : 0.0005;

    return Number(((tokenCount / 1000) * ratePer1k).toFixed(6));
  }

  async recordMetric(input: {
    incidentId: string;
    jobId: string;
    agent: string;
    model: string;
    durationMs: number;
    success: boolean;
    promptLength?: number;
    responseLength?: number;
  }) {
    const tokenCountEstimate =
      (input.promptLength ?? 0) + (input.responseLength ?? 0) > 0
        ? this.estimateTokens(
            'x'.repeat((input.promptLength ?? 0) + (input.responseLength ?? 0)),
          )
        : this.estimateTokens(input.agent);

    const costEstimate = this.estimateCost(input.model, tokenCountEstimate);

    return this.prismaService.agentRunMetric.create({
      data: {
        incidentId: input.incidentId,
        jobId: input.jobId,
        agent: input.agent,
        model: input.model,
        durationMs: input.durationMs,
        success: input.success,
        tokenCountEstimate,
        costEstimate,
      },
    });
  }

  async getAgentPerformance() {
    const metrics = await this.prismaService.agentRunMetric.findMany({
      orderBy: { createdAt: 'desc' },
      take: 500,
    });

    const byAgent = new Map<
      string,
      { totalMs: number; count: number; successes: number }
    >();

    for (const metric of metrics) {
      const current = byAgent.get(metric.agent) ?? {
        totalMs: 0,
        count: 0,
        successes: 0,
      };

      current.totalMs += metric.durationMs;
      current.count += 1;
      if (metric.success) {
        current.successes += 1;
      }

      byAgent.set(metric.agent, current);
    }

    return Array.from(byAgent.entries()).map(([agent, stats]) => ({
      agent,
      avgDurationMs: Math.round(stats.totalMs / stats.count),
      successRate: Number((stats.successes / stats.count).toFixed(2)),
      runCount: stats.count,
    }));
  }

  async getModelUsage() {
    const metrics = await this.prismaService.agentRunMetric.findMany({
      orderBy: { createdAt: 'desc' },
      take: 500,
    });

    const byModel = new Map<
      string,
      {
        totalMs: number;
        tokens: number;
        cost: number;
        count: number;
        successes: number;
      }
    >();

    for (const metric of metrics) {
      const current = byModel.get(metric.model) ?? {
        totalMs: 0,
        tokens: 0,
        cost: 0,
        count: 0,
        successes: 0,
      };

      current.totalMs += metric.durationMs;
      current.tokens += metric.tokenCountEstimate ?? 0;
      current.cost += metric.costEstimate ?? 0;
      current.count += 1;
      if (metric.success) {
        current.successes += 1;
      }

      byModel.set(metric.model, current);
    }

    return Array.from(byModel.entries()).map(([model, stats]) => ({
      model,
      avgExecutionMs: Math.round(stats.totalMs / stats.count),
      estimatedTokens: stats.tokens,
      estimatedCost: Number(stats.cost.toFixed(4)),
      successRate: Number((stats.successes / stats.count).toFixed(2)),
      runCount: stats.count,
    }));
  }
}
