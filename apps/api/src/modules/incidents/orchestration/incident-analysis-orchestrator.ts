import { Injectable } from '@nestjs/common';

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

    const evidence =
      await this.evidenceExtractionAgent.extractEvidence(enrichedLogs);

    const summaryPromise = this.summaryAgent.generateSummary(
      enrichedLogs,
      input.streamContext,
    );

    const [
      severity,
      rootCause,
      remediationSteps,
      aiSummary,
      impactAssessment,
      affectedServices,
      detectionSource,
    ] = await Promise.all([
      this.severityAgent.classifySeverity(enrichedLogs),
      this.rcaAgent.analyzeRootCause(enrichedLogs, input.historicalContext),
      this.remediationAgent.generateRemediationSteps(enrichedLogs),
      summaryPromise,
      this.impactAssessmentAgent.assessImpact(enrichedLogs),
      this.affectedServicesAgent.identifyAffectedServices(enrichedLogs),
      this.detectionSourceAgent.identifyDetectionSource(enrichedLogs),
    ]);

    const analysisWithoutConfidence = {
      severity,
      aiSummary,
      rootCause,
      impactAssessment,
      affectedServices,
      remediationSteps,
      detectionSource,
    };

    const averageSimilarity = this.calculateAverage(input.similarityScores);
    const confidence = await this.confidenceAgent.scoreConfidence({
      logs: enrichedLogs,
      analysis: analysisWithoutConfidence,
      similarIncidentCount: input.similarIncidentCount,
      averageSimilarity,
      evidence,
    });

    const initialAnalysis = incidentAnalysisSchema.parse({
      ...analysisWithoutConfidence,
      confidenceScore: confidence.confidenceScore,
    });

    const situationJudgment = await this.situationJudgeAgent.judgeSituation({
      logs: enrichedLogs,
      analysis: initialAnalysis,
      evidence,
    });

    const review = await this.evidenceReviewAgent.reviewAnalysis({
      logs: enrichedLogs,
      analysis: initialAnalysis,
      evidence,
      situationJudgment,
    });

    const adjustedConfidence = this.clampConfidence(
      initialAnalysis.confidenceScore + review.confidenceAdjustment,
    );

    const finalAnalysis = incidentAnalysisSchema.parse({
      ...initialAnalysis,
      confidenceScore: adjustedConfidence,
    });

    return {
      analysis: finalAnalysis,
      review,
      evidence,
      situationJudgment,
      confidenceRationale: confidence.rationale,
      inputProfile: input.inputProfile,
    };
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
}
