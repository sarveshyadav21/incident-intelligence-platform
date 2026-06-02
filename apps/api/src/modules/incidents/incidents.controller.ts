import { Body, Controller, Get, Post, Param } from '@nestjs/common';
import { AnalyzeIncidentDto } from './dto/analyze-incident.dto';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { IncidentsService } from './incidents.service';
import { AnalyzeAndStoreIncidentDto } from './dto/analyze-and-store-incident.dto';
import { IncidentQueueService } from './services/incident-queue.service';
import { IncidentsAnalyticsService } from './incidents.analytics.service';
@Controller('incidents')
export class IncidentsController {
  constructor(
    private readonly incidentsService: IncidentsService,
    private readonly incidentQueueService: IncidentQueueService,
    private readonly incidentsAnalyticsService: IncidentsAnalyticsService,
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
  async getTimeline(
    @Param('jobId')
    jobId: string,
  ) {
    return this.incidentsService.getIncidentTimeline(jobId);
  }

  @Get(':id')
  async getIncidentById(
    @Param('id')
    id: string,
  ) {
    return this.incidentsService.getIncidentById(id);
  }
  @Get('analytics/trends')
  getIncidentTrends() {
    return this.incidentsAnalyticsService.getIncidentTrends();
  }
}
