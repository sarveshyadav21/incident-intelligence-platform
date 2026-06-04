"use client";

import type { AgentEvent } from "@/types/agent-event";

type Props = {
  events: AgentEvent[];
};

export function IncidentAgentLifecycle({ events }: Props) {
  if (events.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        Agent lifecycle events will appear here during analysis.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {events.map((event, index) => (
        <div
          key={`${event.agent}-${event.timestamp}-${index}`}
          className={`rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 transition ${
            event.status === "STARTED" ? "animate-pulse" : ""
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium capitalize text-white">
                {event.agent}
              </p>
              <p className="mt-0.5 text-xs text-zinc-500">
                {new Date(event.timestamp).toLocaleTimeString()}
              </p>
            </div>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                event.status === "COMPLETED"
                  ? "bg-emerald-500/20 text-emerald-400"
                  : event.status === "FAILED"
                    ? "bg-red-500/20 text-red-400"
                    : "bg-yellow-500/20 text-yellow-400"
              }`}
            >
              {event.status}
            </span>
          </div>
          {event.durationMs != null && (
            <p className="mt-2 text-xs text-zinc-500">
              {(event.durationMs / 1000).toFixed(1)}s
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
