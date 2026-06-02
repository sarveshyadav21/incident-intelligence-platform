"use client";

import { useEffect } from "react";

import { useAnalysisJobsStore } from "../store/analysis-jobs.store";

import type { IncidentDetail } from "../types/incident.type";

export function useIncidentJobId(incident: IncidentDetail | null | undefined) {
  const incidentToJob = useAnalysisJobsStore((state) => state.incidentToJob);
  const registerJob = useAnalysisJobsStore((state) => state.registerJob);

  const storedJobId = incident ? incidentToJob[incident.id] : undefined;

  const timelineJobId = incident?.timelineEvents?.[0]?.jobId;

  useEffect(() => {
    if (!incident || storedJobId || !timelineJobId) {
      return;
    }

    registerJob(timelineJobId, incident.id);
  }, [incident, storedJobId, timelineJobId, registerJob]);

  return storedJobId ?? timelineJobId ?? null;
}
