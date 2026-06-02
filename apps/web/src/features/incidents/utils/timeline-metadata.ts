import type {
  AiEvaluation,
  IncidentTimelineEvent,
} from "../types/incident.type";

export function extractAiEvaluationFromTimeline(
  events: IncidentTimelineEvent[],
): Partial<AiEvaluation> | null {
  const analysisEvent = [...events]
    .reverse()
    .find((event) => event.stage === "AI_ANALYSIS_COMPLETED");

  if (!analysisEvent?.metadata) {
    return null;
  }

  const metadata = analysisEvent.metadata;

  return {
    confidenceScore:
      typeof metadata.confidenceScore === "number"
        ? metadata.confidenceScore
        : undefined,
    hallucinationRisk: metadata.hallucinationRisk as AiEvaluation["hallucinationRisk"],
    unsupportedClaims: Array.isArray(metadata.unsupportedClaims)
      ? (metadata.unsupportedClaims as string[])
      : [],
    missingEvidence: Array.isArray(metadata.missingEvidence)
      ? (metadata.missingEvidence as string[])
      : [],
    evidence: Array.isArray(metadata.evidence)
      ? (metadata.evidence as AiEvaluation["evidence"])
      : [],
    situationJudgment: metadata.situationJudgment as AiEvaluation["situationJudgment"],
  };
}

export function formatStageLabel(stage: string): string {
  return stage.replaceAll("_", " ").toLowerCase();
}
