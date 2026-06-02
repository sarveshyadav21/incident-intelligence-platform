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

@Controller('incidents')
export class IncidentsController {
  constructor(
    private readonly incidentsService: IncidentsService,
    private readonly incidentQueueService: IncidentQueueService,
    private readonly incidentsAnalyticsService: IncidentsAnalyticsService,
    private readonly incidentUploadService: IncidentUploadService,
    private readonly incidentFeedbackService: IncidentFeedbackService,
  ) {}

  @Post()
  async createIncident(@Body() createIncidentDto: CreateIncidentDto) {
    return this.incidentsService.createIncident(createIncidentDto);
  }

  @Get()
  async getAllIncidents() {
    return this.incidentsService.getAllIncidents();
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
      limits: { fileSize: 10 * 1024 * 1024 },
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

  @Get(':id/feedback')
  listFeedback(@Param('id') id: string) {
    return this.incidentFeedbackService.listFeedback(id);
  }

  @Post(':id/reanalyze')
  reanalyzeIncident(@Param('id') id: string) {
    return this.incidentQueueService.reanalyzeIncident(id);
  }

  @Get(':id')
  async getIncidentById(@Param('id') id: string) {
    return this.incidentsService.getIncidentById(id);
  }
}
