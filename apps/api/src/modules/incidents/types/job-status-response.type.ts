export type AnalysisJobStatus =
  | 'QUEUED'
  | 'RUNNING'
  | 'COMPLETED'
  | 'FAILED'
  | 'NOT_FOUND';

export type JobStatusResponse = {
  jobId: string | undefined;
  status: AnalysisJobStatus | string;
  bullmqState?: string;
  result: unknown;
  failedReason: string | null;
};
