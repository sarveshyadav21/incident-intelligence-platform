"use client";

import { useState } from "react";
import { History } from "lucide-react";

import type { AnalysisRun } from "../../features/incidents/types/incident.type";

type Props = {
  runs: AnalysisRun[];
  onSelectRun?: (run: AnalysisRun) => void;
};

export function IncidentAnalysisHistory({ runs, onSelectRun }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(
    runs[0]?.id ?? null,
  );

  if (runs.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        Analysis history appears after the first completed run.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs text-zinc-500">
        <History className="h-4 w-4 text-violet-400" />
        {runs.length} analysis run{runs.length === 1 ? "" : "s"}
      </div>

      {runs.map((run) => {
        const selected = selectedId === run.id;

        return (
          <button
            key={run.id}
            type="button"
            onClick={() => {
              setSelectedId(run.id);
              onSelectRun?.(run);
            }}
            className={`w-full rounded-xl border px-4 py-3 text-left transition ${
              selected
                ? "border-violet-500/40 bg-violet-500/5"
                : "border-zinc-800 bg-zinc-950 hover:border-zinc-700"
            }`}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-zinc-200">
                Analysis Run #{run.runNumber}
              </p>
              <span className="text-xs text-zinc-500">{run.status}</span>
            </div>
            <p className="mt-1 text-xs text-zinc-500">
              {new Date(run.createdAt).toLocaleString()}
            </p>
            {run.confidenceScore != null && (
              <p className="mt-2 text-xs text-violet-300">
                Confidence {Math.round(run.confidenceScore)}%
              </p>
            )}
          </button>
        );
      })}

      {selectedId && (
        <RunComparison runs={runs} selectedId={selectedId} />
      )}
    </div>
  );
}

function RunComparison({
  runs,
  selectedId,
}: {
  runs: AnalysisRun[];
  selectedId: string;
}) {
  const selected = runs.find((run) => run.id === selectedId);
  const previous = runs.find(
    (run) => run.runNumber === (selected?.runNumber ?? 0) - 1,
  );

  if (!selected || !previous) {
    return null;
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 text-xs text-zinc-400">
      <p className="font-medium text-zinc-300">Comparison vs Run #{previous.runNumber}</p>
      <p className="mt-2">
        Confidence: {Math.round(previous.confidenceScore ?? 0)}% →{" "}
        {Math.round(selected.confidenceScore ?? 0)}%
      </p>
      {selected.rootCause !== previous.rootCause && (
        <p className="mt-1 text-amber-400">Root cause changed between runs</p>
      )}
    </div>
  );
}
