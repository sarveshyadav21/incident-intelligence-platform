import { randomUUID } from 'crypto';

import { AnalyzeAndStoreIncidentDto } from '../../incidents/dto/analyze-and-store-incident.dto';

import { normalizeSeverity } from '../../../common/utils/normalize-severity.util';

import { DatadogWebhookDto } from './dto/datadog-webhook.dto';

export function mapDatadogToIncident(
  payload: DatadogWebhookDto,
): AnalyzeAndStoreIncidentDto {
  return {
    trackingId: randomUUID(),

    incidentId: randomUUID(),

    title: payload.alert_title || 'Datadog Incident',

    severity: normalizeSeverity(
      payload.priority || payload.alert_type || 'MEDIUM',
    ),

    logs: `
Alert Title: ${payload.alert_title}

Event Type: ${payload.event_type}

Message:
${payload.text}

Tags:
${payload.tags?.join(', ') || 'None'}
    `.trim(),
  };
}
