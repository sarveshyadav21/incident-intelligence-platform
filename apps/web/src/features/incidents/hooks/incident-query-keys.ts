export const incidentQueryKeys = {
  all: ["incidents"] as const,
  list: () => [...incidentQueryKeys.all, "list"] as const,
  detail: (id: string) => [...incidentQueryKeys.all, "detail", id] as const,
  trends: () => [...incidentQueryKeys.all, "trends"] as const,
  timeline: (jobId: string) =>
    [...incidentQueryKeys.all, "timeline", jobId] as const,
  job: (jobId: string) => [...incidentQueryKeys.all, "job", jobId] as const,
  similar: (id: string) => [...incidentQueryKeys.all, "similar", id] as const,
  retryHistory: (id: string) =>
    [...incidentQueryKeys.all, "retry-history", id] as const,
  analysisRuns: (id: string) =>
    [...incidentQueryKeys.all, "analysis-runs", id] as const,
  queueHealth: () => [...incidentQueryKeys.all, "admin", "queue"] as const,
  agentMetrics: () => [...incidentQueryKeys.all, "admin", "agents"] as const,
  modelUsage: () => [...incidentQueryKeys.all, "admin", "models"] as const,
};
