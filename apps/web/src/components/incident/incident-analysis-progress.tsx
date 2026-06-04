"use client";

import { Check, Circle, Loader2, X } from "lucide-react";

import { buildAnalysisProgress } from "../../features/incidents/utils/analysis-progress";

type Props = {
  timelineStages: string[];
  incidentStatus?: string;
  liveStage?: string;
};

export function IncidentAnalysisProgress({
  timelineStages,
  incidentStatus,
  liveStage,
}: Props) {
  const steps = buildAnalysisProgress(
    timelineStages,
    incidentStatus,
    liveStage,
  );

  const isProcessing = incidentStatus === "PROCESSING" || Boolean(liveStage);

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-violet-400">
          Analysis progress
        </p>
        {isProcessing && (
          <span className="flex items-center gap-1 text-xs text-amber-400">
            <Loader2 className="h-3 w-3 animate-spin" />
            Live
          </span>
        )}
      </div>

      <ul className="space-y-2">
        {steps.map((step) => (
          <li key={step.id} className="flex items-center gap-3 text-sm">
            <StepIcon status={step.status} />
            <span
              className={
                step.status === "active"
                  ? "font-medium text-white"
                  : step.status === "completed"
                    ? "text-zinc-300"
                    : step.status === "failed"
                      ? "text-red-400"
                      : "text-zinc-600"
              }
            >
              {step.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StepIcon({ status }: { status: string }) {
  if (status === "completed") {
    return <Check className="h-4 w-4 text-emerald-400" />;
  }

  if (status === "active") {
    return <Loader2 className="h-4 w-4 animate-spin text-amber-400" />;
  }

  if (status === "failed") {
    return <X className="h-4 w-4 text-red-400" />;
  }

  return <Circle className="h-4 w-4 text-zinc-700" />;
}
