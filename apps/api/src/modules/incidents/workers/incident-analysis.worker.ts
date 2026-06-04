import { Processor, WorkerHost } from '@nestjs/bullmq';

import { Job } from 'bullmq';

import { IncidentsService } from '../incidents.service';

import { AnalyzeAndStoreIncidentDto } from '../dto/analyze-and-store-incident.dto';

import { IncidentsGateway } from '../../../infrastructure/websocket/incidents.gateway';

import { TimelineService } from '../timeline/incident-timeline.service';

import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

import { INCIDENT_ANALYSIS_WORKER_OPTIONS } from '../../../config/queue.config';

@Processor('incident-analysis', INCIDENT_ANALYSIS_WORKER_OPTIONS)
export class IncidentAnalysisWorker extends WorkerHost {
  constructor(
    private readonly incidentsService: IncidentsService,
    private readonly timelineService: TimelineService,
    private readonly incidentsGateway: IncidentsGateway,
    private readonly prismaService: PrismaService,
  ) {
    super();
  }

  async process(job: Job<AnalyzeAndStoreIncidentDto>) {
    const { trackingId, incidentId } = job.data;

    try {
      console.log(`Processing incident job: ${trackingId}`);

      await this.setJobStatus(trackingId, 'RUNNING', incidentId);

      this.incidentsGateway.emitJobProgress(trackingId, 'JOB_STARTED', {
        incidentId,
      });

      await this.timelineService.logEvent({
        jobId: trackingId,
        incidentId,
        stage: 'JOB_STARTED',
      });

      await this.prismaService.incident.update({
        where: { id: incidentId },
        data: { status: 'PROCESSING' },
      });

      await this.timelineService.logEvent({
        jobId: trackingId,
        incidentId,
        stage: 'AI_ANALYSIS_STARTED',
      });

      const result = await this.incidentsService.analyzeAndStoreIncident(
        job.data,
        trackingId,
      );

      await this.timelineService.logEvent({
        jobId: trackingId,
        incidentId,
        stage: 'ROOT_CAUSE_IDENTIFIED',
        metadata: {
          confidenceScore: result.confidenceScore,
        },
      });

      await this.timelineService.logEvent({
        jobId: trackingId,
        incidentId,
        stage: 'REMEDIATION_GENERATED',
      });

      await this.setJobStatus(trackingId, 'COMPLETED', incidentId);

      this.incidentsGateway.emitIncidentCompleted(
        trackingId,
        result,
        incidentId,
      );

      await this.timelineService.logEvent({
        jobId: trackingId,
        incidentId,
        stage: 'INCIDENT_RESOLVED',
      });

      return result;
    } catch (error) {
      const maxAttempts = job.opts.attempts ?? 1;

      const isFinalAttempt = job.attemptsMade + 1 >= maxAttempts;

      if (isFinalAttempt) {
        await this.prismaService.incident.update({
          where: { id: incidentId },
          data: { status: 'FAILED' },
        });

        await this.setJobStatus(trackingId, 'FAILED', incidentId);
      } else {
        await this.setJobStatus(trackingId, 'RETRYING', incidentId);
      }

      const attemptNumber = job.attemptsMade + 1;

      await this.prismaService.incidentAnalysisJob.updateMany({
        where: { trackingId },
        data: { attemptCount: attemptNumber },
      });

      await this.timelineService.logEvent({
        jobId: trackingId,
        incidentId,
        stage: isFinalAttempt ? 'JOB_FAILED' : 'JOB_RETRYING',
        metadata: {
          attempt: attemptNumber,
          maxAttempts,
          succeeded: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      if (!isFinalAttempt) {
        await this.timelineService.logEvent({
          jobId: trackingId,
          incidentId,
          stage: 'JOB_RETRY_SCHEDULED',
          metadata: {
            nextAttempt: attemptNumber + 1,
            maxAttempts,
          },
        });
      }

      throw error;
    }
  }

  private async setJobStatus(
    trackingId: string,
    status: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'RETRYING',
    incidentId: string,
  ) {
    await this.prismaService.incidentAnalysisJob.updateMany({
      where: { trackingId },
      data: { status },
    });

    this.incidentsGateway.emitJobStatus(trackingId, status, incidentId);
  }
}
