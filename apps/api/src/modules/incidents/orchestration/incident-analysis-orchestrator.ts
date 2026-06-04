import { Injectable, Logger } from '@nestjs/common';

import {
  incidentAnalysisSchema,
  IncidentAnalysis,
} from '../types/incident-analysis.type';
import { EvidenceReview } from '../types/evidence-review.type';
import { SeverityAgent } from '../agents/severity.agent';
import { RCAAgent } from '../agents/rca.agent';
import { RemediationAgent } from '../agents/remediation.agent';
import { SummaryAgent } from '../agents/summary.agent';
import { ImpactAssessmentAgent } from '../agents/impact-assessment.agent';
import { AffectedServicesAgent } from '../agents/affected-services.agent';
import { DetectionSourceAgent } from '../agents/detection-source.agent';
import { ConfidenceAgent } from '../agents/confidence.agent';
import { EvidenceReviewAgent } from '../agents/evidence-review.agent';
import { EvidenceExtractionAgent } from '../agents/evidence-extraction.agent';
import { SituationJudgeAgent } from '../agents/situation-judge.agent';
import { IncidentEvidence } from '../types/evidence.type';
import { SituationJudgment } from '../types/situation-judgment.type';
import { IncidentInputProfile } from '../types/input-profile.type';
import { IncidentsGateway } from '../../../infrastructure/websocket/incidents.gateway';
import { AgentModelKey } from '../../../config/agent-models.config';
import { ModelRouterService } from '../services/model-router.service';
import { AgentMetricsService } from '../services/agent-metrics.service';
import { PromptVersionService } from '../services/prompt-version.service';

export type OrchestratedIncidentAnalysis = {
  analysis: IncidentAnalysis;
  review: EvidenceReview;
  evidence: IncidentEvidence[];
  situationJudgment: SituationJudgment;
  confidenceRationale: string;
  inputProfile?: IncidentInputProfile;
  partialFailures: string[];
};

@Injectable()
export class IncidentAnalysisOrchestrator {
  private readonly logger = new Logger(IncidentAnalysisOrchestrator.name);

  constructor(
    private readonly severityAgent: SeverityAgent,
    private readonly rcaAgent: RCAAgent,
    private readonly remediationAgent: RemediationAgent,
    private readonly summaryAgent: SummaryAgent,
    private readonly impactAssessmentAgent: ImpactAssessmentAgent,
    private readonly affectedServicesAgent: AffectedServicesAgent,
    private readonly detectionSourceAgent: DetectionSourceAgent,
    private readonly confidenceAgent: ConfidenceAgent,
    private readonly evidenceReviewAgent: EvidenceReviewAgent,
    private readonly evidenceExtractionAgent: EvidenceExtractionAgent,
    private readonly situationJudgeAgent: SituationJudgeAgent,
    private readonly incidentsGateway: IncidentsGateway,
    private readonly modelRouterService: ModelRouterService,
    private readonly agentMetricsService: AgentMetricsService,
    private readonly promptVersionService: PromptVersionService,
  ) {}

