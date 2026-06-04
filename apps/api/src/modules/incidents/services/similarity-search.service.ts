import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { IncidentAccessService } from './incident-access.service';

type SimilarIncident = {
  id: string;
  title: string;
  summary: string | null;
  rootCause: string | null;
  remediationSteps: unknown;
  similarity: number;
};

@Injectable()
export class SimilaritySearchService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly incidentAccessService: IncidentAccessService,
  ) {}

  async findSimilarIncidents(
    embedding: number[],
    excludeIncidentId?: string,
    limit = 5,
    userId?: string,
  ): Promise<SimilarIncident[]> {
    const vector = `[${embedding.join(',')}]`;
    const userFilter = userId ?? null;

    if (excludeIncidentId) {
      return this.prismaService.$queryRawUnsafe<SimilarIncident[]>(
        `
        SELECT
          id,
          title,
          summary,
          "rootCause",
          "remediationSteps",
          1 - (embedding <=> $1::vector) AS similarity
        FROM incidents
        WHERE embedding IS NOT NULL
          AND id != $2
          AND ($4::text IS NULL OR "userId" = $4)
        ORDER BY embedding <=> $1::vector
        LIMIT $3
        `,
        vector,
        excludeIncidentId,
        limit,
        userFilter,
      );
    }

    return this.prismaService.$queryRawUnsafe<SimilarIncident[]>(
      `
      SELECT
        id,
        title,
        summary,
        "rootCause",
        "remediationSteps",
        1 - (embedding <=> $1::vector) AS similarity
      FROM incidents
      WHERE embedding IS NOT NULL
        AND ($3::text IS NULL OR "userId" = $3)
      ORDER BY embedding <=> $1::vector
      LIMIT $2
      `,
      vector,
      limit,
      userFilter,
    );
  }

  async findSimilarForIncident(incidentId: string, userId: string) {
    await this.incidentAccessService.assertOwner(incidentId, userId);

    const rows = await this.prismaService.$queryRawUnsafe<
      Array<{ embedding: string }>
    >(
      `SELECT embedding::text AS embedding FROM incidents WHERE id = $1 AND embedding IS NOT NULL`,
      incidentId,
    );

    if (!rows[0]?.embedding) {
      return [];
    }

    const embedding = this.parseVector(rows[0].embedding);

    const similar = await this.findSimilarIncidents(
      embedding,
      incidentId,
      8,
      userId,
    );

    return similar.map((incident) => ({
      id: incident.id,
      title: incident.title,
      rootCause: incident.rootCause,
      similarity: Number((incident.similarity * 100).toFixed(0)),
    }));
  }

  private parseVector(vectorText: string): number[] {
    return vectorText
      .replace(/[\[\]]/g, '')
      .split(',')
      .map((value) => Number(value.trim()));
  }
}
