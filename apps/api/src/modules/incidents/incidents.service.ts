import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { AnalyzeAndStoreIncidentDto } from './dto/analyze-and-store-incident.dto';
import { EmbeddingService } from '../../infrastructure/embeddings/embedding.service';
import { SimilaritySearchService } from './services/similarity-search.service';
import { IncidentsGateway } from '../../infrastructure/websocket/incidents.gateway';
import { TimelineService } from './timeline/incident-timeline.service';
import { IncidentAnalysisOrchestrator } from './orchestration/incident-analysis-orchestrator';
import { IncidentInputNormalizerService } from './services/incident-input-normalizer.service';
import { IncidentUploadService } from './services/incident-upload.service';
import { IncidentFeedbackService } from './services/incident-feedback.service';
@Injectable()
export class IncidentsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly embeddingService: EmbeddingService,
    private readonly similaritySearchService: SimilaritySearchService,
    private readonly incidentsGateway: IncidentsGateway,
    private readonly timelineService: TimelineService,
    private readonly incidentAnalysisOrchestrator: IncidentAnalysisOrchestrator,
    private readonly incidentInputNormalizerService: IncidentInputNormalizerService,
    private readonly incidentUploadService: IncidentUploadService,
    private readonly incidentFeedbackService: IncidentFeedbackService,
  ) {}

  async createIncident(createIncidentDto: CreateIncidentDto) {
    return this.prismaService.incident.create({
      data: {
        title: createIncidentDto.title,
        severity: createIncidentDto.severity,
        source: createIncidentDto.source,
        summary: createIncidentDto.summary,
        affectedServices: [],
      },
    });
  }

  async getAllIncidents() {
    return this.prismaService.incident.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async analyzeIncidentLogs(logs: unknown) {
    const inputProfile = this.incidentInputNormalizerService.normalize(logs);

    return this.incidentAnalysisOrchestrator.analyze({
      logs: inputProfile.normalizedLogs,
      similarIncidentCount: 0,
      similarityScores: [],
      inputProfile,
    });
  }

  async analyzeAndStoreIncident(
    analyzeDto: AnalyzeAndStoreIncidentDto,
    jobId?: string,
  ) {
    const inputProfile = this.incidentInputNormalizerService.normalize(
      analyzeDto.logs,
    );

    // STEP 1 — GENERATE EMBEDDING
    const embedding = await this.embeddingService.generateEmbedding(
      inputProfile.normalizedLogs,
    );

    this.incidentsGateway.emitJobProgress(jobId ?? '', 'EMBEDDING_GENERATED', {
      incidentId: analyzeDto.incidentId,
    });
    await this.timelineService.logEvent({
      jobId: jobId ?? '',
      stage: 'EMBEDDING_GENERATED',
      incidentId: analyzeDto.incidentId,
    });

    // STEP 2 — SIMILARITY SEARCH
    const similarIncidents =
      await this.similaritySearchService.findSimilarIncidents(embedding);

    const filteredIncidents = similarIncidents.filter(
      (incident) => incident.similarity > 0.8,
    );
    const similarityScores = filteredIncidents.map(
      (incident) => incident.similarity,
    );

    const historicalContext = filteredIncidents
      .map(
        (incident) => `
Title: ${incident.title}

Root Cause:
${incident.rootCause}

Remediation:
${JSON.stringify(incident.remediationSteps)}
`,
      )
      .join('\n---\n');

    this.incidentsGateway.emitJobProgress(
      jobId ?? '',
      'SIMILAR_INCIDENTS_RETRIEVED',
      {
        incidentId: analyzeDto.incidentId,
        data: {
          similarIncidentsCount: filteredIncidents.length,
        },
      },
    );
    await this.timelineService.logEvent({
      jobId: jobId ?? '',
      stage: 'SIMILAR_INCIDENTS_RETRIEVED',
      incidentId: analyzeDto.incidentId,
    });

    // STEP 3 — ORCHESTRATED AI ANALYSIS
    const orchestratedAnalysis =
      await this.incidentAnalysisOrchestrator.analyze({
        logs: inputProfile.normalizedLogs,
        historicalContext,
        humanFeedbackContext: analyzeDto.humanFeedbackContext,
        similarIncidentCount: filteredIncidents.length,
        similarityScores,
        inputProfile,
        streamContext:
          jobId && analyzeDto.incidentId
            ? { incidentId: analyzeDto.incidentId, jobId }
            : undefined,
      });

    this.incidentsGateway.emitJobProgress(jobId ?? '', 'AI_ANALYSIS_COMPLETED', {
      incidentId: analyzeDto.incidentId,
    });
    await this.timelineService.logEvent({
      jobId: jobId ?? '',
      stage: 'AI_ANALYSIS_COMPLETED',
      incidentId: analyzeDto.incidentId,
      metadata: {
        confidenceScore: orchestratedAnalysis.analysis.confidenceScore,
        hallucinationRisk: orchestratedAnalysis.review.hallucinationRisk,
        unsupportedClaims: orchestratedAnalysis.review.unsupportedClaims,
        inputProfile: orchestratedAnalysis.inputProfile,
        evidence: orchestratedAnalysis.evidence,
        situationJudgment: orchestratedAnalysis.situationJudgment,
      },
    });

    // STEP 4 — STORE INCIDENT
    const incident = await this.prismaService.incident.update({
      where: {
        id: analyzeDto.incidentId,
      },

      data: {
        aiSeverity: orchestratedAnalysis.analysis.severity,

        rootCause: orchestratedAnalysis.analysis.rootCause,

        remediationSteps: orchestratedAnalysis.analysis.remediationSteps,

        status: 'COMPLETED',
        confidenceScore: orchestratedAnalysis.analysis.confidenceScore,

        affectedServices: orchestratedAnalysis.analysis.affectedServices,

        aiSummary: orchestratedAnalysis.analysis.aiSummary,

        impactAssessment: orchestratedAnalysis.analysis.impactAssessment,

        detectionSource: orchestratedAnalysis.analysis.detectionSource,
      },
    });

    await this.prismaService.incidentEvaluation.create({
      data: {
        incidentId: incident.id,
        faithfulnessScore: orchestratedAnalysis.review.isEvidenceSupported
          ? 1
          : 0,
        hallucinationScore: this.mapHallucinationRiskToScore(
          orchestratedAnalysis.review.hallucinationRisk,
        ),
        accuracyScore: orchestratedAnalysis.analysis.confidenceScore / 100,
      },
    });

    this.incidentsGateway.emitJobProgress(jobId ?? '', 'INCIDENT_PERSISTED', {
      incidentId: analyzeDto.incidentId,
    });
    await this.timelineService.logEvent({
      jobId: jobId ?? '',
      stage: 'INCIDENT_PERSISTED',
      incidentId: analyzeDto.incidentId,
    });

    // STEP 5 — STORE EMBEDDING
    await this.prismaService.$executeRawUnsafe(
      `
      UPDATE incidents
      SET embedding = $1::vector
      WHERE id = $2
      `,
      `[${embedding.join(',')}]`,
      incident.id,
    );

    this.incidentsGateway.emitJobProgress(jobId ?? '', 'EMBEDDING_STORED', {
      incidentId: analyzeDto.incidentId,
    });
    await this.timelineService.logEvent({
      jobId: jobId ?? '',
      stage: 'EMBEDDING_STORED',
      incidentId: analyzeDto.incidentId,
    });

    return {
      ...incident,

      aiEvaluation: {
        confidenceScore: orchestratedAnalysis.analysis.confidenceScore,
        confidenceRationale: orchestratedAnalysis.confidenceRationale,
        hallucinationRisk: orchestratedAnalysis.review.hallucinationRisk,
        unsupportedClaims: orchestratedAnalysis.review.unsupportedClaims,
        missingEvidence: orchestratedAnalysis.review.missingEvidence,
        evidence: orchestratedAnalysis.evidence,
        situationJudgment: orchestratedAnalysis.situationJudgment,
        inputProfile: orchestratedAnalysis.inputProfile,
        retrievedIncidents: filteredIncidents.length,
      },
    };
  }
  async getIncidentTimeline(jobId: string) {
    return this.timelineService.getTimelineByJobId(jobId);
  }
  async getIncidentById(id: string) {
    return this.prismaService.incident.findUnique({
      where: {
        id,
      },

      include: {
        evaluations: true,

        timelineEvents: {
          orderBy: {
            createdAt: 'asc',
          },
        },

        hypotheses: true,

        uploads: true,

        feedback: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });
  }
  private async createTimelineEvent(
    incidentId: string,
    stage: string,
    metadata?: unknown,
  ) {
    return this.prismaService.incidentTimelineEvent.create({
      data: {
        incidentId,
        jobId: crypto.randomUUID(),

        stage,

        metadata:
          metadata !== undefined
            ? (metadata as Prisma.InputJsonValue)
            : undefined,
      },
    });
  }

  private mapHallucinationRiskToScore(risk: 'LOW' | 'MEDIUM' | 'HIGH') {
    if (risk === 'LOW') {
      return 0.1;
    }

    if (risk === 'MEDIUM') {
      return 0.5;
    }

    return 0.9;
  }
}
