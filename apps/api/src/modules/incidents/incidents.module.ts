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
    IncidentAnalysisOrchestrator,
    IncidentInputNormalizerService,
    SimilaritySearchService,
    IncidentQueueService,
    IncidentAnalysisWorker,
    WebsocketModule,
    IncidentEvaluationService,
    TimelineService,
    IncidentsAnalyticsService,
  ],
})
export class IncidentsModule {}
