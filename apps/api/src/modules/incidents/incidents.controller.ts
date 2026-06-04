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

import { CurrentUser } from '../../lib/auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/auth-user.type';
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
import { IncidentAccessService } from './services/incident-access.service';

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
    private readonly incidentAccessService: IncidentAccessService,
  ) {}

  @Post()
  async createIncident(
    @Body() createIncidentDto: CreateIncidentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.incidentsService.createIncident(createIncidentDto, user.id);
  }

  @Get()
  async getAllIncidents(@CurrentUser() user: AuthenticatedUser) {
    return this.incidentsService.getAllIncidents(user.id);
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
    @Body() analyzeDto: AnalyzeAndStoreIncidentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.incidentQueueService.enqueueIncidentAnalysis(
      analyzeDto,
      user.id,
    );
  }

  @Get('job/:jobId')
  async getJobStatus(
    @Param('jobId') jobId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.incidentQueueService.getJobStatus(jobId, user.id);
  }

  @Get('timeline/:jobId')
  async getTimeline(
    @Param('jobId') jobId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.incidentsService.getIncidentTimeline(jobId, user.id);
  }

  @Get('analytics/trends')
  getIncidentTrends(@CurrentUser() user: AuthenticatedUser) {
    return this.incidentsAnalyticsService.getIncidentTrends(user.id);
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
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.incidentUploadService.uploadFile(id, file, user.id);
  }

  @Get(':id/uploads')
  async listUploads(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.incidentAccessService.assertOwner(id, user.id);
    return this.incidentUploadService.listUploads(id);
  }

  @Delete(':id/uploads/:uploadId')
  async deleteUpload(
    @Param('id') id: string,
    @Param('uploadId') uploadId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.incidentAccessService.assertOwner(id, user.id);
    return this.incidentUploadService.deleteUpload(id, uploadId);
  }

  @Post(':id/feedback')
  createFeedback(
    @Param('id') id: string,
    @Body() dto: CreateFeedbackDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.incidentFeedbackService.createFeedback(id, dto, user.id);
  }

  @Post(':id/feedback/rating')
  createRatingFeedback(
    @Param('id') id: string,
    @Body() dto: CreateRatingFeedbackDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.incidentFeedbackService.createRatingFeedback(id, dto, user.id);
  }

  @Get(':id/feedback')
  async listFeedback(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.incidentAccessService.assertOwner(id, user.id);
    return this.incidentFeedbackService.listFeedback(id);
  }

  @Post(':id/reanalyze')
  reanalyzeIncident(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.incidentQueueService.reanalyzeIncident(id, user.id);
  }

  @Get(':id/similar')
  getSimilarIncidents(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.similaritySearchService.findSimilarForIncident(id, user.id);
  }

  @Get(':id/analysis-runs')
  async listAnalysisRuns(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.incidentAccessService.assertOwner(id, user.id);
    return this.analysisRunService.listRuns(id);
  }

  @Get(':id/analysis-runs/:runId')
  async getAnalysisRun(
    @Param('id') id: string,
    @Param('runId') runId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.incidentAccessService.assertOwner(id, user.id);
    return this.analysisRunService.getRun(id, runId);
  }

  @Get(':id/retry-history')
  getRetryHistory(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.incidentsService.getRetryHistory(id, user.id);
  }

  @Get(':id/executive-summary')
  async getExecutiveSummary(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.incidentAccessService.assertOwner(id, user.id);
    return this.incidentReportingService.getExecutiveSummary(id);
  }

  @Get(':id/postmortem')
  async getPostmortem(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.incidentAccessService.assertOwner(id, user.id);
    return this.incidentReportingService.getPostmortem(id);
  }

  @Get(':id/dependency-graph')
  async getDependencyGraph(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.incidentAccessService.assertOwner(id, user.id);
    return this.incidentReportingService.getDependencyGraph(id);
  }

  @Get(':id/audit-logs')
  async getAuditLogs(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.incidentAccessService.assertOwner(id, user.id);
    return this.auditLogService.listForIncident(id);
  }

  @Get(':id')
  async getIncidentById(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.incidentsService.getIncidentById(id, user.id);
  }
}
