export const INCIDENT_SEVERITIES = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
] as const;

export const INCIDENT_STATUSES = [
  "PENDING",
  "PROCESSING",
  "COMPLETED",
  "FAILED",
] as const;

export type IncidentSeverity = (typeof INCIDENT_SEVERITIES)[number];
export type IncidentStatus = (typeof INCIDENT_STATUSES)[number];

export type HallucinationRisk = "LOW" | "MEDIUM" | "HIGH";

export type IncidentEvidence = {
  quote: string;
  signalType: string;
  interpretation: string;
};

export type SituationJudgment = {
  urgency: string;
  escalationRequired: boolean;
  customerImpactLikely: boolean;
  securityRisk: string;
  dataLossRisk: string;
  blastRadius: string;
  recommendedResponseMode: string;
  rationale: string;
};

export type AiEvaluation = {
  confidenceScore: number;
  confidenceRationale?: string;
  hallucinationRisk: HallucinationRisk;
  unsupportedClaims: string[];
  missingEvidence: string[];
  evidence: IncidentEvidence[];
  situationJudgment: SituationJudgment;
  retrievedIncidents: number;
  inputProfile?: Record<string, unknown>;
};

export type Incident = {
  id: string;
  title: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  summary?: string | null;
  source?: string | null;
  aiSeverity?: string | null;
  remediationSteps?: string[];
  createdAt: string;
  updatedAt?: string;
  confidenceScore?: number | null;
  affectedServices?: string[];
  aiSummary?: string | null;
  rootCause?: string | null;
  impactAssessment?: string | null;
  detectionSource?: string | null;
};

export type IncidentEvaluation = {
  id: string;
  incidentId: string;
  faithfulnessScore?: number | null;
  hallucinationScore?: number | null;
  accuracyScore?: number | null;
  createdAt: string;
};

export type RootCauseHypothesis = {
  id: string;
  incidentId: string;
  hypothesis: string;
  confidenceScore: number;
  evidence: unknown;
  createdAt: string;
};

export type IncidentTimelineEvent = {
  id: string;
  incidentId?: string | null;
  jobId: string;
  stage: string;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
};

export type IncidentUpload = {
  id: string;
  incidentId: string;
  fileName: string;
  mimeType: string;
  storageKey: string;
  parsedText?: string | null;
  status?: "PENDING" | "PARSED" | "FAILED";
  createdAt: string;
};

export type FeedbackAction = "ACCEPT" | "REJECT" | "EDIT";

export type FeedbackField =
  | "rootCause"
  | "aiSummary"
  | "remediation"
  | "severity";

export type IncidentFeedback = {
  id: string;
  incidentId: string;
  field: FeedbackField;
  action: FeedbackAction;
  originalValue?: string | null;
  correctedValue?: string | null;
  reason?: string | null;
  createdAt: string;
};

export type CreateFeedbackInput = {
  field: FeedbackField;
  action: FeedbackAction;
  originalValue?: string;
  correctedValue?: string;
  reason?: string;
};

export type IncidentDetail = Incident & {
  evaluations: IncidentEvaluation[];
  timelineEvents: IncidentTimelineEvent[];
  hypotheses: RootCauseHypothesis[];
  uploads: IncidentUpload[];
  feedback: IncidentFeedback[];
};

export type IncidentTrendBucket = {
  time: string;
  CRITICAL: number;
  HIGH: number;
  MEDIUM: number;
  LOW: number;
};

export type CreateIncidentInput = {
  title: string;
  severity: IncidentSeverity;
  source?: string;
  summary?: string;
};

export type AnalyzeAndStoreInput = {
  title: string;
  severity: IncidentSeverity;
  logs: string;
};

export type EnqueueAnalysisResponse = {
  jobId: string;
  incidentId: string;
};

export type JobStatusResponse = {
  jobId: string | undefined;
  status: string;
  result: (Incident & { aiEvaluation?: AiEvaluation }) | null;
  failedReason: string | null;
};

export type AnalyzeIncidentResponse = Incident & {
  aiEvaluation?: AiEvaluation;
};

export type IncidentProgressEvent = {
  jobId: string;
  incidentId: string | null;
  stage: string;
  data: Record<string, unknown> | null;
};

export type IncidentCompletedEvent = {
  jobId: string;
  incidentId: string | null;
  result: AnalyzeIncidentResponse;
};

export type AgentTokenEvent = {
  incidentId: string;
  jobId: string;
  agent: string;
  token: string;
};

export type AgentCompleteEvent = {
  incidentId: string;
  jobId: string;
  agent: string;
  content: string;
};
