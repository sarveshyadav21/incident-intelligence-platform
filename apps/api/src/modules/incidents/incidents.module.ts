import { Module } from '@nestjs/common';
import { RCAAgent } from './agents/rca.agent';
import { SeverityAgent } from './agents/severity.agent';
import { IncidentsController } from './incidents.controller';
import { IncidentsService } from './incidents.service';
import { RemediationAgent } from './agents/remediation.agent';
import { SimilaritySearchService } from './services/similarity-search.service';
import { BullModule } from '@nestjs/bullmq';
import { IncidentQueueService } from './services/incident-queue.service';
import { IncidentAnalysisWorker } from './workers/incident-analysis.worker';
import { WebsocketModule } from '../../infrastructure/websocket/websocket.module';
import { IncidentEvaluationService } from './evaluation/incident-evaluation.service';
import { TimelineService } from './timeline/incident-timeline.service';
import { IncidentsAnalyticsService } from './incidents.analytics.service';
import { SummaryAgent } from './agents/summary.agent';
import { ImpactAssessmentAgent } from './agents/impact-assessment.agent';
import { AffectedServicesAgent } from './agents/affected-services.agent';
import { DetectionSourceAgent } from './agents/detection-source.agent';
import { ConfidenceAgent } from './agents/confidence.agent';
import { EvidenceReviewAgent } from './agents/evidence-review.agent';
import { IncidentAnalysisOrchestrator } from './orchestration/incident-analysis-orchestrator';
import { IncidentInputNormalizerService } from './services/incident-input-normalizer.service';
import { EvidenceExtractionAgent } from './agents/evidence-extraction.agent';
import { SituationJudgeAgent } from './agents/situation-judge.agent';
import { FileParserService } from './services/file-parser.service';
import { IncidentUploadService } from './services/incident-upload.service';
import { IncidentFeedbackService } from './services/incident-feedback.service';
import { ModelRouterService } from './services/model-router.service';
import { PromptVersionService } from './services/prompt-version.service';
import { AgentMetricsService } from './services/agent-metrics.service';
import { AnalysisRunService } from './services/analysis-run.service';
import { AuditLogService } from './services/audit-log.service';
import { AdminQueueService } from './services/admin-queue.service';
import { JobRecoveryService } from './services/job-recovery.service';
import { ExecutiveSummaryAgent } from './agents/executive-summary.agent';
import { PostmortemAgent } from './agents/postmortem.agent';
import { DependencyGraphAgent } from './agents/dependency-graph.agent';
import { IncidentReportingService } from './services/incident-reporting.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'incident-analysis',
    }),
    WebsocketModule,
  ],

  controllers: [IncidentsController],
  providers: [
    IncidentsService,
    SeverityAgent,
    RCAAgent,
    RemediationAgent,
    SummaryAgent,
    ImpactAssessmentAgent,
    AffectedServicesAgent,
    DetectionSourceAgent,
    ConfidenceAgent,
    EvidenceReviewAgent,
    EvidenceExtractionAgent,
    SituationJudgeAgent,
    ExecutiveSummaryAgent,
    PostmortemAgent,
    DependencyGraphAgent,
    IncidentAnalysisOrchestrator,
    IncidentInputNormalizerService,
    SimilaritySearchService,
    IncidentQueueService,
    IncidentAnalysisWorker,
    IncidentEvaluationService,
    TimelineService,
    IncidentsAnalyticsService,
    FileParserService,
    IncidentUploadService,
    IncidentFeedbackService,
    ModelRouterService,
    PromptVersionService,
    AgentMetricsService,
    AnalysisRunService,
    AuditLogService,
    AdminQueueService,
    JobRecoveryService,
    IncidentReportingService,
  ],
  exports: [IncidentQueueService],
})
export class IncidentsModule {}