  async analyze(input: {
    logs: string;
    historicalContext?: string;
    humanFeedbackContext?: string;
    similarIncidentCount: number;
    similarityScores: number[];
    inputProfile?: IncidentInputProfile;
    streamContext?: { incidentId: string; jobId: string };
  }): Promise<OrchestratedIncidentAnalysis> {
    const enrichedLogs = input.humanFeedbackContext
      ? `${input.logs}\n\n--- Human corrections ---\n${input.humanFeedbackContext}`
      : input.logs;

    const incidentId = input.streamContext?.incidentId ?? 'unknown';
    const jobId = input.streamContext?.jobId ?? '';
    const partialFailures: string[] = [];

    const emitStage = (stage: string) => {
      if (jobId) {
        this.incidentsGateway.emitJobProgress(jobId, stage, { incidentId });
      }
    };

    emitStage('SERVICE_DISCOVERY_STARTED');

    const [severity, aiSummary, affectedServices, detectionSource] =
      await Promise.all([
        this.runAgent(incidentId, jobId, 'severity', () =>
          this.severityAgent.classifySeverity(enrichedLogs),
        ),
        this.runAgent(incidentId, jobId, 'summary', () =>
          this.summaryAgent.generateSummary(enrichedLogs, input.streamContext),
        ),
        this.runAgent(incidentId, jobId, 'affectedServices', () =>
          this.affectedServicesAgent.identifyAffectedServices(enrichedLogs),
        ),
        this.runAgent(incidentId, jobId, 'detectionSource', () =>
          this.detectionSourceAgent.identifyDetectionSource(enrichedLogs),
        ),
      ]);

    emitStage('SERVICE_DISCOVERY_COMPLETED');
    emitStage('EVIDENCE_EXTRACTION_STARTED');

    const [evidenceResult, impactResult] = await Promise.all([
      this.runAgent(incidentId, jobId, 'evidenceExtraction', () =>
        this.evidenceExtractionAgent.extractEvidence(enrichedLogs),
      ),
      this.runAgent(incidentId, jobId, 'impactAssessment', () =>
        this.impactAssessmentAgent.assessImpact(enrichedLogs),
      ),
    ]);

    const evidence = evidenceResult.value ?? [];
    const impactAssessment =
      impactResult.value ?? 'Impact assessment unavailable due to agent failure.';

    if (!evidenceResult.success) {
      partialFailures.push('evidenceExtraction');
    }

    if (!impactResult.success) {
      partialFailures.push('impactAssessment');
    }

    emitStage('EVIDENCE_EXTRACTION_COMPLETED');
    emitStage('ROOT_CAUSE_ANALYSIS_STARTED');

    const rootCauseResult = await this.runAgent(incidentId, jobId, 'rca', () =>
      this.rcaAgent.analyzeRootCause(enrichedLogs, input.historicalContext),
    );

    const rootCause =
      rootCauseResult.value ??
      'Root cause could not be determined — insufficient evidence in logs.';

    if (!rootCauseResult.success) {
      partialFailures.push('rca');
    }

    emitStage('ROOT_CAUSE_ANALYSIS_COMPLETED');
    emitStage('RECOMMENDATION_GENERATION_STARTED');

    const remediationResult = await this.runAgent(
      incidentId,
      jobId,
      'remediation',
      () => this.remediationAgent.generateRemediationSteps(enrichedLogs),
    );

    const remediationSteps = remediationResult.value ?? [
      'Review logs manually and validate service health checks.',
    ];

    if (!remediationResult.success) {
      partialFailures.push('remediation');
    }

    emitStage('RECOMMENDATION_GENERATION_COMPLETED');
    emitStage('RISK_ASSESSMENT_STARTED');

    const analysisWithoutConfidence = {
      severity: severity.value ?? 'MEDIUM',
      aiSummary: aiSummary.value ?? 'Summary unavailable.',
      rootCause,
      impactAssessment,
      affectedServices: affectedServices.value ?? [],
      remediationSteps,
      detectionSource: detectionSource.value ?? 'Unknown',
    };

    const confidenceResult = await this.runAgent(
      incidentId,
      jobId,
      'confidence',
      () =>
        this.confidenceAgent.scoreConfidence({
          logs: enrichedLogs,
          analysis: analysisWithoutConfidence,
          similarIncidentCount: input.similarIncidentCount,
          averageSimilarity: this.calculateAverage(input.similarityScores),
          evidence,
        }),
    );

    const confidence = confidenceResult.value ?? {
      confidenceScore: 40,
      rationale: 'Confidence defaulted after scoring agent failure.',
    };

    if (!confidenceResult.success) {
      partialFailures.push('confidence');
    }

    const initialAnalysis = incidentAnalysisSchema.parse({
      ...analysisWithoutConfidence,
      confidenceScore: confidence.confidenceScore,
    });

    const situationResult = await this.runAgent(
      incidentId,
      jobId,
      'situationJudge',
      () =>
        this.situationJudgeAgent.judgeSituation({
          logs: enrichedLogs,
          analysis: initialAnalysis,
          evidence,
        }),
    );

    const situationJudgment: SituationJudgment = situationResult.value ?? {
      urgency: 'MEDIUM',
      escalationRequired: false,
      customerImpactLikely: true,
      securityRisk: 'NONE_DETECTED',
      dataLossRisk: 'NONE_DETECTED',
      blastRadius: 'UNKNOWN',
      recommendedResponseMode: 'INVESTIGATE',
      rationale: 'Situation judgment unavailable.',
    };

    if (!situationResult.success) {
      partialFailures.push('situationJudge');
    }

    emitStage('RISK_ASSESSMENT_COMPLETED');
    emitStage('FINAL_REVIEW_STARTED');

    const reviewResult = await this.runAgent(
      incidentId,
      jobId,
      'evidenceReview',
      () =>
        this.evidenceReviewAgent.reviewAnalysis({
          logs: enrichedLogs,
          analysis: initialAnalysis,
          evidence,
          situationJudgment,
        }),
    );

    const review: EvidenceReview = reviewResult.value ?? {
      isEvidenceSupported: false,
      hallucinationRisk: 'MEDIUM',
      unsupportedClaims: [],
      missingEvidence: ['Final review agent failed'],
      confidenceAdjustment: -10,
      reviewerNotes: 'Final review agent failed — confidence reduced.',
    };

    if (!reviewResult.success) {
      partialFailures.push('evidenceReview');
    }

    emitStage('FINAL_REVIEW_COMPLETED');

    const adjustedConfidence = this.clampConfidence(
      initialAnalysis.confidenceScore + review.confidenceAdjustment,
    );

    const finalAnalysis = incidentAnalysisSchema.parse({
      ...initialAnalysis,
      confidenceScore: adjustedConfidence,
    });

    this.logger.log('Incident analysis orchestration completed');

    return {
      analysis: finalAnalysis,
      review,
      evidence,
      situationJudgment,
      confidenceRationale: confidence.rationale,
      inputProfile: input.inputProfile,
      partialFailures,
    };
  }

