"use client";

import { useQuery } from "@tanstack/react-query";

import { getJobStatus } from "../api/incident-api";
import { incidentQueryKeys } from "./incident-query-keys";

export function useJobStatus(jobId: string | null, enabled = true) {
  return useQuery({
    queryKey: incidentQueryKeys.job(jobId ?? ""),
    queryFn: () => getJobStatus(jobId!),
    enabled: Boolean(jobId) && enabled,
    refetchInterval: (query) => {
      const status = query.state.data?.status;

      if (status === "completed" || status === "failed") {
        return false;
      }

      return 2000;
    },
  });
}
