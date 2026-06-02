"use client";

import { useQuery } from "@tanstack/react-query";

import { getIncidents } from "../api/incident-api";
import { incidentQueryKeys } from "./incident-query-keys";

export function useIncidents() {
  return useQuery({
    queryKey: incidentQueryKeys.list(),
    queryFn: getIncidents,
  });
}