  private async runAgent<T>(
    incidentId: string,
    jobId: string,
    agent: AgentModelKey,
    task: () => Promise<T>,
    promptHint?: string,
  ): Promise<{ success: boolean; value: T | null }> {
    this.emitAgentStarted(incidentId, agent);
    const startedAt = Date.now();
    const model = this.modelRouterService.resolveModel(agent);

    if (promptHint) {
      await this.promptVersionService.recordPromptUsage({
        agent,
        promptContent: promptHint,
        jobId: jobId || undefined,
        incidentId: incidentId !== 'unknown' ? incidentId : undefined,
      });
    }

    try {
      const result = await task();
      const durationMs = Date.now() - startedAt;

      this.emitAgentCompleted(incidentId, agent, durationMs);

      if (jobId && incidentId !== 'unknown') {
        await this.agentMetricsService.recordMetric({
          incidentId,
          jobId,
          agent,
          model,
          durationMs,
          success: true,
        });
      }

      return { success: true, value: result };
    } catch (error) {
      const durationMs = Date.now() - startedAt;
      this.emitAgentFailed(incidentId, agent, error);

      if (jobId && incidentId !== 'unknown') {
        await this.agentMetricsService.recordMetric({
          incidentId,
          jobId,
          agent,
          model,
          durationMs,
          success: false,
        });
      }

      this.logger.warn(
        `Agent ${agent} failed — continuing with partial results`,
        error instanceof Error ? error.message : error,
      );

      return { success: false, value: null };
    }
  }

  private calculateAverage(scores: number[]): number | null {
    if (scores.length === 0) {
      return null;
    }

    const average =
      scores.reduce((sum, score) => sum + score, 0) / scores.length;

    return Number(average.toFixed(3));
  }

  private clampConfidence(score: number): number {
    return Math.max(0, Math.min(100, Number(score.toFixed(2))));
  }

  private emitAgentStarted(incidentId: string, agent: string) {
    this.incidentsGateway.emitAgentLifecycleEvent(incidentId, {
      agent,
      status: 'STARTED',
      timestamp: new Date().toISOString(),
    });
  }

  private emitAgentCompleted(
    incidentId: string,
    agent: string,
    durationMs: number,
  ) {
    this.incidentsGateway.emitAgentLifecycleEvent(incidentId, {
      agent,
      status: 'COMPLETED',
      timestamp: new Date().toISOString(),
      durationMs,
    });
  }

  private emitAgentFailed(incidentId: string, agent: string, error: unknown) {
    this.incidentsGateway.emitAgentLifecycleEvent(incidentId, {
      agent,
      status: 'FAILED',
      timestamp: new Date().toISOString(),
      metadata: {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
}
