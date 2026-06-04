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
import { AnalysisRunService } from './services/analysis-run.service';
import { IncidentReportingService } from './services/incident-reporting.service';
import { AuditLogService } from './services/audit-log.service';

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
    private readonly analysisRunService: AnalysisRunService,
    private readonly incidentReportingService: IncidentReportingService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async createIncident(createIncidentDto: CreateIncidentDto) {
    const incident = await this.prismaService.incident.create({
      data: {
        title: createIncidentDto.title,
        severity: createIncidentDto.severity,
        source: createIncidentDto.source,
        summary: createIncidentDto.summary,
        affectedServices: [],
      },
    });

    await this.auditLogService.log({
      action: 'INCIDENT_CREATED',
      entityType: 'Incident',
      entityId: incident.id,
      incidentId: incident.id,
    });

    return incident;
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

    const similarIncidents =
      await this.similaritySearchService.findSimilarIncidents(
        embedding,
        analyzeDto.incidentId,
        5,
      );

    const filteredIncidents = similarIncidents.filter(
      (incident) => incident.similarity > 0.65,
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
          similarIncidents: filteredIncidents.map((item) => ({
            id: item.id,
            title: item.title,
            similarity: item.similarity,
          })),
        },
      },
    );
    await this.timelineService.logEvent({
      jobId: jobId ?? '',
      stage: 'SIMILAR_INCIDENTS_RETRIEVED',
      incidentId: analyzeDto.incidentId,
      metadata: {
        similarIncidents: filteredIncidents.map((item) => ({
          id: item.id,
          title: item.title,
          similarity: item.similarity,
        })),
      },
    });

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

    this.incidentsGateway.emitJobProgress(
      jobId ?? '',
      'AI_ANALYSIS_COMPLETED',
      {
        incidentId: analyzeDto.incidentId,
        data: {
          partialFailures: orchestratedAnalysis.partialFailures,
        },
      },
    );
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
        partialFailures: orchestratedAnalysis.partialFailures,
      },
    });

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

    const analysisRun = await this.analysisRunService.createRun({
      incidentId: incident.id,
      jobId: jobId ?? '',
      status: 'COMPLETED',
      snapshot: {
        analysis: orchestratedAnalysis.analysis,
        review: orchestratedAnalysis.review,
        evidence: orchestratedAnalysis.evidence,
        situationJudgment: orchestratedAnalysis.situationJudgment,
        partialFailures: orchestratedAnalysis.partialFailures,
      },
      rootCause: orchestratedAnalysis.analysis.rootCause,
      aiSummary: orchestratedAnalysis.analysis.aiSummary,
      remediationSteps: orchestratedAnalysis.analysis.remediationSteps,
      confidenceScore: orchestratedAnalysis.analysis.confidenceScore,
      aiSeverity: orchestratedAnalysis.analysis.severity,
      similarIncidents: filteredIncidents.map((item) => ({
        targetIncidentId: item.id,
        targetTitle: item.title,
        similarity: item.similarity,
      })),
    });

    await this.incidentReportingService.generateReportsForIncident(
      incident.id,
      analysisRun.id,
      jobId,
    );

    return {
      ...incident,
      analysisRunId: analysisRun.id,
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
        similarIncidents: filteredIncidents.map((item) => ({
          id: item.id,
          title: item.title,
          similarity: Number((item.similarity * 100).toFixed(0)),
        })),
        partialFailures: orchestratedAnalysis.partialFailures,
      },
    };
  }

  async getIncidentTimeline(jobId: string) {
    return this.timelineService.getTimelineByJobId(jobId);
  }

  async getRetryHistory(incidentId: string) {
    const events = await this.prismaService.incidentTimelineEvent.findMany({
      where: {
        incidentId,
        stage: { in: ['JOB_RETRYING', 'JOB_FAILED', 'JOB_STARTED'] },
      },
      orderBy: { createdAt: 'asc' },
    });

    return events.map((event) => ({
      id: event.id,
      stage: event.stage,
      createdAt: event.createdAt,
      metadata: event.metadata,
    }));
  }

  async getIncidentById(id: string) {
    const incident = await this.prismaService.incident.findUnique({
      where: { id },
      include: {
        evaluations: true,
        timelineEvents: {
          orderBy: { createdAt: 'asc' },
        },
        hypotheses: true,
        uploads: true,
        feedback: {
          orderBy: { createdAt: 'desc' },
        },
        analysisRuns: {
          orderBy: { runNumber: 'desc' },
          include: {
            similarSnapshots: true,
            executiveSummary: true,
            postmortem: true,
            dependencyGraph: true,
          },
        },
      },
    });

    if (!incident) {
      return null;
    }

    const [executiveSummary, postmortem, dependencyGraph] = await Promise.all([
      this.incidentReportingService.getExecutiveSummary(id),
      this.incidentReportingService.getPostmortem(id),
      this.incidentReportingService.getDependencyGraph(id),
    ]);

    return {
      ...incident,
      executiveSummary,
      postmortem,
      dependencyGraph,
    };
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
