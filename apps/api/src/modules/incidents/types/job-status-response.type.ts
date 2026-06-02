export type JobStatusResponse = {
  jobId: string | undefined;
  status: string;
  result: unknown;
  failedReason: string | null;
};
