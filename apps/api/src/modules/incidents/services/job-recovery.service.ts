import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
@Injectable()
export class JobRecoveryService implements OnModuleInit {
  private readonly logger = new Logger(JobRecoveryService.name);

  constructor(
    @InjectQueue('incident-analysis')
    private readonly incidentQueue: Queue,
    private readonly prismaService: PrismaService,
  ) {}

  async onModuleInit() {
    await this.recoverStalledJobs();
  }

  async recoverStalledJobs() {
    const stalledJobs = await this.prismaService.incidentAnalysisJob.findMany({
      where: {
        status: { in: ['RUNNING', 'RETRYING', 'QUEUED'] },
      },
    });

    for (const mappedJob of stalledJobs) {
      const bullJob = await this.incidentQueue.getJob(mappedJob.bullmqJobId);

      if (!bullJob) {
        this.logger.warn(
          `Marking orphaned job ${mappedJob.trackingId} as FAILED`,
        );

        await this.prismaService.incidentAnalysisJob.update({
          where: { id: mappedJob.id },
          data: { status: 'FAILED' },
        });

        continue;
      }

      const state = await bullJob.getState();

      if (state === 'failed' && mappedJob.incidentId) {
        await this.prismaService.incidentAnalysisJob.update({
          where: { id: mappedJob.id },
          data: { status: 'FAILED' },
        });
      }
    }
  }
}
