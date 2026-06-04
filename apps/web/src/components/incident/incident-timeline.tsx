"use client";

import { formatStageLabel } from "../../features/incidents/utils/timeline-metadata";

import type { IncidentTimelineEvent } from "../../features/incidents/types/incident.type";

type Props = {
  events: IncidentTimelineEvent[];
  isLoading?: boolean;
};

export function IncidentTimeline({ events, isLoading }: Props) {
  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading pipeline timeline...</p>;
  }

  if (!events.length) {
    return (
      <p className="text-sm text-muted-foreground">
        No timeline events yet. Start an analysis to see pipeline stages.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {events.map((event) => (
        <div key={event.id} className="flex gap-4">
          <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-violet-400" />

          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-zinc-200">
              {formatStageLabel(event.stage)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {new Date(event.createdAt).toLocaleString()}
            </p>
            {event.metadata && Object.keys(event.metadata).length > 0 && (
              <pre className="mt-2 max-h-32 overflow-auto rounded-xl border border-border bg-background p-3 text-[11px] text-muted-foreground">
                {JSON.stringify(event.metadata, null, 2)}
              </pre>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
