import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

@Injectable()
export class AdminQueueService {
  constructor(
    @InjectQueue('incident-analysis')
    private readonly incidentQueue: Queue,
    private readonly prismaService: PrismaService,
  ) {}

  async getQueueHealth() {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.incidentQueue.getWaitingCount(),
      this.incidentQueue.getActiveCount(),
      this.incidentQueue.getCompletedCount(),
      this.incidentQueue.getFailedCount(),
      this.incidentQueue.getDelayedCount(),
    ]);

    const dbJobs = await this.prismaService.incidentAnalysisJob.groupBy({
      by: ['status'],
      _count: { status: true },
    });

    const statusCounts = Object.fromEntries(
      dbJobs.map((row) => [row.status, row._count.status]),
    );

    return {
      bullmq: {
        queued: waiting + delayed,
        running: active,
        retrying: delayed,
        failed,
        completed,
      },
      database: statusCounts,
      health:
        failed > 10 ? 'degraded' : active > 5 ? 'busy' : 'healthy',
    };
  }

  async listRecentJobs(limit = 20) {
    const jobs = await this.prismaService.incidentAnalysisJob.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return Promise.all(
      jobs.map(async (mapped) => {
        const bullJob = await this.incidentQueue.getJob(mapped.bullmqJobId);
        const state = bullJob ? await bullJob.getState() : 'missing';

        return {
          ...mapped,
          bullmqState: state,
          attemptsMade: bullJob?.attemptsMade ?? 0,
        };
      }),
    );
  }
}
