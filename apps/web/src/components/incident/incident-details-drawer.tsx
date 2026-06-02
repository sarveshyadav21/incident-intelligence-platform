"use client";

import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { useIncident } from "../../features/incidents/hooks/use-incident";
import { useIncidentTimeline } from "../../features/incidents/hooks/use-incident-timeline";
import { useAnalysisJobsStore } from "../../features/incidents/store/analysis-jobs.store";
import { useIncidentJobId } from "../../features/incidents/hooks/use-incident-job-id";
import { IncidentDetailContent } from "./incident-detail-content";

type Props = {
  incidentId: string | null;
  onClose: () => void;
};

export function IncidentDetailsDrawer({ incidentId, onClose }: Props) {
  const { data: incident, isLoading } = useIncident(incidentId);
  const jobId = useIncidentJobId(incident ?? null);
  const liveStage = useAnalysisJobsStore((state) =>
    incidentId ? state.liveStages[incidentId] : undefined,
  );
  const { data: timelineEvents, isLoading: timelineLoading } =
    useIncidentTimeline(jobId ?? null);

  return (
    <AnimatePresence>
      {incidentId && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 100, opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={(event) => event.stopPropagation()}
            className="h-full w-full max-w-2xl overflow-y-auto border-l border-zinc-800 bg-zinc-950 p-8"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-zinc-500">
                Incident investigation
              </p>
              <button
                onClick={onClose}
                className="rounded-full p-2 text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            {isLoading || !incident ? (
              <p className="mt-8 text-zinc-500">Loading incident details...</p>
            ) : (
              <div className="mt-6">
                <IncidentDetailContent
                  incident={incident}
                  timelineEvents={timelineEvents}
                  timelineLoading={timelineLoading}
                  liveStage={liveStage}
                />
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
