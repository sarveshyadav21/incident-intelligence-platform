"use client";

import { useQuery } from "@tanstack/react-query";

import { getIncidentTrends } from "../api/incident-api";
import { incidentQueryKeys } from "./incident-query-keys";

export function useIncidentTrends() {
  return useQuery({
    queryKey: incidentQueryKeys.trends(),
    queryFn: getIncidentTrends,
  });
}
