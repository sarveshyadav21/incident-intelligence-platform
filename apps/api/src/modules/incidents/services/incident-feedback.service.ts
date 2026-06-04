import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { CreateFeedbackDto } from '../dto/create-feedback.dto';
import { CreateRatingFeedbackDto } from '../dto/create-rating-feedback.dto';
import { AuditLogService } from './audit-log.service';
import { IncidentAccessService } from './incident-access.service';

@Injectable()
export class IncidentFeedbackService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly auditLogService: AuditLogService,
    private readonly incidentAccessService: IncidentAccessService,
  ) {}

  async createFeedback(
    incidentId: string,
    dto: CreateFeedbackDto,
    userId: string,
  ) {
    await this.incidentAccessService.assertOwner(incidentId, userId);

    const feedback = await this.prismaService.incidentFeedback.create({
      data: {
        incidentId,
        field: dto.field,
        action: dto.action,
        originalValue: dto.originalValue,
        correctedValue: dto.correctedValue,
        reason: dto.reason,
      },
    });

    if (dto.action === 'EDIT' && dto.correctedValue) {
      await this.applyCorrection(incidentId, dto.field, dto.correctedValue);
    }

    await this.auditLogService.log({
      action: 'FEEDBACK_CREATED',
      entityType: 'IncidentFeedback',
      entityId: feedback.id,
      incidentId,
      metadata: { field: dto.field, action: dto.action },
    });

    return feedback;
  }

  async createRatingFeedback(
    incidentId: string,
    dto: CreateRatingFeedbackDto,
    userId: string,
  ) {
    await this.incidentAccessService.assertOwner(incidentId, userId);

    const feedback = await this.prismaService.incidentFeedback.create({
      data: {
        incidentId,
        field: dto.category,
        action: 'ACCEPT',
        category: dto.category,
        rating: dto.rating,
        reason: dto.reason,
      },
    });

    await this.auditLogService.log({
      action: 'FEEDBACK_RATING_CREATED',
      entityType: 'IncidentFeedback',
      entityId: feedback.id,
      incidentId,
      metadata: { category: dto.category, rating: dto.rating },
    });

    return feedback;
  }

  async listFeedback(incidentId: string) {
    return this.prismaService.incidentFeedback.findMany({
      where: { incidentId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getFeedbackContext(incidentId: string): Promise<string> {
    const feedback = await this.prismaService.incidentFeedback.findMany({
      where: { incidentId, action: { in: ['EDIT', 'REJECT'] } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    if (feedback.length === 0) {
      return '';
    }

    return feedback
      .map((item) => {
        const parts = [`Field: ${item.field}`, `Action: ${item.action}`];

        if (item.correctedValue) {
          parts.push(`Correction: ${item.correctedValue}`);
        }

        if (item.reason) {
          parts.push(`Reason: ${item.reason}`);
        }

        return parts.join('\n');
      })
      .join('\n---\n');
  }

  private async applyCorrection(
    incidentId: string,
    field: string,
    correctedValue: string,
  ) {
    const data: Prisma.IncidentUpdateInput = {};

    switch (field) {
      case 'rootCause':
        data.rootCause = correctedValue;
        break;
      case 'aiSummary':
        data.aiSummary = correctedValue;
        break;
      case 'severity':
        data.aiSeverity = correctedValue;
        break;
      case 'remediation':
        data.remediationSteps = correctedValue
          .split('\n')
          .map((step) => step.trim())
          .filter(Boolean);
        break;
    }

    if (Object.keys(data).length > 0) {
      await this.prismaService.incident.update({
        where: { id: incidentId },
        data,
      });
    }
  }
}
