export const incidentQueryKeys = {
  all: ["incidents"] as const,
  list: () => [...incidentQueryKeys.all, "list"] as const,
  detail: (id: string) => [...incidentQueryKeys.all, "detail", id] as const,
  trends: () => [...incidentQueryKeys.all, "trends"] as const,
  timeline: (jobId: string) =>
    [...incidentQueryKeys.all, "timeline", jobId] as const,
  job: (jobId: string) => [...incidentQueryKeys.all, "job", jobId] as const,
};
