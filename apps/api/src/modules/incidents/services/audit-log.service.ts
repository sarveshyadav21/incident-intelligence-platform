import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

@Injectable()
export class AuditLogService {
  constructor(private readonly prismaService: PrismaService) {}

  async log(input: {
    action: string;
    entityType: string;
    entityId?: string;
    incidentId?: string;
    userId?: string;
    metadata?: Record<string, unknown>;
  }) {
    return this.prismaService.auditLog.create({
      data: {
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        incidentId: input.incidentId,
        userId: input.userId ?? 'system',
        metadata: input.metadata as Prisma.InputJsonValue,
      },
    });
  }

  async listForIncident(incidentId: string) {
    return this.prismaService.auditLog.findMany({
      where: { incidentId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async listRecent(limit = 50) {
    return this.prismaService.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
