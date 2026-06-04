import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

import { AnalyzeIncidentDto } from './dto/analyze-incident.dto';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { IncidentsService } from './incidents.service';
import { AnalyzeAndStoreIncidentDto } from './dto/analyze-and-store-incident.dto';
import { IncidentQueueService } from './services/incident-queue.service';
import { IncidentsAnalyticsService } from './incidents.analytics.service';
import { IncidentUploadService } from './services/incident-upload.service';
import { IncidentFeedbackService } from './services/incident-feedback.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { SimilaritySearchService } from './services/similarity-search.service';
import { AnalysisRunService } from './services/analysis-run.service';
import { AdminQueueService } from './services/admin-queue.service';
import { AgentMetricsService } from './services/agent-metrics.service';
import { ModelRouterService } from './services/model-router.service';
import { PromptVersionService } from './services/prompt-version.service';
import { AuditLogService } from './services/audit-log.service';
import { IncidentReportingService } from './services/incident-reporting.service';
import { CreateRatingFeedbackDto } from './dto/create-rating-feedback.dto';

@Controller('incidents')
export class IncidentsController {
  constructor(
    private readonly incidentsService: IncidentsService,
    private readonly incidentQueueService: IncidentQueueService,
    private readonly incidentsAnalyticsService: IncidentsAnalyticsService,
    private readonly incidentUploadService: IncidentUploadService,
    private readonly incidentFeedbackService: IncidentFeedbackService,
    private readonly similaritySearchService: SimilaritySearchService,
    private readonly analysisRunService: AnalysisRunService,
    private readonly adminQueueService: AdminQueueService,
    private readonly agentMetricsService: AgentMetricsService,
    private readonly modelRouterService: ModelRouterService,
    private readonly promptVersionService: PromptVersionService,
    private readonly auditLogService: AuditLogService,
    private readonly incidentReportingService: IncidentReportingService,
  ) {}

  @Post()
  async createIncident(@Body() createIncidentDto: CreateIncidentDto) {
    return this.incidentsService.createIncident(createIncidentDto);
  }

  @Get()
  async getAllIncidents() {
    return this.incidentsService.getAllIncidents();
  }

  @Get('admin/queue')
  getQueueHealth() {
    return this.adminQueueService.getQueueHealth();
  }

  @Get('admin/queue/jobs')
  listQueueJobs() {
    return this.adminQueueService.listRecentJobs();
  }

  @Get('admin/agents/metrics')
  getAgentMetrics() {
    return this.agentMetricsService.getAgentPerformance();
  }

  @Get('admin/models/usage')
  getModelUsage() {
    return this.agentMetricsService.getModelUsage();
  }

  @Get('admin/models/routing')
  getModelRouting() {
    return this.modelRouterService.getRoutingTable();
  }

  @Get('admin/prompts/:agent')
  listPromptVersions(@Param('agent') agent: string) {
    return this.promptVersionService.listByAgent(agent);
  }

  @Post('analyze')
  async analyzeIncident(@Body() analyzeIncidentDto: AnalyzeIncidentDto) {
    return this.incidentsService.analyzeIncidentLogs(analyzeIncidentDto.logs);
  }

  @Post('analyze-and-store')
  async analyzeAndStoreIncident(
    @Body()
    analyzeDto: AnalyzeAndStoreIncidentDto,
  ) {
    return this.incidentQueueService.enqueueIncidentAnalysis(analyzeDto);
  }

  @Get('job/:jobId')
  async getJobStatus(@Param('jobId') jobId: string) {
    return this.incidentQueueService.getJobStatus(jobId);
  }

  @Get('timeline/:jobId')
  async getTimeline(@Param('jobId') jobId: string) {
    return this.incidentsService.getIncidentTimeline(jobId);
  }

  @Get('analytics/trends')
  getIncidentTrends() {
    return this.incidentsAnalyticsService.getIncidentTrends();
  }

  @Post(':id/uploads')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 15 * 1024 * 1024 },
    }),
  )
  uploadFile(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.incidentUploadService.uploadFile(id, file);
  }

  @Get(':id/uploads')
  listUploads(@Param('id') id: string) {
    return this.incidentUploadService.listUploads(id);
  }

  @Delete(':id/uploads/:uploadId')
  deleteUpload(
    @Param('id') id: string,
    @Param('uploadId') uploadId: string,
  ) {
    return this.incidentUploadService.deleteUpload(id, uploadId);
  }

  @Post(':id/feedback')
  createFeedback(
    @Param('id') id: string,
    @Body() dto: CreateFeedbackDto,
  ) {
    return this.incidentFeedbackService.createFeedback(id, dto);
  }

  @Post(':id/feedback/rating')
  createRatingFeedback(
    @Param('id') id: string,
    @Body() dto: CreateRatingFeedbackDto,
  ) {
    return this.incidentFeedbackService.createRatingFeedback(id, dto);
  }

  @Get(':id/feedback')
  listFeedback(@Param('id') id: string) {
    return this.incidentFeedbackService.listFeedback(id);
  }

  @Post(':id/reanalyze')
  reanalyzeIncident(@Param('id') id: string) {
    return this.incidentQueueService.reanalyzeIncident(id);
  }

  @Get(':id/similar')
  getSimilarIncidents(@Param('id') id: string) {
    return this.similaritySearchService.findSimilarForIncident(id);
  }

  @Get(':id/analysis-runs')
  listAnalysisRuns(@Param('id') id: string) {
    return this.analysisRunService.listRuns(id);
  }

  @Get(':id/analysis-runs/:runId')
  getAnalysisRun(
    @Param('id') id: string,
    @Param('runId') runId: string,
  ) {
    return this.analysisRunService.getRun(id, runId);
  }

  @Get(':id/retry-history')
  getRetryHistory(@Param('id') id: string) {
    return this.incidentsService.getRetryHistory(id);
  }

  @Get(':id/executive-summary')
  getExecutiveSummary(@Param('id') id: string) {
    return this.incidentReportingService.getExecutiveSummary(id);
  }

  @Get(':id/postmortem')
  getPostmortem(@Param('id') id: string) {
    return this.incidentReportingService.getPostmortem(id);
  }

  @Get(':id/dependency-graph')
  getDependencyGraph(@Param('id') id: string) {
    return this.incidentReportingService.getDependencyGraph(id);
  }

  @Get(':id/audit-logs')
  getAuditLogs(@Param('id') id: string) {
    return this.auditLogService.listForIncident(id);
  }

  @Get(':id')
  async getIncidentById(@Param('id') id: string) {
    return this.incidentsService.getIncidentById(id);
  }
}
