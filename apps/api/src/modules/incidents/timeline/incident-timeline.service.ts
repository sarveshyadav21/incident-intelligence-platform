import { Injectable } from '@nestjs/common';

import { Prisma, IncidentTimelineEvent } from '@prisma/client';

import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

@Injectable()
export class TimelineService {
  constructor(private readonly prisma: PrismaService) {}

  logEvent(params: {
    incidentId?: string;
    jobId: string;
    stage: string;
    metadata?: unknown;
  }): Promise<IncidentTimelineEvent> {
    const timelineDelegate: Prisma.IncidentTimelineEventDelegate =
      this.prisma.incidentTimelineEvent;

    return timelineDelegate.create({
      data: {
        incidentId: params.incidentId,

        jobId: params.jobId,

        stage: params.stage,

        metadata: params.metadata as Prisma.InputJsonValue,
      },
    });
  }

  async getTimelineByJobId(jobId: string) {
    return this.prisma.incidentTimelineEvent.findMany({
      where: {
        jobId,
      },

      orderBy: {
        createdAt: 'asc',
      },
    });
  }
}
