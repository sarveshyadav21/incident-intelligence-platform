import { Processor, WorkerHost } from '@nestjs/bullmq';

import { Job } from 'bullmq';

import { IncidentsService } from '../incidents.service';

import { AnalyzeAndStoreIncidentDto } from '../dto/analyze-and-store-incident.dto';

import { IncidentsGateway } from '../../../infrastructure/websocket/incidents.gateway';

import { TimelineService } from '../timeline/incident-timeline.service';

import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

@Processor('incident-analysis')
export class IncidentAnalysisWorker extends WorkerHost {
  get workerOptions() {
    return {
      concurrency: 1,
    };
  }
  constructor(
    private readonly incidentsService: IncidentsService,
    private readonly timelineService: TimelineService,
    private readonly incidentsGateway: IncidentsGateway,
    private readonly prismaService: PrismaService,
  ) {
    super();
  }

  async process(job: Job<AnalyzeAndStoreIncidentDto>) {
    try {
      console.log(`Processing incident job: ${job.data.trackingId}`);

      this.incidentsGateway.emitJobProgress(
        job.data.trackingId,
        'JOB_STARTED',
        {
          incidentId: job.data.incidentId,
        },
      );

      await this.timelineService.logEvent({
        jobId: job.data.trackingId,

        incidentId: job.data.incidentId,

        stage: 'JOB_STARTED',
      });

      await this.prismaService.incident.update({
        where: {
          id: job.data.incidentId,
        },

        data: {
          status: 'PROCESSING',
        },
      });
      await this.timelineService.logEvent({
        jobId: job.data.trackingId,

        incidentId: job.data.incidentId,

        stage: 'AI_ANALYSIS_STARTED',
      });

      const result = await this.incidentsService.analyzeAndStoreIncident(
        job.data,
        job.data.trackingId,
      );

      await this.timelineService.logEvent({
        jobId: job.data.trackingId,

        incidentId: job.data.incidentId,

        stage: 'ROOT_CAUSE_IDENTIFIED',

        metadata: {
          confidenceScore: result.confidenceScore,
        },
      });
      await this.timelineService.logEvent({
        jobId: job.data.trackingId,

        incidentId: job.data.incidentId,

        stage: 'REMEDIATION_GENERATED',
      });
      this.incidentsGateway.emitIncidentCompleted(
        job.data.trackingId,
        result,
        job.data.incidentId,
      );
      await this.timelineService.logEvent({
        jobId: job.data.trackingId,

        incidentId: job.data.incidentId,

        stage: 'INCIDENT_RESOLVED',
      });

      return result;
    } catch (error) {
      await this.prismaService.incident.update({
        where: {
          id: job.data.incidentId,
        },

        data: {
          status: 'FAILED',
        },
      });

      await this.timelineService.logEvent({
        jobId: job.data.trackingId,

        incidentId: job.data.incidentId,

        stage: 'JOB_FAILED',

        metadata: {
          attempt: job.attemptsMade,

          maxAttempts: job.opts.attempts,

          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      this.incidentsGateway.emitJobProgress(job.data.trackingId, 'JOB_FAILED', {
        incidentId: job.data.incidentId,
      });

      throw error;
    }
  }
}
