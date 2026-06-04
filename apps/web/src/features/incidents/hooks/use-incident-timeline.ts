"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { getIncidentTimeline } from "../api/incident-api";
import { useSocket } from "../../../providers/socket-provider";
import { incidentQueryKeys } from "./incident-query-keys";

import type { IncidentTimelineEvent } from "../types/incident.type";

type TimelineSocketEvent = {
  incidentId: string;
  jobId: string;
  event: {
    id: string;
    stage: string;
    createdAt: string;
    metadata?: Record<string, unknown> | null;
  };
};

export function useIncidentTimeline(
  jobId: string | null,
  incidentId?: string | null,
) {
  const { socket } = useSocket();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: incidentQueryKeys.timeline(jobId ?? ""),
    queryFn: () => getIncidentTimeline(jobId!),
    enabled: Boolean(jobId),
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!jobId) {
      return;
    }

    const onTimelineEvent = (payload: TimelineSocketEvent) => {
      if (payload.jobId !== jobId) {
        return;
      }

      if (incidentId && payload.incidentId !== incidentId) {
        return;
      }

      queryClient.setQueryData<IncidentTimelineEvent[]>(
        incidentQueryKeys.timeline(jobId),
        (current) => {
          const nextEvent: IncidentTimelineEvent = {
            id: payload.event.id,
            jobId: payload.jobId,
            incidentId: payload.incidentId,
            stage: payload.event.stage,
            createdAt: payload.event.createdAt,
            metadata: payload.event.metadata ?? null,
          };

          if (current?.some((event) => event.id === nextEvent.id)) {
            return current;
          }

          return [...(current ?? []), nextEvent];
        },
      );
    };

    socket.on("timeline-event", onTimelineEvent);

    return () => {
      socket.off("timeline-event", onTimelineEvent);
    };
  }, [socket, jobId, incidentId, queryClient]);

  return query;
}
