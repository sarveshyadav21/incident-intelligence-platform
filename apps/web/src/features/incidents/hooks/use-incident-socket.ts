"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useSocket } from "../../../providers/socket-provider";
import { useAnalysisJobsStore } from "../store/analysis-jobs.store";
import { incidentQueryKeys } from "./incident-query-keys";

import type {
  AgentCompleteEvent,
  AgentTokenEvent,
  IncidentCompletedEvent,
  IncidentProgressEvent,
} from "../types/incident.type";

export function useIncidentSocket() {
  const { socket } = useSocket();
  const queryClient = useQueryClient();
  const setLiveStage = useAnalysisJobsStore((state) => state.setLiveStage);
  const pushActivity = useAnalysisJobsStore((state) => state.pushActivity);
  const appendStreamToken = useAnalysisJobsStore(
    (state) => state.appendStreamToken,
  );
  const setStreamComplete = useAnalysisJobsStore(
    (state) => state.setStreamComplete,
  );
  const clearStream = useAnalysisJobsStore((state) => state.clearStream);
  const jobToIncident = useAnalysisJobsStore((state) => state.jobToIncident);

  useEffect(() => {
    const onProgress = (payload: IncidentProgressEvent) => {
      const incidentId =
        payload.incidentId ?? jobToIncident[payload.jobId] ?? null;

      if (incidentId) {
        setLiveStage(incidentId, payload.stage);
      }

      pushActivity(
        `[${new Date().toLocaleTimeString()}] ${payload.stage.replaceAll("_", " ")}`,
      );
    };

    const onCompleted = (payload: IncidentCompletedEvent) => {
      const incidentId =
        payload.incidentId ??
        payload.result?.id ??
        jobToIncident[payload.jobId] ??
        null;

      if (incidentId) {
        setLiveStage(incidentId, "COMPLETED");
        clearStream(incidentId);
        queryClient.invalidateQueries({
          queryKey: incidentQueryKeys.detail(incidentId),
        });
      }

      queryClient.invalidateQueries({ queryKey: incidentQueryKeys.list() });
      queryClient.invalidateQueries({ queryKey: incidentQueryKeys.trends() });

      if (payload.jobId) {
        queryClient.invalidateQueries({
          queryKey: incidentQueryKeys.job(payload.jobId),
        });
        queryClient.invalidateQueries({
          queryKey: incidentQueryKeys.timeline(payload.jobId),
        });
      }

      toast.success("Incident analysis completed");
    };

    const onAgentToken = (payload: AgentTokenEvent) => {
      appendStreamToken(payload.incidentId, payload.agent, payload.token);
    };

    const onAgentComplete = (payload: AgentCompleteEvent) => {
      setStreamComplete(payload.incidentId, payload.agent, payload.content);
    };

    socket.on("incident-progress", onProgress);
    socket.on("incident-completed", onCompleted);
    socket.on("agent-token", onAgentToken);
    socket.on("agent-complete", onAgentComplete);

    return () => {
      socket.off("incident-progress", onProgress);
      socket.off("incident-completed", onCompleted);
      socket.off("agent-token", onAgentToken);
      socket.off("agent-complete", onAgentComplete);
    };
  }, [
    socket,
    queryClient,
    setLiveStage,
    pushActivity,
    appendStreamToken,
    setStreamComplete,
    clearStream,
    jobToIncident,
  ]);
}
