export type Incident = {
  id: string;

  title: string;

  severity: string;

  status: string;

  summary?: string;

  aiSeverity?: string;

  remediationSteps?: string[];

  createdAt: string;

  remediation?: string;

  confidenceScore?: number;

  affectedServices?: string[];
  aiSummary?: string;

  rootCause?: string;

  impactAssessment?: string;

  detectionSource?: string;
};
