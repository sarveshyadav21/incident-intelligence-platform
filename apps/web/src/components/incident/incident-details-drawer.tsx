"use client";

import { X } from "lucide-react";

import { Incident } from "../../features/incidents/types/incident.type";
import { motion } from "framer-motion";
type Props = {
  incident: Incident | null;
  onClose: () => void;
};

export function IncidentDetailsDrawer({ incident, onClose }: Props) {
  if (!incident) return null;

  return (
    <div
      className="
        fixed inset-0 z-50
        flex justify-end
        bg-black/50 backdrop-blur-sm
      "
    >
      <motion.div
        initial={{
          x: 100,
          opacity: 0,
        }}
        animate={{
          x: 0,
          opacity: 1,
        }}
        exit={{
          x: 100,
          opacity: 0,
        }}
        transition={{
          duration: 0.25,
        }}
        className="
    h-full w-full max-w-2xl
    overflow-y-auto
    border-l border-zinc-800
    bg-zinc-950 p-8
  "
      >
        <div
          className="
            flex items-center
            justify-between
          "
        >
          <h2
            className="
              text-2xl font-bold
              text-white
            "
          >
            {incident.title}
          </h2>

          <button
            onClick={onClose}
            className="
              rounded-full p-2
              text-zinc-400 transition
              hover:bg-zinc-800
              hover:text-white
            "
          >
            <X size={20} />
          </button>
        </div>

        <div className="mt-8 space-y-6">
          <section>
            <h3
              className="
                text-sm font-medium
                uppercase tracking-wide
                text-zinc-500
              "
            >
              Summary
            </h3>

            <p
              className="
                mt-2 text-zinc-300
              "
            >
              {incident.summary}
            </p>
          </section>
          <div className="mt-8 space-y-6">
            {incident.aiSummary && (
              <div>
                <h3
                  className="
          text-sm font-semibold
          uppercase tracking-wide
          text-violet-400
        "
                >
                  AI Summary
                </h3>

                <p
                  className="
          mt-2 leading-7
          text-zinc-300
        "
                >
                  {incident.aiSummary}
                </p>
              </div>
            )}

            {incident.rootCause && (
              <div>
                <h3
                  className="
          text-sm font-semibold
          uppercase tracking-wide
          text-red-400
        "
                >
                  Root Cause Analysis
                </h3>

                <p
                  className="
          mt-2 leading-7
          text-zinc-300
        "
                >
                  {incident.rootCause}
                </p>
              </div>
            )}

            {incident.impactAssessment && (
              <div>
                <h3
                  className="
          text-sm font-semibold
          uppercase tracking-wide
          text-orange-400
        "
                >
                  Impact Assessment
                </h3>

                <p
                  className="
          mt-2 leading-7
          text-zinc-300
        "
                >
                  {incident.impactAssessment}
                </p>
              </div>
            )}

            {incident.detectionSource && (
              <div>
                <h3
                  className="
          text-sm font-semibold
          uppercase tracking-wide
          text-cyan-400
        "
                >
                  Detection Source
                </h3>

                <p
                  className="
          mt-2 text-zinc-300
        "
                >
                  {incident.detectionSource}
                </p>
              </div>
            )}

            {incident.remediationSteps &&
              incident.remediationSteps.length > 0 && (
                <div>
                  <h3
                    className="
            text-sm font-semibold
            uppercase tracking-wide
            text-emerald-400
          "
                  >
                    Remediation Steps
                  </h3>

                  <div className="mt-3 space-y-3">
                    {incident.remediationSteps.map((step, index) => (
                      <div
                        key={index}
                        className="
                  flex gap-3 rounded-2xl
                  border border-zinc-800
                  bg-zinc-900/60 p-4
                "
                      >
                        <div
                          className="
                    mt-0.5 flex h-6 w-6
                    items-center
                    justify-center rounded-full
                    bg-emerald-500/10
                    text-xs font-semibold
                    text-emerald-400
                  "
                        >
                          {index + 1}
                        </div>

                        <p
                          className="
                    text-sm leading-6
                    text-zinc-300
                  "
                        >
                          {step}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>
          <section>
            <h3
              className="
                text-sm font-medium
                uppercase tracking-wide
                text-zinc-500
              "
            >
              Severity
            </h3>

            <p
              className="
                mt-2 text-red-400
              "
            >
              {incident.severity}
            </p>
          </section>

          <section>
            <h3
              className="
                text-sm font-medium
                uppercase tracking-wide
                text-zinc-500
              "
            >
              Status
            </h3>

            <p
              className="
                mt-2 text-zinc-300
              "
            >
              {incident.status}
            </p>
          </section>
          <section>
            <h3
              className="
      text-sm font-medium
      uppercase tracking-wide
      text-zinc-500
    "
            >
              Root Cause Analysis
            </h3>

            <div
              className="
      mt-3 rounded-2xl
      border border-zinc-800
      bg-zinc-900/60
      p-4 text-sm
      leading-7 text-zinc-300
    "
            >
              {incident.rootCause ?? "AI analysis in progress..."}
            </div>
          </section>

          <section>
            <h3
              className="
      text-sm font-medium
      uppercase tracking-wide
      text-zinc-500
    "
            >
              Recommended Remediation
            </h3>

            <div
              className="
      mt-3 rounded-2xl
      border border-zinc-800
      bg-zinc-900/60
      p-4 text-sm
      leading-7 text-zinc-300
    "
            >
              {incident.remediation ?? "Remediation generation pending..."}
            </div>
          </section>
          <section>
            <h3
              className="
      text-sm font-medium
      uppercase tracking-wide
      text-zinc-500
    "
            >
              Incident Timeline
            </h3>

            <div className="mt-4 space-y-4">
              {[
                "Incident detected",
                "AI analysis started",
                "Root cause generated",
                "Remediation completed",
              ].map((event, index) => (
                <div
                  key={event}
                  className="
          flex gap-4
        "
                >
                  <div
                    className="
            mt-1 h-2 w-2
            rounded-full
            bg-violet-400
          "
                  />

                  <div>
                    <p
                      className="
              text-sm text-zinc-300
            "
                    >
                      {event}
                    </p>

                    <p
                      className="
              mt-1 text-xs
              text-zinc-500
            "
                    >
                      Step {index + 1}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </motion.div>
    </div>
  );
}
