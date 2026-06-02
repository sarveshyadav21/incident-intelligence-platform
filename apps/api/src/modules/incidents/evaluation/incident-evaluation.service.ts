import { Injectable } from '@nestjs/common';

@Injectable()
export class IncidentEvaluationService {
  calculateConfidenceScore(similarityScores: number[]): number {
    if (similarityScores.length === 0) {
      return 0.3;
    }

    const averageSimilarity =
      similarityScores.reduce((sum, score) => sum + score, 0) /
      similarityScores.length;

    return Number(averageSimilarity.toFixed(2));
  }

  calculateHallucinationRisk(
    confidenceScore: number,
  ): 'LOW' | 'MEDIUM' | 'HIGH' {
    if (confidenceScore >= 0.85) {
      return 'LOW';
    }

    if (confidenceScore >= 0.65) {
      return 'MEDIUM';
    }

    return 'HIGH';
  }
}
