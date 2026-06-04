import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@Injectable()
export class IncidentsAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getIncidentTrends(userId: string) {
    const incidents = await this.prisma.incident.findMany({
      where: { userId },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const buckets: Record<
      string,
      {
        time: string;

        CRITICAL: number;
        HIGH: number;
        MEDIUM: number;
        LOW: number;
      }
    > = {};

    for (let hour = 0; hour < 24; hour++) {
      const key = `${hour.toString().padStart(2, '0')}:00`;

      buckets[key] = {
        time: key,

        CRITICAL: 0,
        HIGH: 0,
        MEDIUM: 0,
        LOW: 0,
      };
    }

    incidents.forEach((incident) => {
      const hour = new Date(incident.createdAt)
        .getHours()
        .toString()
        .padStart(2, '0');

      const key = `${hour}:00`;

      const severityBucket =
        incident.status === 'COMPLETED' && incident.aiSeverity
          ? incident.aiSeverity
          : incident.severity;

      if (
        severityBucket === 'CRITICAL' ||
        severityBucket === 'HIGH' ||
        severityBucket === 'MEDIUM' ||
        severityBucket === 'LOW'
      ) {
        buckets[key][severityBucket] += 1;
      }
    });

    return Object.values(buckets);
  }
}
