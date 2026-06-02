"use client";

import { motion } from "framer-motion";

import { Incident } from "../../features/incidents/types/incident.type";

import { SeverityBadge } from "./severity-badge";

type Props = {
  incident: Incident;
  liveStage?: string;
};

export function IncidentCard({ incident, liveStage }: Props) {
  const severityStyles = {
    CRITICAL: "border-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.15)]",

    HIGH: "border-orange-500/20 shadow-[0_0_20px_rgba(249,115,22,0.12)]",

    MEDIUM: "border-yellow-500/20",

    PENDING: "border-blue-500/20 text-blue-400 bg-blue-500/5",

    LOW: "border-zinc-800",
  };
  const statusStyles = {
    COMPLETED: "border-emerald-500/20 text-emerald-400 bg-emerald-500/5",

    PROCESSING: "border-yellow-500/20 text-yellow-400 bg-yellow-500/5",

    PENDING: "border-blue-500/20 text-blue-400 bg-blue-500/5",

    FAILED: "border-red-500/20 text-red-400 bg-red-500/5",
  };

  return (
    <motion.div
      whileHover={{
        y: -4,
      }}
      transition={{
        duration: 0.2,
      }}
      className={`
  rounded-3xl border
  bg-zinc-900
  p-6
  ${severityStyles[incident.severity as keyof typeof severityStyles]}
`}
    >
      <div className="flex items-start justify-between">
        <div>
          <h3
            className="
              text-lg font-semibold
              text-white
            "
          >
            {incident.title}
          </h3>

          <p
            className="
              mt-2 line-clamp-2
              text-sm text-zinc-400
            "
          >
            {incident.summary}
          </p>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {incident.confidenceScore !== undefined &&
            incident.confidenceScore !== null && (
              <div
                className="
          rounded-full border
          border-violet-500/20
          bg-violet-500/5
          px-3 py-1 text-[11px]
          text-violet-300
        "
              >
                AI Confidence {incident.confidenceScore}%
              </div>
            )}

          {incident.affectedServices?.map((service) => (
            <div
              key={service}
              className="
        rounded-full border
        border-zinc-800
        bg-zinc-900
        px-3 py-1 text-[11px]
        text-zinc-400
      "
            >
              {service}
            </div>
          ))}
        </div>

        <SeverityBadge severity={incident.severity} />
      </div>

      <div
        className="
          mt-6 flex items-center
          justify-between
        "
      >
        <div
          className={`
    rounded-full border
    px-2.5 py-1
    text-[11px]
    font-medium
    tracking-wide
    w-fit
    ${statusStyles[incident.status as keyof typeof statusStyles]}
  `}
        >
          {incident.status}
          {liveStage && (
            <div
              className="
      mt-2 text-xs
      text-violet-400
    "
            >
              {liveStage.replaceAll("_", " ")}
            </div>
          )}
        </div>

        <p
          className="
            text-xs text-zinc-500
          "
        >
          {new Date(incident.createdAt).toLocaleString()}
        </p>
      </div>
    </motion.div>
  );
}
