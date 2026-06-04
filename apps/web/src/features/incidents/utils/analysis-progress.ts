export type ProgressStep = {
  id: string;
  label: string;
  status: "completed" | "active" | "pending" | "failed";
};

const STAGE_ORDER = [
  "JOB_STARTED",
  "EMBEDDING_GENERATED",
  "SIMILAR_INCIDENTS_RETRIEVED",
  "SERVICE_DISCOVERY_STARTED",
  "SERVICE_DISCOVERY_COMPLETED",
  "EVIDENCE_EXTRACTION_STARTED",
  "EVIDENCE_EXTRACTION_COMPLETED",
  "ROOT_CAUSE_ANALYSIS_STARTED",
  "ROOT_CAUSE_ANALYSIS_COMPLETED",
  "RECOMMENDATION_GENERATION_STARTED",
  "RECOMMENDATION_GENERATION_COMPLETED",
  "RISK_ASSESSMENT_STARTED",
  "RISK_ASSESSMENT_COMPLETED",
  "FINAL_REVIEW_STARTED",
  "FINAL_REVIEW_COMPLETED",
  "AI_ANALYSIS_COMPLETED",
  "INCIDENT_PERSISTED",
  "INCIDENT_RESOLVED",
] as const;

const PROGRESS_STEPS: Array<{ id: string; label: string; matchStages: string[] }> =
  [
    {
      id: "job",
      label: "Job Started",
      matchStages: ["JOB_STARTED", "AI_ANALYSIS_STARTED"],
    },
    {
      id: "discovery",
      label: "Service Discovery",
      matchStages: [
        "SERVICE_DISCOVERY_STARTED",
        "SERVICE_DISCOVERY_COMPLETED",
        "EMBEDDING_GENERATED",
        "SIMILAR_INCIDENTS_RETRIEVED",
      ],
    },
    {
      id: "evidence",
      label: "Evidence Extraction",
      matchStages: [
        "EVIDENCE_EXTRACTION_STARTED",
        "EVIDENCE_EXTRACTION_COMPLETED",
      ],
    },
    {
      id: "rca",
      label: "Root Cause Analysis",
      matchStages: [
        "ROOT_CAUSE_ANALYSIS_STARTED",
        "ROOT_CAUSE_ANALYSIS_COMPLETED",
        "ROOT_CAUSE_IDENTIFIED",
      ],
    },
    {
      id: "remediation",
      label: "Recommendation Generation",
      matchStages: [
        "RECOMMENDATION_GENERATION_STARTED",
        "RECOMMENDATION_GENERATION_COMPLETED",
        "REMEDIATION_GENERATED",
      ],
    },
    {
      id: "risk",
      label: "Risk Assessment",
      matchStages: ["RISK_ASSESSMENT_STARTED", "RISK_ASSESSMENT_COMPLETED"],
    },
    {
      id: "review",
      label: "Final Review",
      matchStages: [
        "FINAL_REVIEW_STARTED",
        "FINAL_REVIEW_COMPLETED",
        "AI_ANALYSIS_COMPLETED",
        "INCIDENT_PERSISTED",
        "INCIDENT_RESOLVED",
      ],
    },
  ];

function stageIndex(stage: string): number {
  const index = STAGE_ORDER.indexOf(stage as (typeof STAGE_ORDER)[number]);
  return index >= 0 ? index : -1;
}

export function buildAnalysisProgress(
  timelineStages: string[],
  incidentStatus?: string,
  liveStage?: string,
): ProgressStep[] {
  const allStages = [...timelineStages];

  if (liveStage) {
    allStages.push(liveStage);
  }

  const maxIndex = allStages.reduce(
    (max, stage) => Math.max(max, stageIndex(stage)),
    -1,
  );

  const failed = incidentStatus === "FAILED" || allStages.includes("JOB_FAILED");

  return PROGRESS_STEPS.map((step, index) => {
    const matched = step.matchStages.some((stage) => allStages.includes(stage));
    const stepMax = Math.max(
      ...step.matchStages.map((stage) => stageIndex(stage)),
    );

    let status: ProgressStep["status"] = "pending";

    if (failed && index === PROGRESS_STEPS.length - 1 && !matched) {
      status = "failed";
    } else if (
      incidentStatus === "COMPLETED" ||
      allStages.includes("INCIDENT_RESOLVED")
    ) {
      status = "completed";
    } else if (matched) {
      status = stepMax <= maxIndex ? "completed" : "active";
    } else if (index > 0 && maxIndex >= 0) {
      const prevStep = PROGRESS_STEPS[index - 1];
      const prevMatched = prevStep.matchStages.some((stage) =>
        allStages.includes(stage),
      );

      if (prevMatched && stepMax > maxIndex) {
        status = "active";
      }
    }

    if (
      status === "pending" &&
      index === 0 &&
      (allStages.length > 0 || incidentStatus === "PROCESSING")
    ) {
      status = matched ? "completed" : "active";
    }

    return {
      id: step.id,
      label: step.label,
      status,
    };
  });
}
