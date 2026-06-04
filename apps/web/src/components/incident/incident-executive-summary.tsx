"use client";

import type { ExecutiveSummary } from "../../features/incidents/types/incident.type";

type Props = {
  summary: ExecutiveSummary | null | undefined;
};

export function IncidentExecutiveSummary({ summary }: Props) {
  if (!summary) {
    return (
      <p className="text-sm text-muted-foreground">
        Executive summary generates automatically after analysis completes.
      </p>
    );
  }

  const sections = [
    { title: "Incident Overview", body: summary.overview },
    { title: "Customer Impact", body: summary.customerImpact },
    { title: "Root Cause", body: summary.rootCause },
    { title: "Actions Taken", body: summary.actionsTaken },
    { title: "Recommended Follow-Ups", body: summary.followUps },
  ];

  return (
    <div className="space-y-4">
      {sections.map((section) => (
        <div
          key={section.title}
          className="rounded-xl border border-border bg-card/80 p-4"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-violet-400">
            {section.title}
          </p>
          <p className="mt-2 text-sm leading-6 text-foreground/80">{section.body}</p>
        </div>
      ))}
    </div>
  );
}
