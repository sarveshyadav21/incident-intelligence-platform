import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { AuditLogService } from './audit-log.service';

@Injectable()
export class AnalysisRunService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async createRun(input: {
    incidentId: string;
    jobId: string;
    status: string;
    snapshot: Record<string, unknown>;
    rootCause?: string | null;
    aiSummary?: string | null;
    remediationSteps?: unknown;
    confidenceScore?: number | null;
    aiSeverity?: string | null;
    similarIncidents?: Array<{
      targetIncidentId: string;
      targetTitle: string;
      similarity: number;
    }>;
  }) {
    const runCount = await this.prismaService.analysisRun.count({
      where: { incidentId: input.incidentId },
    });

    const run = await this.prismaService.analysisRun.create({
      data: {
        incidentId: input.incidentId,
        jobId: input.jobId,
        runNumber: runCount + 1,
        status: input.status,
        snapshot: input.snapshot as Prisma.InputJsonValue,
        rootCause: input.rootCause,
        aiSummary: input.aiSummary,
        remediationSteps: input.remediationSteps as Prisma.InputJsonValue,
        confidenceScore: input.confidenceScore,
        aiSeverity: input.aiSeverity,
        similarSnapshots: input.similarIncidents?.length
          ? {
              create: input.similarIncidents.map((similar) => ({
                sourceIncidentId: input.incidentId,
                targetIncidentId: similar.targetIncidentId,
                targetTitle: similar.targetTitle,
                similarity: similar.similarity,
              })),
            }
          : undefined,
      },
      include: {
        similarSnapshots: true,
        executiveSummary: true,
        postmortem: true,
        dependencyGraph: true,
      },
    });

    await this.auditLogService.log({
      action: 'ANALYSIS_RUN_CREATED',
      entityType: 'AnalysisRun',
      entityId: run.id,
      incidentId: input.incidentId,
      metadata: { jobId: input.jobId, runNumber: run.runNumber },
    });

    return run;
  }

  async listRuns(incidentId: string) {
    return this.prismaService.analysisRun.findMany({
      where: { incidentId },
      orderBy: { runNumber: 'desc' },
      include: {
        similarSnapshots: true,
        executiveSummary: true,
        postmortem: true,
        dependencyGraph: true,
      },
    });
  }

  async getRun(incidentId: string, runId: string) {
    const run = await this.prismaService.analysisRun.findFirst({
      where: { id: runId, incidentId },
      include: {
        similarSnapshots: true,
        executiveSummary: true,
        postmortem: true,
        dependencyGraph: true,
      },
    });

    if (!run) {
      throw new NotFoundException('Analysis run not found');
    }

    return run;
  }
}
