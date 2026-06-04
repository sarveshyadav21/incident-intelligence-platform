import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectQueue } from '@nestjs/bullmq';

import { Queue } from 'bullmq';

import { v4 as uuidv4 } from 'uuid';

import { AnalyzeAndStoreIncidentDto } from '../dto/analyze-and-store-incident.dto';
import { JobStatusResponse } from '../types/job-status-response.type';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { TimelineService } from '../timeline/incident-timeline.service';
import { IncidentInputNormalizerService } from './incident-input-normalizer.service';
import { IncidentUploadService } from './incident-upload.service';
import { IncidentFeedbackService } from './incident-feedback.service';
import { IncidentsGateway } from '../../../infrastructure/websocket/incidents.gateway';

@Injectable()
export class IncidentQueueService {
  constructor(
    @InjectQueue('incident-analysis')
    private readonly incidentQueue: Queue,
    private readonly prismaService: PrismaService,
    private readonly timelineService: TimelineService,
    private readonly incidentInputNormalizerService: IncidentInputNormalizerService,
    private readonly incidentUploadService: IncidentUploadService,
    private readonly incidentFeedbackService: IncidentFeedbackService,
    private readonly incidentsGateway: IncidentsGateway,
  ) {}
  async enqueueIncidentAnalysis(dto: AnalyzeAndStoreIncidentDto) {
    const inputProfile = this.incidentInputNormalizerService.normalize(
      dto.logs,
    );

    const incident = await this.prismaService.incident.create({
      data: {
        title: dto.title,

        severity: dto.severity,

        summary: inputProfile.normalizedLogs,

        status: 'PENDING',
        affectedServices: [],
      },
    });

    const trackingId = uuidv4();
    await this.timelineService.logEvent({
      jobId: trackingId,

      incidentId: incident.id,

      stage: 'INCIDENT_CREATED',

      metadata: {
        severity: incident.severity,
        inputProfile,
      },
    });
    const job = await this.incidentQueue.add(
      'analyze-incident',
      {
        ...dto,
        trackingId,
        incidentId: incident.id,
      },
      {
        attempts: 3,

        backoff: {
          type: 'exponential',

          delay: 5000,
        },

        removeOnComplete: 100,

        removeOnFail: 50,
      },
    );
    await this.prismaService.incidentAnalysisJob.create({
      data: {
        trackingId,

        bullmqJobId: String(job.id),

        status: 'QUEUED',
      },
    });

    this.incidentsGateway.emitJobStatus(trackingId, 'QUEUED', incident.id);

    return {
      jobId: trackingId,
      incidentId: incident.id,
    };
  }

  async reanalyzeIncident(incidentId: string) {
    const incident = await this.prismaService.incident.findUnique({
      where: { id: incidentId },
    });

    if (!incident) {
      throw new NotFoundException('Incident not found');
    }

    const uploadText =
      await this.incidentUploadService.getCombinedUploadText(incidentId);
    const feedbackContext =
      await this.incidentFeedbackService.getFeedbackContext(incidentId);

    const combinedLogs = [incident.summary ?? '', uploadText]
      .filter(Boolean)
      .join('\n\n');

    if (combinedLogs.trim().length < 5) {
      throw new BadRequestException(
        'No logs or uploads available for re-analysis',
      );
    }

    await this.prismaService.incident.update({
      where: { id: incidentId },
      data: {
        status: 'PENDING',
        summary: combinedLogs,
      },
    });

    const trackingId = uuidv4();

    await this.timelineService.logEvent({
      jobId: trackingId,
      incidentId,
      stage: 'REANALYSIS_REQUESTED',
    });

    const job = await this.incidentQueue.add(
      'analyze-incident',
      {
        title: incident.title,
        severity: incident.severity,
        logs: combinedLogs,
        trackingId,
        incidentId,
        humanFeedbackContext: feedbackContext || undefined,
      },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    );

    await this.prismaService.incidentAnalysisJob.create({
      data: {
        trackingId,
        bullmqJobId: String(job.id),
        status: 'QUEUED',
      },
    });

    this.incidentsGateway.emitJobStatus(trackingId, 'QUEUED', incidentId);

    return {
      jobId: trackingId,
      incidentId,
    };
  }

  async getJobStatus(jobId: string): Promise<JobStatusResponse> {
    const mappedJob = await this.prismaService.incidentAnalysisJob.findUnique({
      where: {
        trackingId: jobId,
      },
    });

    if (!mappedJob) {
      return {
        jobId,

        status: 'NOT_FOUND',

        result: null,

        failedReason: null,
      };
    }

    const job = await this.incidentQueue.getJob(mappedJob.bullmqJobId);

    if (!job) {
      return {
        jobId,

        status: 'NOT_FOUND',

        result: null,

        failedReason: null,
      };
    }

    const state = await job.getState();

    return {
      jobId,
      status: mappedJob.status,
      bullmqState: state,
      result: (job.returnvalue as unknown) ?? null,
      failedReason: job.failedReason ?? null,
    };
  }
}
