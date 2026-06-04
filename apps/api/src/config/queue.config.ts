/** BullMQ worker settings for long-running local LLM jobs */
export const INCIDENT_ANALYSIS_WORKER_OPTIONS = {
  concurrency: Number(process.env.WORKER_CONCURRENCY ?? 1),
  lockDuration: 10 * 60 * 1000,
  stalledInterval: 60_000,
  maxStalledCount: 0,
} as const;
