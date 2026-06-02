"use client";

import { useQuery } from "@tanstack/react-query";

import { getIncidents } from "../api/incident-api";

export function useIncidents() {
  return useQuery({
    queryKey: ["incidents"],

    queryFn: getIncidents,
  });
}
