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

export type OrchestratedIncidentAnalysis = {
  analysis: IncidentAnalysis;
  review: EvidenceReview;
  evidence: IncidentEvidence[];
  situationJudgment: SituationJudgment;
  confidenceRationale: string;
  inputProfile?: IncidentInputProfile;
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

    // Phase 1 — lightweight parallel agents
    this.logger.log('Phase 1: Lightweight parallel agents');

    const [severity, aiSummary, affectedServices, detectionSource] =
      await Promise.all([
        this.runAgent(incidentId, 'severity', () =>
          this.severityAgent.classifySeverity(enrichedLogs),
        ),
        this.runAgent(incidentId, 'summary', () =>
          this.summaryAgent.generateSummary(enrichedLogs, input.streamContext),
        ),
        this.runAgent(incidentId, 'affectedServices', () =>
          this.affectedServicesAgent.identifyAffectedServices(enrichedLogs),
        ),
        this.runAgent(incidentId, 'detectionSource', () =>
          this.detectionSourceAgent.identifyDetectionSource(enrichedLogs),
        ),
      ]);

    // Phase 2 — medium parallel agents
    this.logger.log('Phase 2: Medium parallel agents');

    const [evidence, impactAssessment] = await Promise.all([
      this.runAgent(incidentId, 'evidenceExtraction', () =>
        this.evidenceExtractionAgent.extractEvidence(enrichedLogs),
      ),
      this.runAgent(incidentId, 'impactAssessment', () =>
        this.impactAssessmentAgent.assessImpact(enrichedLogs),
      ),
    ]);

    // Phase 3 — heavy sequential agents
    this.logger.log('Phase 3: Heavy sequential agents');

    const rootCause = await this.runAgent(incidentId, 'rca', () =>
      this.rcaAgent.analyzeRootCause(enrichedLogs, input.historicalContext),
    );

    const remediationSteps = await this.runAgent(incidentId, 'remediation', () =>
      this.remediationAgent.generateRemediationSteps(enrichedLogs),
    );

    const analysisWithoutConfidence = {
      severity,
      aiSummary,
      rootCause,
      impactAssessment,
      affectedServices,
      remediationSteps,
      detectionSource,
    };

    const confidence = await this.runAgent(incidentId, 'confidence', () =>
      this.confidenceAgent.scoreConfidence({
        logs: enrichedLogs,
        analysis: analysisWithoutConfidence,
        similarIncidentCount: input.similarIncidentCount,
        averageSimilarity: this.calculateAverage(input.similarityScores),
        evidence,
      }),
    );

    const initialAnalysis = incidentAnalysisSchema.parse({
      ...analysisWithoutConfidence,
      confidenceScore: confidence.confidenceScore,
    });

    const situationJudgment = await this.runAgent(
      incidentId,
      'situationJudge',
      () =>
        this.situationJudgeAgent.judgeSituation({
          logs: enrichedLogs,
          analysis: initialAnalysis,
          evidence,
        }),
    );

    const review = await this.runAgent(incidentId, 'evidenceReview', () =>
      this.evidenceReviewAgent.reviewAnalysis({
        logs: enrichedLogs,
        analysis: initialAnalysis,
        evidence,
        situationJudgment,
      }),
    );

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
    };
  }

  private async runAgent<T>(
    incidentId: string,
    agent: string,
    task: () => Promise<T>,
  ): Promise<T> {
    this.emitAgentStarted(incidentId, agent);
    const startedAt = Date.now();

    try {
      const result = await task();
      this.emitAgentCompleted(incidentId, agent, Date.now() - startedAt);
      return result;
    } catch (error) {
      this.emitAgentFailed(incidentId, agent, error);
      throw error;
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
