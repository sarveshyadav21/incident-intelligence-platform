import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

@Injectable()
export class IncidentAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async assertOwner(incidentId: string, userId: string): Promise<void> {
    const incident = await this.prisma.incident.findUnique({
      where: { id: incidentId },
      select: { userId: true },
    });

    if (!incident) {
      throw new NotFoundException('Incident not found');
    }

    if (incident.userId !== userId) {
      throw new ForbiddenException('You do not have access to this incident');
    }
  }
}
