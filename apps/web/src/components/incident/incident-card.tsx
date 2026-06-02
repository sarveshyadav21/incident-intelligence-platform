"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";

import { Incident } from "../../features/incidents/types/incident.type";
import { useReanalyzeIncident } from "../../features/incidents/hooks/use-incident-mutations";
import { SeverityBadge } from "./severity-badge";

type Props = {
  incident: Incident;
  liveStage?: string;
};

export function IncidentCard({ incident, liveStage }: Props) {
  const reanalyze = useReanalyzeIncident();
  const severityStyles = {
    CRITICAL: "border-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.15)]",
    HIGH: "border-orange-500/20 shadow-[0_0_20px_rgba(249,115,22,0.12)]",
    MEDIUM: "border-yellow-500/20",
    LOW: "border-zinc-800",
  };

  const statusStyles = {
    COMPLETED: "border-emerald-500/20 text-emerald-400 bg-emerald-500/5",
    PROCESSING: "border-yellow-500/20 text-yellow-400 bg-yellow-500/5",
    PENDING: "border-blue-500/20 text-blue-400 bg-blue-500/5",
    FAILED: "border-red-500/20 text-red-400 bg-red-500/5",
  };

  const displaySeverity = incident.aiSeverity ?? incident.severity;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className={`rounded-3xl border bg-zinc-900 p-6 ${
        severityStyles[displaySeverity as keyof typeof severityStyles] ??
        severityStyles.LOW
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold text-white">{incident.title}</h3>
          <p className="mt-2 line-clamp-2 text-sm text-zinc-400">
            {incident.aiSummary ?? incident.summary ?? "No summary yet"}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {incident.confidenceScore != null && (
              <div className="rounded-full border border-violet-500/20 bg-violet-500/5 px-3 py-1 text-[11px] text-violet-300">
                AI Confidence {Math.round(incident.confidenceScore)}%
              </div>
            )}

            {incident.aiSeverity &&
              incident.aiSeverity !== incident.severity && (
                <div className="rounded-full border border-violet-500/20 bg-violet-500/5 px-3 py-1 text-[11px] text-violet-300">
                  AI severity: {incident.aiSeverity}
                </div>
              )}

            {incident.affectedServices?.map((service) => (
              <div
                key={service}
                className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-[11px] text-zinc-400"
              >
                {service}
              </div>
            ))}
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <SeverityBadge severity={incident.severity} />
          {incident.aiSeverity && incident.aiSeverity !== incident.severity && (
            <SeverityBadge severity={incident.aiSeverity} />
          )}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <div
          className={`w-fit rounded-full border px-2.5 py-1 text-[11px] font-medium tracking-wide ${
            statusStyles[incident.status as keyof typeof statusStyles] ??
            statusStyles.PENDING
          }`}
        >
          <span>{incident.status}</span>
          {liveStage && (
            <p className="mt-1 text-violet-400">
              {liveStage.replaceAll("_", " ")}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {incident.status === "FAILED" && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                reanalyze.mutate(incident.id);
              }}
              disabled={reanalyze.isPending}
              className="inline-flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300"
            >
              <RefreshCw className="h-3 w-3" />
              Retry
            </button>
          )}
          <p className="text-xs text-zinc-500">
            {new Date(incident.createdAt).toLocaleString()}
          </p>
          <Link
            href={`/incidents/${incident.id}`}
            className="text-xs text-violet-400 hover:text-violet-300"
            onClick={(event) => event.stopPropagation()}
          >
            Open
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
