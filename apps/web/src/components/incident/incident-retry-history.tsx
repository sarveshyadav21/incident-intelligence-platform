"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, RotateCcw } from "lucide-react";

import { getRetryHistory } from "../../features/incidents/api/incident-api";
import { incidentQueryKeys } from "../../features/incidents/hooks/incident-query-keys";

type Props = {
  incidentId: string;
};

type RetryEvent = {
  id: string;
  stage: string;
  createdAt: string;
  metadata?: {
    attempt?: number;
    maxAttempts?: number;
    succeeded?: boolean;
    error?: string;
  } | null;
};

export function IncidentRetryHistory({ incidentId }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: incidentQueryKeys.retryHistory(incidentId),
    queryFn: () => getRetryHistory(incidentId),
    staleTime: 30_000,
  });

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading retry history...</p>;
  }

  const events = (data ?? []) as RetryEvent[];

  if (events.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No retry attempts recorded for this incident.
      </p>
    );
  }

  const attempts = buildAttemptTimeline(events);

  return (
    <ul className="space-y-2">
      {attempts.map((attempt) => (
        <li
          key={attempt.label}
          className="flex items-start gap-3 rounded-xl border border-border bg-background px-4 py-3"
        >
          {attempt.succeeded ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-400" />
          ) : attempt.failed ? (
            <AlertCircle className="mt-0.5 h-4 w-4 text-red-400" />
          ) : (
            <RotateCcw className="mt-0.5 h-4 w-4 text-amber-400" />
          )}
          <div>
            <p className="text-sm text-zinc-200">{attempt.label}</p>
            {attempt.detail && (
              <p className="mt-1 text-xs text-muted-foreground">{attempt.detail}</p>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

function buildAttemptTimeline(events: RetryEvent[]) {
  const retryEvents = events.filter((event) =>
    ["JOB_RETRYING", "JOB_FAILED", "JOB_STARTED", "INCIDENT_RESOLVED"].includes(
      event.stage,
    ),
  );

  const attempts: Array<{
    label: string;
    detail?: string;
    succeeded?: boolean;
    failed?: boolean;
  }> = [];

  const retrying = retryEvents.filter((event) => event.stage === "JOB_RETRYING");

  retrying.forEach((event) => {
    const attempt = event.metadata?.attempt ?? attempts.length + 1;

    attempts.push({
      label: `Attempt ${attempt} failed`,
      detail: event.metadata?.error,
      failed: true,
    });
  });

  if (events.some((event) => event.stage === "INCIDENT_RESOLVED")) {
    const lastAttempt = (retrying.length || 0) + 1;

    attempts.push({
      label: `Attempt ${lastAttempt} succeeded`,
      succeeded: true,
    });
  } else if (events.some((event) => event.stage === "JOB_FAILED")) {
    const last = retrying[retrying.length - 1];
    const attempt = (last?.metadata?.attempt ?? retrying.length) + 1;

    if (!attempts.some((item) => item.label.includes(`Attempt ${attempt}`))) {
      attempts.push({
        label: `Attempt ${attempt} failed (final)`,
        detail: last?.metadata?.error,
        failed: true,
      });
    }
  }

  if (attempts.length === 0 && events.some((event) => event.stage === "JOB_STARTED")) {
    attempts.push({ label: "Attempt 1 started", succeeded: true });
  }

  return attempts;
}
