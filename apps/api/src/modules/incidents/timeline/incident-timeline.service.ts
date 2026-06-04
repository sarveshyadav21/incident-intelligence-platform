import { Injectable } from '@nestjs/common';

import { Prisma, IncidentTimelineEvent } from '@prisma/client';

import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { IncidentsGateway } from '../../../infrastructure/websocket/incidents.gateway';

@Injectable()
export class TimelineService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly incidentsGateway: IncidentsGateway,
  ) {}

  async logEvent(params: {
    incidentId?: string;
    jobId: string;
    stage: string;
    metadata?: unknown;
  }): Promise<IncidentTimelineEvent> {
    const event = await this.prisma.incidentTimelineEvent.create({
      data: {
        incidentId: params.incidentId,
        jobId: params.jobId,
        stage: params.stage,
        metadata: params.metadata as Prisma.InputJsonValue,
      },
    });

    if (params.incidentId) {
      this.incidentsGateway.emitTimelineEvent(
        params.incidentId,
        params.jobId,
        {
          id: event.id,
          stage: event.stage,
          createdAt: event.createdAt,
          metadata: params.metadata,
        },
      );
    }

    return event;
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
