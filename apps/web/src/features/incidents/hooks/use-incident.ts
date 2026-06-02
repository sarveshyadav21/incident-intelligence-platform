"use client";

import { useQuery } from "@tanstack/react-query";

import { getIncidentById } from "../api/incident-api";
import { incidentQueryKeys } from "./incident-query-keys";

export function useIncident(id: string | null) {
  return useQuery({
    queryKey: incidentQueryKeys.detail(id ?? ""),
    queryFn: () => getIncidentById(id!),
    enabled: Boolean(id),
  });
}
