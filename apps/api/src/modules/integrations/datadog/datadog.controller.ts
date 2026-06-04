import { Body, Controller, Logger, Post } from '@nestjs/common';

import { IncidentQueueService } from '../../incidents/services/incident-queue.service';

import { mapDatadogToIncident } from './datadog.mapper';

import { DatadogWebhookDto } from './dto/datadog-webhook.dto';
import { Public } from '../../../lib/auth/public.decorator';

@Public()
@Controller('webhooks/datadog')
export class DatadogController {
  private readonly logger = new Logger(DatadogController.name);

  constructor(private readonly incidentQueueService: IncidentQueueService) {}

  @Post()
  async handleWebhook(@Body() payload: DatadogWebhookDto) {
    this.logger.log('Datadog webhook received');

    const incidentDto = mapDatadogToIncident(payload);

    const result =
      await this.incidentQueueService.enqueueIncidentAnalysis(incidentDto);

    return {
      received: true,
      jobId: result.jobId,
      incidentId: result.incidentId,
    };
  }
}
