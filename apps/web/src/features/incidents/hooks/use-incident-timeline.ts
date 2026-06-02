"use client";

import { useQuery } from "@tanstack/react-query";

import { getIncidentTimeline } from "../api/incident-api";
import { incidentQueryKeys } from "./incident-query-keys";

export function useIncidentTimeline(jobId: string | null) {
  return useQuery({
    queryKey: incidentQueryKeys.timeline(jobId ?? ""),
    queryFn: () => getIncidentTimeline(jobId!),
    enabled: Boolean(jobId),
    refetchInterval: (query) => {
      const events = query.state.data;

      if (!events?.length) {
        return 3000;
      }

      const lastStage = events[events.length - 1]?.stage;

      if (
        lastStage === "INCIDENT_RESOLVED" ||
        lastStage === "JOB_FAILED" ||
        lastStage === "EMBEDDING_STORED"
      ) {
        return false;
      }

      return 3000;
    },
  });
}
