import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

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
  constructor(private readonly prismaService: PrismaService) {}

  async findSimilarIncidents(embedding: number[]): Promise<SimilarIncident[]> {
    const vector = `[${embedding.join(',')}]`;

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
      ORDER BY embedding <=> $1::vector
      LIMIT 3
      `,
      vector,
    );
  }
}
